const { app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require('node:path');
const fs = require('node:fs');

const { WordAPI } = require('./db-api/word-api');
const { Word } = require('./dto/word-dto');
const CardDto = require('./dto/card-dto');
const config = require('./config');
const MatchingBuilder = require('./dto/mathing-builder');
const UserSettings = require('./user-settings.js');
const { createWordNotification } = require('./notifications/word-notification.js');

const wordAPI = new WordAPI();
function handleGetWordsPage(event, pageNumber, pageCapacity) {
    return wordAPI.getWordsPageAsync(pageNumber, pageCapacity).catch(console.log);
}

function handleSaveWord(event, word) {
    const wordClassInstance = new Word(
        word.spelling,
        word.translationsArr,
        word.explanationsArr,
        word.examplesArr
    );
    return wordAPI.saveWordAsync(wordClassInstance).catch(console.log);
}

function handleDeleteWordById(event, wordId) {
    return wordAPI.deleteByIdAsync(wordId);
}

function handleGetWordsNumber(event, qry) {
    return wordAPI.getWordsNumberAsync(qry);
}

// returns array of objects [{word, options: [str]}]
async function handleWordsTests(event, questionsNumber, optionsNumber, modeName) {
    const validInfo = await handleTestingValidationValues(null, modeName);
    const cond1 = validInfo.maxRecordsNumberOfAllWords <= validInfo.tableRows - optionsNumber + 1;
    const cond2 = validInfo.wordsNumber > 1;
    const cond3 = validInfo.tableRows >= questionsNumber;
    const valid = cond1 && cond2 && cond3;
    if(!valid) return Promise.reject(new Error("You can't create tests with these parameters."));
    return await wordAPI.getSampleOfForeignRows(questionsNumber, modeName)
        .then(records => {
            return Promise.all(records.map(async record => {
                return {
                    word: (await wordAPI.getWordByIdAsync(record.word_id)).spelling,
                    options: [record.value, 
                        ...(await wordAPI.getSampleOfForeignRows(optionsNumber - 1, modeName, [record.word_id])).map(x => x.value)]
                };
            }));
        });
}

// returns array of objects [{word, record}]
async function handleWordsMatching(event, questionsNumber, pairsPerQuestion, modeName) {
    const valid = await Promise.all(
        [wordAPI.getWordsNumberAsync(), wordAPI.getMatchingValidationValue(modeName, pairsPerQuestion)]
    ).then(results => (results[0] >= pairsPerQuestion) && (results[1] >= questionsNumber*pairsPerQuestion));
    if(!valid) Promise.reject(new Error("You can't create matching testing with these parameters."));
    const matchingBuilder = new MatchingBuilder(questionsNumber, pairsPerQuestion);
    const wordIdArrIgnore = [];
    try {
        while(!matchingBuilder.isBuildingFinished()) {
            const val = await wordAPI.getForeignRowsForWordsSample(
                config.MATCHING_BATCH_PICK_SIZE, 
                Math.min(questionsNumber, config.MATCHING_MAX_RECORDS_PER_WORD),
                modeName, 
                wordIdArrIgnore
            ).then(wordAndRecordsArr => {
                if(wordAndRecordsArr.length === 0) {
                    return 'break';
                }
                const pairsArr = wordAndRecordsArr.map(wordAndRecords => {
                    wordIdArrIgnore.push(wordAndRecords.word_id);
                    return wordAndRecords.recordsArr.map(record => {
                        return {
                            word: wordAndRecords.spelling,
                            record: record
                        };
                    });
                });
                pairsArr.forEach(pairs => matchingBuilder.insertPairs(pairs));
            });
            if(val === 'break') break;
        }
        return matchingBuilder.getFinalMatchingTest();
    } catch(e) {
        console.log(e);
    }
    
}

function handleWordsTrainingInfo(event, pageNumber, pageCapacity, query) {
    if(!query) query = '';
    return wordAPI.getSpellingAndTrainingEnabled(pageNumber, pageCapacity, query);
}

function handleUpdateWordTrainingInfo(event, updatedItems) {
    return wordAPI.updateWordsTrainingInfo(updatedItems.filter(x => x.trainingEnabled !== x.trainingEnabledBefore)
    .map(x => {
        return {
            id: x.id,
            spelling: x.spelling,
            trainingDisabled: !x.trainingEnabled
        };
    }));
}

function handleTrainingWordsNumber(event) {
    return wordAPI.getTrainingWordsNumber();
}

async function handleTestingValidationValues(event, modeName) {
    const valid = await Promise.all(
        [wordAPI.getMaxRecordsNumberOfAllWords(modeName), wordAPI.countForeignTableRows(modeName), wordAPI.getWordsNumberAsync()]);
    return {
        maxRecordsNumberOfAllWords: valid[0],
        tableRows: valid[1],
        wordsNumber: valid[2]
    };
}

function handleMatchingValidationSum(event, modeName) {
    return wordAPI.getMatchingValidationValue(modeName, config.MATCHING_MAX_RECORDS_PER_WORD);
}

function handleTrainingTableRowsNumber(event, modeName) {
    return wordAPI.countForeignTableRows(modeName);
}

function handleMaxRecordsNumberOfAllWords(event, modeName) {
    return wordAPI.getMaxRecordsNumberOfAllWords(modeName).then(max => Math.min(config.TESTING_MAX_RECORDS_PER_WORD, max));
}

function handleWordPageByQuery(event, pageNumber, pageCapacity, query) {
    return wordAPI.getWordsPageByQuery(pageNumber, pageCapacity, query);
}

function handleSaveCard(event, card) {
    return wordAPI.saveCard(new CardDto(card.cardName, card.dataObj));
}

function handleWordUpdate(event, word) {
    return wordAPI.updateWord(word);
}

function handleCardsPage(event, pageNumber, pageCapacity, qry) {
    return wordAPI.getCardsPage(pageNumber, pageCapacity, qry);
}

function handleCardUpdate(event, card) {
    return wordAPI.updateCard(card);
}

function handleDeleteCardById(event, cardId) {
    return wordAPI.deleteCardById(cardId);
}

function handleCardsNumber(event, qry) {
    if(!qry) qry = '';
    return wordAPI.getCardsNumber(qry);
}

function handleSetNotificationsSettings(event, settings) {
    if(typeof settings !== 'object') return;
    UserSettings.setSetting('NotificationsSettings', settings);
}

function handleGetNotificationSettings(event) {
    return UserSettings.readSettings()['NotificationsSettings'];
}

function handleNextOxfordB2C1(event) {
    let oxfordB2C1Index = UserSettings.readSettings()['OxfordB2C1Index'];
    if(oxfordB2C1Index !== 0 && !oxfordB2C1Index) {
        oxfordB2C1Index = 0;
        UserSettings.setSetting('OxfordB2C1Index', 0);
    }
    const words_array = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'shuffled_oxfordB2C1.json'), 'utf8'));
    const word = words_array[oxfordB2C1Index];
    oxfordB2C1Index = (oxfordB2C1Index + 1) % words_array.length;
    UserSettings.setSetting('OxfordB2C1Index', oxfordB2C1Index);
    return word;
} 

