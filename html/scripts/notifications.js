import { ElementBuilder, GlobalCardsData, GlobalWordsData } from './root.js';

function valueOrIfNotExists(val, alternative) {
    if(val !== undefined && val !== null)
        return val;
    return alternative;
}

function parseCheckboxValue(value) {
    const val1 = valueOrIfNotExists(value);
    if(typeof val1 === 'boolean') return val1;
    if(val1 === 'on') return true;
    return false;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");
    return `${hours}:${mins}`;
}

function parseTime(value) {
    const [hours, mins] = value.split(":").map(Number);
    return hours * 60 + mins;
}

let notificationTimeId = null, storedNotificationsStatus = null;

function createNotificationElement(type, body) {
    const element = ElementBuilder.create('div').addClasses('notification').appendElements(
        ElementBuilder.create('div').addClasses('top-bar').appendElements(
            ElementBuilder.create('div').addClasses('title').setInnerHTML(body.title).get(),
            ElementBuilder.create('div').addClasses('time').setInnerHTML(body.date).get(),
            ElementBuilder.create('div').addClasses('close').appendElements(
                ElementBuilder.create('i').addClasses('fa-solid', 'fa-xmark').get()
            ).get()
        ).get(),
    ).get();
    element.querySelector('.close').addEventListener('click', () => {
        element.remove();
        storedNotificationsStatus.remove((element) => element.type === type && JSON.stringify(body) === JSON.stringify(element.body));
    });
    let content;
    if(type === 'word') {
        content = ElementBuilder.create('div').addClasses('notification-word').setInnerHTML(body.word).get();
        content.addEventListener('click', () => {
            if(body.source === 'app') {
                const globalSearchInput = document.getElementById('global-search-input');
                globalSearchInput.value = body.word;
                globalSearchInput.dispatchEvent(new Event('input'));
                document.getElementById('vocabulary').dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
                document.querySelector('.words-btn').dispatchEvent(new Event('click'));
            } else {
                window.open(`https://www.oxfordlearnersdictionaries.com/search/english/?q=${body.word}`);
            }
        });
    } else {
        content = ElementBuilder.create('div').addClasses('notification-card').appendElements(
            ElementBuilder.create('div').addClasses('name').setInnerHTML(body.cardName).get(),
            document.createTextNode(body.text)
        ).get();
    }

    element.append(content);
    return element;
}

function planNotification() {
    const startSettings = collectAllUserNotificationSettings();
    notificationTimeId = setTimeout(async () => {
        const settings = collectAllUserNotificationSettings();
        const container = document.querySelector('.notifications-content');
        const notifications = [];
        const date = new Date();
        const dateString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        if(settings.vocabularyNotifications) {
            const randomWordOrCard = await window.wordAPI.getNextRandomWordOrCard(settings.useWords, settings.useCards, settings.applyTrainingFilter);
            if(randomWordOrCard) {
                if(randomWordOrCard.type === 'word') {
                    notifications.push(createNotificationElement('word', {
                        title: 'Remember meaning',
                        word: randomWordOrCard.word_spelling,
                        source: 'app',
                        date: dateString
                    }));
                    storedNotificationsStatus.add({type: 'word', body: {title: 'Remember meaning', word: randomWordOrCard.word_spelling, source: 'app', date: dateString}});
                } else {
                    notifications.push(createNotificationElement('card', {
                        title: 'Read notes',
                        cardName: randomWordOrCard.card.cardName,
                        text: randomWordOrCard.card.data.text,
                        date: dateString
                    }));
                    storedNotificationsStatus.add({type: 'card', body: {title: 'Read notes', cardName: randomWordOrCard.card.cardName, text: randomWordOrCard.card.data.text, date: dateString}});
                }
            }
        }
        if(settings.oxfordWord) {
            const oxfordWord = await window.wordAPI.getNextOxfordB2C1();
            if(oxfordWord) {
                notifications.push(createNotificationElement('word', {
                    title: 'New word?',
                    word: oxfordWord,
                    source: 'oxford',
                    date: dateString
                }));
                storedNotificationsStatus.add({type: 'word', body: {title: 'New word?', word: oxfordWord, source: 'oxford', date: dateString}});
            }
        }
        container.append(...notifications);
        if(notifications.length !== 0 && !document.querySelector('.notifications-icon.active')) {
            document.querySelector('.notifications-icon .notification-signal').style.removeProperty('display');
            storedNotificationsStatus.setAllAreRead(false);
        }
            
        notificationTimeId = null;
        if(settings.informInOS)
            window.settingsAPI.notifyUserAboutWord();
        restartNotifications()
    }, startSettings.periodMinutes*60*1000);
    const notificationDate = new Date(Date.now() + startSettings.periodMinutes*60*1000);
    document.getElementById('next-notification-time').innerHTML = `${String(notificationDate.getHours()).padStart(2, "0")}:${String(notificationDate.getMinutes()).padStart(2, "0")}`;
}

