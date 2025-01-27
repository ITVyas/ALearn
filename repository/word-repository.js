const config = require('../config');
const {Word} = require('../dto/word-dto');
const SqlitePromiseConnection = require('./sqlite-promise-connection');
const queries = require('./queries');


const DbUtilModule = {
    separatedValuesToStrArr: (str) => {
        if(!str) return [];
        let arr = str.split(config.ARRAY_SEPARATOR);
        if(arr.at(-1) === '') arr.pop();
        return arr;
    },

    zip: (x, ...y) => x.map((_, i) => [x[i], ...y.map(arr => arr[i])]),

    runQueryForEachParamsPromise: (query, paramsArr, promiseConnection) => {
        return Promise.all(
            paramsArr.map(params => promiseConnection.run(query, params))
        );
    },

    areArraysSameOnValues: (arr1, arr2) => {
        if(arr1.length !== arr2.length) return false;
        for(let i = 0; i < arr1.length; i++)
            if(arr1[i] !== arr2[i]) return false;
        return true;
    },

    getRemovedAndAddedItems: (oldArr, newArr) => {
        return {removed:  oldArr.filter(el => newArr.findIndex(x => x === el) === -1),
                added:    newArr.filter(el => oldArr.findIndex(x => x === el) === -1)};
    }
};



class WordSqliteRepository {
    constructor() {
        this.promiseConnection = new SqlitePromiseConnection();
    }

    lengthPromise() {
        return this.promiseConnection.all(queries.select.selectWordsNumber).then(rows => rows[0].words_number);
    }

    queryAllPromise(qry, params) {
        return this.promiseConnection.all(qry, params);
    }

    findAllQueryPromise(qry, params) {
        params.$separator = config.ARRAY_SEPARATOR;
        return this.promiseConnection.all(qry, params).then((rows) => {
            return rows.map(row => new Word(
                row.spelling,
                DbUtilModule.separatedValuesToStrArr(row.translationsArr),
                DbUtilModule.separatedValuesToStrArr(row.explanationsArr),
                DbUtilModule.separatedValuesToStrArr(row.examplesArr).map(JSON.parse),
                row.training_disabled,
                row.time,
                row.id
            ));
        });
    };

    deletePromise(id) {
        return this.promiseConnection.run(queries.delete.deleteWord, {$id: id});
    }

    updatePromise(updatedWord) {
        updatedWord.examples = updatedWord.examples.map(JSON.stringify);
        const err = new Error("Can't update Word object, which is not DB instance (Must have defined and real Word.id).");
        if(updatedWord.id !== 0 && !updatedWord.id) Promise.reject(err);

        return this.findAllQueryPromise(queries.select.selectById, {$id: updatedWord.id})
        .then(result => {
            if(result.length === 0) throw err;
            const existingWord = result[0];
            existingWord.examples = existingWord.examples.map(JSON.stringify);
                
            return this.promiseConnection.run('BEGIN;')
                .then(() => {
                    const existingSpellingPart = [existingWord.spelling, existingWord.trainingDisabled, existingWord.time],
                        updatedSpellingPart = [updatedWord.spelling, updatedWord.trainingDisabled, updatedWord.time];
                    
                    const promises = [];
                    if(!DbUtilModule.areArraysSameOnValues(existingSpellingPart, updatedSpellingPart)) {
                        promises.push(this.promiseConnection.run(queries.update.updateSpelling, {
                            $id: updatedWord.id,
                            $spelling: updatedWord.spelling, 
                            $training_disabled: updatedWord.trainingDisabled,
                            $time: updatedWord.time
                        }));
                    }

                    const arraysAndQueriesZip = DbUtilModule.zip(
                        [existingWord.translations, existingWord.explanations, existingWord.examples],
                        [updatedWord.translations, updatedWord.explanations, updatedWord.examples],
                        [queries.insert.insertTranslation, queries.insert.insertExplanation, queries.insert.insertExample],
                        [queries.delete.deleteTranslation, queries.delete.deleteExplanation, queries.delete.deleteExample]
                    );
                    
                    arraysAndQueriesZip.forEach(zipPart => {
                        const addedAndRemoved = DbUtilModule.getRemovedAndAddedItems(zipPart[0], zipPart[1]);
                        addedAndRemoved.added.forEach(sample => {
                            promises.push(this.promiseConnection.run(zipPart[2], {$word_id: updatedWord.id, $sample: sample}));
                        });
                        addedAndRemoved.removed.forEach(sample => {
                            promises.push(this.promiseConnection.run(zipPart[3], {$word_id: updatedWord.id, $sample: sample}));
                        });
                    });

                    return Promise.all(promises);
                    })
                .then(() => this.promiseConnection.run('COMMIT;'))
                .catch((err) => {
                    this.promiseConnection.run('ROLLBACK;')
                    throw err;
                });
        });
    }

    savePromise(word) {
        word.examples = word.examples.map(JSON.stringify);
        const promiseConnection = this.promiseConnection; 
        return this.promiseConnection.run('BEGIN;')
            .then(() => {
                return this.promiseConnection.run(queries.insert.insertSpelling, {
                    $spelling : word.spelling,
                    $training_disabled : word.trainingDisabled,
                    $time : word.time
                })
            })
            .then(function(context) {
                const word_id = context.lastID;
                const paramObj = (secondFieldName, secondFieldValue) => {
                    const res = {$word_id: word_id};
                    res[secondFieldName] = secondFieldValue;
                    return res;
                };
                const queryParamsZip = DbUtilModule.zip(
                    [queries.insert.insertTranslation, queries.insert.insertExplanation, queries.insert.insertExample],
                    [word.translations, word.explanations, word.examples]
                );
                
                return Promise.all(
                    queryParamsZip.map(zipPart => {
                        return DbUtilModule.runQueryForEachParamsPromise(
                            zipPart[0],
                            zipPart[1].map((x) => paramObj('$sample', x)),
                            promiseConnection
                        );
                    })
                );
            })
            .then(() => this.promiseConnection.run('COMMIT;'))
            .catch((err) => {
                this.promiseConnection.run('ROLLBACK;')
                throw err;
            });
    }
}

module.exports = {WordSqliteRepository};