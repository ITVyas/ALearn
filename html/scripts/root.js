export const Config = {
    PAGE_CAPACITY: 12,
    TRAINING_SETTINGS_PAGE_CAPACITY: 6,
    WORDS_CACHE_PAGES_AROUND: 1
};

export class Observer {
    constructor() {
        this.observers = [];
    }

    subscribe(f) {
        this.observers.push(f);
    }

    unsubscribe(f) {
        this.observers = this.observers.filter(func => func !== f);
    }

    notify(data) {
        this.observers.forEach((observer) => observer(data));
    }   
}

export const ElementBuilder = (function() {
    const builderWrapper = (element) => {
        return {
            addClasses: (...classes) => {
                element.classList.add(...classes);
                return builderWrapper(element);
            },

            setAttribute: (attrName, value) => {
                element.setAttribute(attrName, value);
                return builderWrapper(element);
            },

            setInnerHTML: (content) => {
                element.innerHTML = content;
                return builderWrapper(element);
            },

            appendElements: (...elements) => {
                element.append(...elements);
                return builderWrapper(element);
            },

            addEventListener: (eventStr, action) => {
                element.addEventListener(eventStr, action);
                return builderWrapper(element);
            },

            get: () => element
        };
    };
    return {
        create: (tag) => {
            const el = document.createElement(tag);
            return builderWrapper(el);
        },
        wrapper: (element) => builderWrapper(element)
    };
})(window.document);

export const GlobalWordsData = (() => {
    const training_data = {
        wordsNumber: null,
        maxRecordsNumberOfAllWords: {
            translations : null,
            explanations: null,
            examples: null
        },
        tableRows: {
            translations: null,
            explanations: null,
            examples: null
        },
        matchingValidationSum: {
            translations: null,
            explanations: null,
            examples: null
        }
    };

    const varsStorage = {};

    const observers = {
        observeTestingData: new Observer(),
        observeMatchingData: new Observer(),
        observeWords: new Observer(),
        observeTrainingInfo: new Observer()
    };
    return {
        updateTrainingWordsNumber: async (notify=true) => {
            training_data.wordsNumber = await window.wordAPI.getTrainingWordsNumber();
            if(notify) {
                observers.observeTestingData.notify();
                observers.observeMatchingData.notify();
            }
        },

        updateTrainingTableRows: async (notify=true) => {
            training_data.tableRows.translations = await window.wordAPI.getTrainingTableRowsNumber('translations');
            training_data.tableRows.explanations = await window.wordAPI.getTrainingTableRowsNumber('explanations');
            training_data.tableRows.examples = await window.wordAPI.getTrainingTableRowsNumber('examples');
            if(notify) observers.observeTestingData.notify();
        },

        updateMaxRecordsNumberOfAllWords: async (notify=true) => {
            training_data.maxRecordsNumberOfAllWords.translations = await window.wordAPI.getMaxRecordsNumberOfAllWords('translations');
            training_data.maxRecordsNumberOfAllWords.explanations = await window.wordAPI.getMaxRecordsNumberOfAllWords('explanations');
            training_data.maxRecordsNumberOfAllWords.examples = await window.wordAPI.getMaxRecordsNumberOfAllWords('examples');
            if(notify) observers.observeTestingData.notify();
        },

        updateMatchingValidationSum: async (notify=true) => {
            training_data.matchingValidationSum.translations = await window.wordAPI.getMatchingValidationSum('translations');
            training_data.matchingValidationSum.explanations = await window.wordAPI.getMatchingValidationSum('explanations');
            training_data.matchingValidationSum.examples = await window.wordAPI.getMatchingValidationSum('examples');
            if(notify) observers.observeMatchingData.notify();
        },

        updateAllTestingData: async function() {
            await Promise.all([
                this.updateTrainingWordsNumber(false),
                this.updateTrainingTableRows(false),
                this.updateMaxRecordsNumberOfAllWords(false)
            ]);
            observers.observeTestingData.notify();
        },

        updateAllMatchingData: async function() {
            await Promise.all([
                this.updateTrainingWordsNumber(false),
                this.updateMatchingValidationSum(false)
            ]);
            observers.observeMatchingData.notify();
        },

        getWordsPage: async (pageNumber, pageCapacity, qry) => {
            if(qry) return window.wordAPI.getWordPageByQuery(pageNumber, pageCapacity, qry);
            else return window.wordAPI.getWordsPage(pageNumber, pageCapacity);
        },

        getAllWordsNumber: async (qry='') => {
            return window.wordAPI.getWordsNumber(qry);
        },

        saveNewWord: (wordData) => {
            window.wordAPI.saveWord(wordData).then(
                () => observers.observeWords.notify()
            );
        },

        deleteWordById: async (id) => {
            await window.wordAPI.deleteWordById(id).then(
                () => observers.observeWords.notify()
            );
        },

        setVariable: (key, value) => {
            if(!varsStorage[key]) {
                const insertValue = {
                    value: value,
                    observer: new Observer()
                };
                varsStorage[key] = insertValue;
            } else {
                varsStorage[key].value = value;
                varsStorage[key].observer.notify();
            }
        },

        saveTrainingInfoChanges: async (infoChanges) => {
            await window.wordAPI.updateWordTrainingInfo(infoChanges);
            observers.observeTrainingInfo.notify();
        },

        updateWord: async (word) => {
            await window.wordAPI.updateWord(word);
            observers.observeWords.notify();
        },

        getVariableValue: (key) => {
            if(varsStorage[key]) return varsStorage[key].value;
            else return undefined;
        },
        getTrainingWordsNumber: () => training_data.wordsNumber,
        getMaxRecordsNumberOfAllWords: (table) => training_data.maxRecordsNumberOfAllWords[table],
        getTableRowsNumber: (table) => training_data.tableRows[table],
        getMatchingValidSumForTable: (table) => training_data.matchingValidationSum[table],
        getTrainingInfoPage: (pageNumber, pageCapacity, qry='') => {
            return window.wordAPI.getWordsTrainingInfo(pageNumber, pageCapacity, qry);
        },

        onUpdateTestingData: (f) => {
            observers.observeTestingData.subscribe(f);
        },

        onUpdateMatchingData: (f) => {
            observers.observeMatchingData.subscribe(f);
        },

        onUpdateWords: (f) => {
            observers.observeWords.subscribe(f);
        },

        onUpdateVariable: (key, f) => {
            if(varsStorage[key]) varsStorage[key].observer.subscribe(f);
        },

        onUpdateTrainingInfo: (f) => {
            observers.observeTrainingInfo.subscribe(f);
        }
    };
})();