async function countWordsForNotifications() {
    const settings = collectAllUserNotificationSettings();
    if(!settings.applyTrainingFilter) return await window.wordAPI.getWordsNumber();
    return await window.wordAPI.getTrainingWordsNumber();
}

async function countCardsForNotifications() {
    const settings = collectAllUserNotificationSettings();
    if(!settings.applyTrainingFilter) return await window.wordAPI.getCardsNumber();
    return await window.wordAPI.getTrainingCardsNumber();
}

async function showWordsAndCardsAbsenceWarning() {
    const useWordsWarningEl = document.getElementById('use-words-warning');
    const useCardsWarningEl = document.getElementById('use-cards-warning');
    const promise1 = countWordsForNotifications().then(count => {
        if(count === 0) {
            if(!useWordsWarningEl.classList.contains('show')) useWordsWarningEl.classList.add('show');
        } else {
            if(useWordsWarningEl.classList.contains('show')) useWordsWarningEl.classList.remove('show');
        }
    });
    
    const promise2 = countCardsForNotifications().then(count => {
        if(count === 0) {
            if(!useCardsWarningEl.classList.contains('show')) useCardsWarningEl.classList.add('show');
        } else {
            if(useCardsWarningEl.classList.contains('show')) useCardsWarningEl.classList.remove('show');
        }
    });

    return Promise.all([promise1, promise2]);
}

function resetIfNotificationUnavailable() {
    const useWordsWarningEl = document.getElementById('use-words-warning');
    const useCardsWarningEl = document.getElementById('use-cards-warning');
    const settings = collectAllUserNotificationSettings();
    const wordsAvailable = !useWordsWarningEl.classList.contains('show');
    const cardsAvailable = !useCardsWarningEl.classList.contains('show');
    let available = settings.oxfordWord || 
        (settings.vocabularyNotifications && ((settings.useWords && wordsAvailable) || (settings.useCards && cardsAvailable)));
    if(!available && notificationTimeId !== null) restartNotifications();
    else if(available && notificationTimeId === null) restartNotifications();
}

function restartNotifications() {
    if(notificationTimeId !== null) {
        clearTimeout(notificationTimeId);
        notificationTimeId = null;
        document.getElementById('next-notification-time').innerHTML = 'No planned';
    }
    const settings = collectAllUserNotificationSettings();
    if(!settings.areNotificationsActive) return;
    if(!settings.vocabularyNotifications && !settings.oxfordWord) return;
    const wordsAbscent = !settings.useWords || document.getElementById('use-words-warning').classList.contains('show');
    const cardsAbscent = !settings.useCards || document.getElementById('use-cards-warning').classList.contains('show');
    if(!settings.oxfordWord && wordsAbscent && cardsAbscent) return;
    planNotification();
}

