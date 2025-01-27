import { GlobalWordsData, Config } from "./root.js";
import { addWordsLogic, showWords } from "./words.js";
import { addFormLogic } from "./form.js";
import { addTestingLogic, addInputNumberLogic } from "./training-testing.js";
import { addMatchingLogic } from "./training-matching.js";
import { addCardFormLogic } from "./card-form.js";
import { addSettingsLogic } from "./settings.js";
import { addNotificationsLogic } from "./notifications.js";

window.addEventListener('load', async () => {
    addMenuOpenBtnLogic();
    addNotificationOpenBtnLogic();
    addMenuPagesLogic();
    addWordsLogic();
    addFormLogic();
    addInputNumberLogic();
    addCardFormLogic();
    addSettingsLogic();
    addNotificationsLogic();
    
    showWords();
    initGlobalWordsData().then(() => {
        addTestingLogic();
        addMatchingLogic();
    });
});

function addMenuOpenBtnLogic() {
    const menuBtn = document.querySelector('.menu-icon');
    const notificationsBtn = document.querySelector('.notifications-icon');
    const menuContainer = document.querySelector('.menu-container');
    const menuStatus = ((status) => {
        return {
            getStatus: () => status, 
            switchStatus: () => status = (status + 1)%2
        };  
    })(0);
    menuBtn.addEventListener('click', (e) => {
        if(menuStatus.getStatus() === 0) {
            if(!menuBtn.classList.contains('active')) menuBtn.classList.add('active');
            if(notificationsBtn.classList.contains('active')) notificationsBtn.dispatchEvent(new Event('click'));
            menuContainer.style.display = 'flex';
        } else {
            if(menuBtn.classList.contains('active')) menuBtn.classList.remove('active');
            menuContainer.style.display = 'none';
        } 
        menuStatus.switchStatus();
    });
}

function addMenuPagesLogic() {
    const menuOptionsContainer = document.querySelector('.menu-container');
    const menuOptionsStatus = ((activeOptionId) => {
        return {
            getActiveOptionId: () => activeOptionId,
            setActiveOptionId: (id) => activeOptionId = id
        };
    })('vocabulary');
    
    const optionIdToElementMap = {
        'vocabulary' : document.querySelector('.vocabulary-container'),
        'new-word' : document.querySelector('.form-container'),
        'testing' : document.querySelector('.testing-container'),
        'matching' : document.querySelector('.matching-container'),
        'new-card' : document.querySelector('.card-form-container'),
        'notifications' : document.querySelector('.notifications-contatiner'),
        'settings' : document.querySelector('.settings-container')
    };

    menuOptionsContainer.addEventListener('click', (e) => {
        const targetId = e.target.id;
        const globalSearchContainer = document.querySelector('.search-container');
        if(targetId === 'vocabulary') globalSearchContainer.style.removeProperty('display');
        else globalSearchContainer.style.display = 'none';

        if(!Object.keys(optionIdToElementMap).includes(targetId)) return;
        if(targetId === menuOptionsStatus.getActiveOptionId()) return;
        const targetOptionBtn = document.querySelector(`#${targetId}`);
        const currentActiveOptionBtn = document.querySelector(`#${menuOptionsStatus.getActiveOptionId()}`);

        targetOptionBtn.classList.add('current');
        currentActiveOptionBtn.classList.remove('current');

        optionIdToElementMap[menuOptionsStatus.getActiveOptionId()].style.display = 'none';
        optionIdToElementMap[targetId].style.removeProperty('display');

        menuOptionsStatus.setActiveOptionId(targetId);
    });
}

async function initGlobalWordsData() {
    return Promise.all([
        GlobalWordsData.updateMatchingValidationSum(),
        GlobalWordsData.updateMaxRecordsNumberOfAllWords(),
        GlobalWordsData.updateTrainingTableRows(),
        GlobalWordsData.updateTrainingWordsNumber(),
    ]);
}

function addNotificationOpenBtnLogic() {
    const btn = document.querySelector('.notifications-icon');
    const menuBtn = document.querySelector('.menu-icon');
    const notificationsContainer = document.querySelector('.notifications-container');
    const status = ((status) => {
        return {
            getStatus: () => status, 
            switchStatus: () => status = (status + 1)%2
        };  
    })(0);

    btn.addEventListener('click', () => {
        if(status.getStatus() === 1) {
            btn.classList.remove('active')
            notificationsContainer.style.display = 'none';
        } else {
            btn.querySelector('.notification-signal').style.display = 'none';
            btn.classList.add('active');
            if(menuBtn.classList.contains('active')) menuBtn.dispatchEvent(new Event('click'));
            notificationsContainer.style.removeProperty('display');
        }
        status.switchStatus();
    });
}