function handleTrainingCardsNumber(event) {
    return wordAPI.getTrainingCardsNumber();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function handleNextRandomWordOrCard(event, useWords, useCards, onlyTraining) {
    if(!useWords && !useCards) return null;
    let wordsNumber, cardsNumber;
    if(!onlyTraining) {
        [wordsNumber, cardsNumber] = await Promise.all([handleGetWordsNumber(null, ''), handleCardsNumber(null, '')]);
    } else {
        [wordsNumber, cardsNumber] = await Promise.all([handleTrainingWordsNumber(null), handleTrainingCardsNumber(null)]);
    }

    let startPos = 1;
    if(!useCards) cardsNumber = 0;
    if(!useWords) startPos = wordsNumber + 1;

    if(wordsNumber + cardsNumber === 0 || (!useWords && cardsNumber === 0)) return null;

    const rand = getRandomInt(startPos, wordsNumber + cardsNumber);
    if(rand <= wordsNumber) {
        return {
            type: 'word',
            word_spelling: (await wordAPI.getRandomWordSpelling(onlyTraining)).spelling
        };
    } else {
        return {
            type: 'card',
            card: await wordAPI.getRandomCardNameAndData(onlyTraining)
        };
    }
}

function handleSetStoredNotificationsStatus(event, status) {
    if(typeof status === 'object')
        UserSettings.setSetting('StoredNotificationsStatus', status);
}

function handleGetStoredNotificationsStatus(event) {
    const status = UserSettings.readSettings()['StoredNotificationsStatus'];
    if(status) return status;
    return null;
}

function handleNotifyUserAboutWord(event) {
    createWordNotification('ALearn', 'You have new word notification');
}

function handleSetCloseToTray(event, val) {
    if(typeof val === 'boolean')
        UserSettings.setSetting('CloseToTray', val);
}

function handleGetCloseToTray(event) {
    return UserSettings.readSettings()['CloseToTray'];
}

function handleUpdateCardTrainingInfo(event, updatedItems) {
    return wordAPI.updateCardsTrainingInfo(updatedItems.filter(x => x.trainingDisabled !== x.trainingDisabledBefore));
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        titleBarOverlay: {
            color: 'rgba(0, 0, 0, 0)',
            height: 30
        },
        zoomFactor: config.ZOOM_FACTOR,
        title: "ALearning",
        icon: path.join(__dirname, 'ALearn-icon.ico')
    })

    app.MainWindow = win;

    win.webContents.openDevTools();

    const tray = new Tray(path.join(__dirname, 'ALearn-icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Show App', 
            click: () => {
                win.show();
            },
        },
        { 
            label: 'Quit', 
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip('ALearn');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        win.show();
    });

    win.on('close', (event) => {
        if (UserSettings.readSettings()['CloseToTray'] && !app.isQuitting) { 
            event.preventDefault(); 
            win.hide();
        }
    });

    ipcMain.on('settingsAPI:setZoomFactor', (event, zoomFactor) => {
        win.webContents.setZoomFactor(zoomFactor);
    });
    ipcMain.handle('settingsAPI:getZoomFactor', (event) => {
        return win.webContents.getZoomFactor();
    });
}