async function initUserNotificationSettings() {
    const notificationSettingsForm = document.getElementById('notification-settings-form');
    const settings = await window.settingsAPI.getNotificationsSettings();
    if(!settings) return;
    const mapNameAndKey = {
        'notifications' : 'areNotificationsActive',
        'inform-notifications' : 'informInOS',
        'vocabulary-notifications' : 'vocabularyNotifications',
        'vocabulary-words' : 'useWords',
        'vocabulary-cards' : 'useCards',
        'vocabulary-training-filter' : 'applyTrainingFilter',
        'oxford-word' : 'oxfordWord',
        'period' : 'periodMinutes'
    };
    for(const [name, key] of Object.entries(mapNameAndKey)) {
        if(name === 'period')
            notificationSettingsForm.querySelector(`input[name="${name}"]`).value = formatTime(settings[key]);
        else 
            notificationSettingsForm.querySelector(`input[name="${name}"]`).checked = settings[key];
    }
}

async function initStoredNotifications() {
    const status = await window.settingsAPI.getStoredNotificationsStatus();
    if(!status) storedNotificationsStatus = {
        stored: [],
        allAreRead: true
    };
    else storedNotificationsStatus = status;

    storedNotificationsStatus.add = (x) => {
        storedNotificationsStatus.stored.push(x);
        window.settingsAPI.setStoredNotificationsStatus({stored: storedNotificationsStatus.stored, allAreRead: storedNotificationsStatus.allAreRead});
    };

    storedNotificationsStatus.remove = (predicate) => {
        const index = storedNotificationsStatus.stored.findIndex(predicate);
        if(index !== -1) {
            storedNotificationsStatus.stored.splice(index, 1);
            window.settingsAPI.setStoredNotificationsStatus({stored: storedNotificationsStatus.stored, allAreRead: storedNotificationsStatus.allAreRead});
        }
    };

    storedNotificationsStatus.setAllAreRead = (val) => {
        storedNotificationsStatus.allAreRead = val;
        window.settingsAPI.setStoredNotificationsStatus({stored: storedNotificationsStatus.stored, allAreRead: storedNotificationsStatus.allAreRead});
    };
    
    const notificationsIcon = document.querySelector('.notifications-icon');
    notificationsIcon.addEventListener('click', (e) => {
        return setTimeout(() => {
            if(notificationsIcon.classList.contains('active')) {
                storedNotificationsStatus.setAllAreRead(true);
            }
        }, 0);
    });

    document.querySelector('.notifications-content').append(...storedNotificationsStatus.stored.map(obj => createNotificationElement(obj.type, obj.body)));
    if(!storedNotificationsStatus.allAreRead && !document.querySelector('.notifications-icon.active'))
        document.querySelector('.notifications-icon .notification-signal').style.removeProperty('display');   
}

async function addSwitchingNotificationsLogic() {
    const notificationSettingsForm = document.getElementById('notification-settings-form');
    const vocabularyNotificationsInput = document.querySelector('input[name="vocabulary-notifications"]');
    const useWordsInput = document.querySelector('input[name="vocabulary-words"]');
    const useCardsInput = document.querySelector('input[name="vocabulary-cards"]');
    const activateNotificationsInput = document.querySelector('input[name="notifications"]');
    const oxfordB2C1Input = document.querySelector('input[name="oxford-word"]');
    const activateFilterInput = document.querySelector('input[name="vocabulary-training-filter"]');
    
    const updateSettings = async (e) => {
        if([useWordsInput, useCardsInput].includes(e.target)) {
            return setTimeout(() => window.settingsAPI.setNotificationsSettings(collectAllUserNotificationSettings()), 0);
        }
            
        window.settingsAPI.setNotificationsSettings(collectAllUserNotificationSettings());
    };

    Array.from(notificationSettingsForm.querySelectorAll('input[type="checkbox"]')).forEach(
        checkbox => checkbox.addEventListener('change', updateSettings)
    );

    const periodInputContainer = notificationSettingsForm.querySelector('.time-input-container');
    const increasePeriodBtn = periodInputContainer.querySelector('.btn-increase');
    const decreasePeriodBtn = periodInputContainer.querySelector('.btn-decrease');
    [decreasePeriodBtn, increasePeriodBtn].forEach(btn => btn.addEventListener('click', updateSettings))

   
    vocabularyNotificationsInput.addEventListener('change', (e) => {
        if(!useWordsInput.checked && !useCardsInput.checked && vocabularyNotificationsInput.checked) {
            useWordsInput.checked = true;
            useCardsInput.checked = true;
        }
        resetIfNotificationUnavailable();
    });

    useWordsInput.addEventListener('change', (e) => {
        if(!useWordsInput.checked && !useCardsInput.checked && vocabularyNotificationsInput.checked) {
            vocabularyNotificationsInput.checked = false;
            vocabularyNotificationsInput.dispatchEvent(new Event('change'));
        } 
        resetIfNotificationUnavailable();
    });

    useCardsInput.addEventListener('change', (e) => {
        if(!useWordsInput.checked && !useCardsInput.checked && vocabularyNotificationsInput.checked) {
            vocabularyNotificationsInput.checked = false;
            vocabularyNotificationsInput.dispatchEvent(new Event('change'));
        }
        resetIfNotificationUnavailable();
    });

    activateNotificationsInput.addEventListener('change', () => {
        restartNotifications();
    });

    activateFilterInput.addEventListener('change', async () => {
        await showWordsAndCardsAbsenceWarning();
        resetIfNotificationUnavailable();
    });

    oxfordB2C1Input.addEventListener('change', () => {
        resetIfNotificationUnavailable(); 
    });
    document.getElementById('restart-notifications').addEventListener('click', restartNotifications);
}

