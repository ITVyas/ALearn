const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wordAPI', {
    getWordsNumber: (qry) => ipcRenderer.invoke('wordAPI:getWordsNumber', qry), 
    getWordsPage: (pageNumber, pageCapacity) => ipcRenderer.invoke('wordAPI:wordsPage', pageNumber, pageCapacity),
    getWordPageByQuery: (pageNumber, pageCapacity, query) => ipcRenderer.invoke('wordAPI:getWordPageByQuery', pageNumber, pageCapacity, query),
    saveWord: (word) => ipcRenderer.invoke('wordAPI:saveWord', word),
    deleteWordById: (wordId) => ipcRenderer.invoke('wordAPI:deleteWordById', wordId),
    getWordsTests: (questionsNumber, optionsNumber, modeName) => ipcRenderer.invoke('wordAPI:getWordsTests', questionsNumber, optionsNumber, modeName),
    getWordsMatchings: (questionsNumber, pairsPerQuestion, modeName) => ipcRenderer.invoke('wordAPI:getWordsMatchings', questionsNumber, pairsPerQuestion, modeName),
    getWordsTrainingInfo: (pageNumber, pageCapacity, query) => ipcRenderer.invoke('wordAPI:getWordsTrainingInfo', pageNumber, pageCapacity, query),
    updateWordTrainingInfo: (updatedItems) => ipcRenderer.invoke('wordAPI:updateWordTrainingInfo', updatedItems),
    getTrainingWordsNumber: () => ipcRenderer.invoke('wordAPI:getTrainingWordsNumber'),
    getTestingValidationValues: () => ipcRenderer.invoke('wordAPI:getTestingValidationValues'),
    getMatchingValidationSum: (modeName) => ipcRenderer.invoke('wordAPI:getMatchingValidationSum', modeName),
    getTrainingTableRowsNumber: (modeName) => ipcRenderer.invoke('wordAPI:getTrainingTableRowsNumber', modeName),
    getMaxRecordsNumberOfAllWords: (modeName) => ipcRenderer.invoke('wordAPI:getMaxRecordsNumberOfAllWords', modeName),
    saveCard: (card) => ipcRenderer.invoke('wordAPI:saveCard', card),
    updateWord: (word) => ipcRenderer.invoke('wordAPI:updateWord', word),
    getCardsPage: (pageNumber, pageCapacity, qry) => ipcRenderer.invoke('wordAPI:getCardsPage', pageNumber, pageCapacity, qry),
    updateCard: (card) => ipcRenderer.invoke('wordAPI:updateCard', card),
    deleteCardById: (cardId) => ipcRenderer.invoke('wordAPI:deleteCardById', cardId),
    getCardsNumber: (qry) => ipcRenderer.invoke('wordAPI:getCardsNumber', qry),
    getNextOxfordB2C1: () => ipcRenderer.invoke('wordAPI:getNextOxfordB2C1'),
    getNextRandomWordOrCard: (useWords, useCards, onlyTraining) => ipcRenderer.invoke('wordAPI:getNextRandomWordOrCard', useWords, useCards, onlyTraining),
    updateCardTrainingInfo: (updatedItems) => ipcRenderer.invoke('wordAPI:updateCardTrainingInfo', updatedItems),
    getTrainingCardsNumber: () => ipcRenderer.invoke('wordAPI:getTrainingCardsNumber'),
});

contextBridge.exposeInMainWorld('settingsAPI', {
    setZoomFactor: (zoomFactor) => ipcRenderer.send('settingsAPI:setZoomFactor', zoomFactor),
    getZoomFactor: () => ipcRenderer.invoke('settingsAPI:getZoomFactor'),
    setNotificationsSettings: (settings) => ipcRenderer.send('settingsAPI:setNotificationsSettings', settings),
    getNotificationsSettings: () => ipcRenderer.invoke('settingsAPI:getNotificationsSettings'),
    setStoredNotificationsStatus: (storedNotificationsStatus) => ipcRenderer.send('settingsAPI:setStoredNotificationsStatus', storedNotificationsStatus),
    getStoredNotificationsStatus: () => ipcRenderer.invoke('settingsAPI:getStoredNotificationsStatus'),
    notifyUserAboutWord: () => ipcRenderer.send('settingsAPI:notifyUserAboutWord'),
    setCloseToTray: (val) => ipcRenderer.send('settingsAPI:setCloseToTray', val),
    getCloseToTray: () => ipcRenderer.invoke('settingsAPI:getCloseToTray')
});