export const GlobalCardsData = (() => {
    const observers = {
        observeCards: new Observer(),
        observeTrainingInfo: new Observer()
    };

    const varsStorage = {};

    return {
        saveCard: async (card) => {
            await window.wordAPI.saveCard(card);
            observers.observeCards.notify();
        },

        setVariable: (key, value) => {
            if(!varsStorage[key]) {
                const insertValue = {
                    value: value,
                    observer: new Observer()
                };
                varsStorage[key] = insertValue;
            } else {
                varsStorage[key].value = value;
                varsStorage[key].observer.notify();
            }
        },

        updateCard: async (card) => {
            await window.wordAPI.updateCard(card);
            observers.observeCards.notify();
        },

        updateTrainingInfo: async (updatedItems) => {
            await window.wordAPI.updateCardTrainingInfo(updatedItems);
            observers.observeTrainingInfo.notify();
        },

        deleteCardById: async (cardId) => {
            await window.wordAPI.deleteCardById(cardId);
            observers.observeCards.notify();
        },

        getVariableValue: (key) => {
            if(varsStorage[key]) return varsStorage[key].value;
            else return undefined;
        },

        getAllCardsNumber: async (qry) => {
            return window.wordAPI.getCardsNumber(qry);
        },

        getCardsPage: async (pageNumber, pageCapacity, qry) => {
            return window.wordAPI.getCardsPage(pageNumber, pageCapacity, qry);
        },

        onUpdateCards: (f) => {
            observers.observeCards.subscribe(f);
        },

        onUpdateVariable: (key, f) => {
            if(varsStorage[key]) varsStorage[key].observer.subscribe(f);
        },

        onUpdateTrainingInfo: (f) => {
            observers.observeTrainingInfo.subscribe(f);
        }
    };
})();