function collectAllUserNotificationSettings() {
    const notificationSettingsForm = document.getElementById('notification-settings-form');
    const formData = new FormData(notificationSettingsForm);
    return {
        areNotificationsActive: parseCheckboxValue(formData.get('notifications')),
        informInOS: parseCheckboxValue(formData.get('inform-notifications')),
        vocabularyNotifications: parseCheckboxValue(formData.get('vocabulary-notifications')),
        useWords: parseCheckboxValue(formData.get('vocabulary-words')),
        useCards: parseCheckboxValue(formData.get('vocabulary-cards')),
        applyTrainingFilter: parseCheckboxValue(formData.get('vocabulary-training-filter')),
        oxfordWord: parseCheckboxValue(formData.get('oxford-word')),
        periodMinutes: parseTime(formData.get('period'))
    };
}

function addTimeInputLogic() {
    const timeInputContainers = document.querySelectorAll('.time-input-container');
    const step = 15;
    const minTime = 15; 
    const maxTime = 180;

    Array.from(timeInputContainers).forEach(timeInputContainer => {
        const timeInput = timeInputContainer.querySelector(".time-input");
        const decreaseBtn = timeInputContainer.querySelector(".btn-decrease");
        const increaseBtn = timeInputContainer.querySelector(".btn-increase");

        function updateTime(offset) {
            let currentMinutes = parseTime(timeInput.value);
            let newMinutes = currentMinutes + offset;

            if (newMinutes < minTime) {
                newMinutes = minTime;
            } else if (newMinutes > maxTime) {
                newMinutes = maxTime;
            }

            timeInput.value = formatTime(newMinutes);

            decreaseBtn.disabled = newMinutes === minTime;
            increaseBtn.disabled = newMinutes === maxTime;
        }

        updateTime(0);

        decreaseBtn.addEventListener("click", () => updateTime(-step));
        increaseBtn.addEventListener("click", () => updateTime(step));
    })
    
    
}

export function addNotificationsLogic() {
    
    Promise.all([
        addSwitchingNotificationsLogic(),
        initUserNotificationSettings()
    ])
    .then(showWordsAndCardsAbsenceWarning)
    .then(() => {
        restartNotifications();
        initStoredNotifications();
    });
    addTimeInputLogic();
    
    

    const actionOnDataUpdate = async () => {
        await showWordsAndCardsAbsenceWarning();
        resetIfNotificationUnavailable();
    };

    GlobalWordsData.onUpdateWords(actionOnDataUpdate);
    GlobalWordsData.onUpdateTrainingInfo(actionOnDataUpdate);
    GlobalCardsData.onUpdateCards(actionOnDataUpdate);
    GlobalCardsData.onUpdateTrainingInfo(actionOnDataUpdate);
}