app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId('ALearn');
    ipcMain.handle('wordAPI:wordsPage', handleGetWordsPage);
    ipcMain.handle('wordAPI:saveWord', handleSaveWord);
    ipcMain.handle('wordAPI:deleteWordById', handleDeleteWordById);
    ipcMain.handle('wordAPI:getWordsNumber', handleGetWordsNumber);
    ipcMain.handle('wordAPI:getWordsTests', handleWordsTests);
    ipcMain.handle('wordAPI:getWordsMatchings', handleWordsMatching);
    ipcMain.handle('wordAPI:getWordsTrainingInfo', handleWordsTrainingInfo);
    ipcMain.handle('wordAPI:updateWordTrainingInfo', handleUpdateWordTrainingInfo);
    ipcMain.handle('wordAPI:getTrainingWordsNumber', handleTrainingWordsNumber);
    ipcMain.handle('wordAPI:getTestingValidationValues', handleTestingValidationValues);
    ipcMain.handle('wordAPI:getMatchingValidationSum', handleMatchingValidationSum);
    ipcMain.handle('wordAPI:getTrainingTableRowsNumber', handleTrainingTableRowsNumber);
    ipcMain.handle('wordAPI:getMaxRecordsNumberOfAllWords', handleMaxRecordsNumberOfAllWords);
    ipcMain.handle('wordAPI:saveCard', handleSaveCard);
    ipcMain.handle('wordAPI:getWordPageByQuery', handleWordPageByQuery);
    ipcMain.handle('wordAPI:updateWord', handleWordUpdate);
    ipcMain.handle('wordAPI:getCardsPage', handleCardsPage);
    ipcMain.handle('wordAPI:updateCard', handleCardUpdate);
    ipcMain.handle('wordAPI:deleteCardById', handleDeleteCardById);
    ipcMain.handle('wordAPI:getCardsNumber', handleCardsNumber);
    ipcMain.on('settingsAPI:setNotificationsSettings', handleSetNotificationsSettings);
    ipcMain.handle('settingsAPI:getNotificationsSettings', handleGetNotificationSettings);
    ipcMain.handle('wordAPI:getNextOxfordB2C1', handleNextOxfordB2C1);
    ipcMain.handle('wordAPI:getNextRandomWordOrCard', handleNextRandomWordOrCard);
    ipcMain.on('settingsAPI:setStoredNotificationsStatus', handleSetStoredNotificationsStatus);
    ipcMain.handle('settingsAPI:getStoredNotificationsStatus', handleGetStoredNotificationsStatus);
    ipcMain.on('settingsAPI:notifyUserAboutWord', handleNotifyUserAboutWord);
    ipcMain.on('settingsAPI:setCloseToTray', handleSetCloseToTray);
    ipcMain.handle('settingsAPI:getCloseToTray', handleGetCloseToTray);
    ipcMain.handle('wordAPI:updateCardTrainingInfo', handleUpdateCardTrainingInfo);
    ipcMain.handle('wordAPI:getTrainingCardsNumber', handleTrainingCardsNumber);
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})