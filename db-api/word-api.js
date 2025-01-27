const { WordSqliteRepository } = require('../repository/word-repository');
const CardSqliteRepository = require('../repository/card-repository');
const WordForeignRecordsRepository = require('../repository/word-foreign-records-repository');
const WordAndRecordsDto = require('../dto/word-records-dto');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { Word } = require('../dto/word-dto');

class WordAPI {
    static selectQueries = undefined;

    constructor() {
        this.repository = new WordSqliteRepository();
        this.cardRepository = new CardSqliteRepository();
        this.foreignRecordsRepository = new WordForeignRecordsRepository();
        if(!WordAPI.selectQueries) WordAPI.selectQueries = {
            selectPage: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_page.sql'), 'utf8'),
            selectPageByQry: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_page_by_qry.sql'), 'utf8'),
            selectWordsNumber: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_words_number.sql'), 'utf8'),
            selectById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_word_by_id.sql'), 'utf8'),
            selectSampleQueies: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_sample_foreign.sql'), 'utf8'),
            selectRowsForWordsSample: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_rows_for_words_sample.sql'), 'utf8'),
            selectCountForeignRows: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_count_foreign_rows.sql'), 'utf8'),
            selectMaxRecordsNumber: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_max_records_number_of_words.sql'), 'utf8'),
            selectMatchingValidationValue: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_matching_validation_value.sql'), 'utf8'),
            selectSpellingAndTrainingDisabled: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_spelling_and_training_disabled.sql'), 'utf8'),
            selectTrainingWordsNumber: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_training_words_number.sql'), 'utf8'),
            selectCardsPage: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_cards_page.sql'), 'utf8'),
            selectWordsNumberByQry: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_words_number_by_qry.sql'), 'utf8'),
            selectCardsNumberByQry: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_cards_number_by_qry.sql'), 'utf8'),
            selectTrainingCardsNumberByQry: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_training_cards_number_by_qry.sql'), 'utf8'),
            selectRandomWord: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_random_word.sql'), 'utf8'),
            selectRandomCard: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_random_card.sql'), 'utf8'),
            selectCardById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_card_by_id.sql'), 'utf8'),
        }; 
    }
    
    saveWordAsync(word) {
        return this.repository.savePromise(word);
    }

    getWordByIdAsync(id) {
        return this.repository.findAllQueryPromise(WordAPI.selectQueries.selectById, {$id: id})
            .then((arr) => {
                if(arr.length === 0) return null;
                return arr[0];
            });
    }

    getWordsPageAsync(pageNumber, pageCapacity) {
        const limit = pageCapacity, offset = (pageNumber - 1)*pageCapacity;
        if(limit <= 0) return Promise.resolve([]);
        if(offset < 0) offset = 0;
        return this.repository.findAllQueryPromise(WordAPI.selectQueries.selectPage, {$limit: limit, $offset: offset});
    }

    deleteByIdAsync(id) {
        return this.repository.deletePromise(id);
    }

    getWordsNumberAsync(qry) {
        if(!qry) qry = '';
        qry = qry.replaceAll("'", "''");
        if(!qry || qry === '') return this.repository.lengthPromise();
        const query = WordAPI.selectQueries.selectWordsNumberByQry.replaceAll('$qry', qry);
        return this.repository.queryAllPromise(query, {}).then(rows => rows[0].words_number);
    }

    getSampleOfForeignRows(N, modeName, excludeWordIds = []) {
        if(['translations', 'explanations', 'examples'].includes(modeName) === false) 
            return Promise.resolve('Error: function getSampleOfForeignRows got unexpected value for modeName. Expected are: translations, explanations, examples.');
        let qry = WordAPI.selectQueries.selectSampleQueies;
        qry = qry.replaceAll('$exclude_word_ids', excludeWordIds.join(', '))
                .replaceAll('$mode_name', modeName);
        return this.foreignRecordsRepository.findAllByQueryPromise(
            qry, {$limit: N}
        );
    }

    getForeignRowsForWordsSample(sampleSize, rowsMaxSize, modeName, excludeWordIds = []) {
        if(['translations', 'explanations', 'examples'].includes(modeName) === false) 
            return Promise.resolve('Error: function getSampleOfForeignRows got unexpected value for modeName. Expected are: translations, explanations, examples.');
        let recordName = modeName.slice(0, -1);
        if(modeName === 'examples') recordName = 'example_json';
        let qry = WordAPI.selectQueries.selectRowsForWordsSample
                .replace('$exclude_word_ids', excludeWordIds.join(', '))
                .replaceAll('$table_name', modeName)
                .replaceAll('$record_name', recordName);
        return this.repository.queryAllPromise(
            qry, 
            {$words_N: sampleSize, $records_N: rowsMaxSize, $separator: config.ARRAY_SEPARATOR}
        ).then(rows => {
            return rows.map(row => {
                let recordsArr = row.recordsArr.split(config.ARRAY_SEPARATOR).slice(0, -1);
                if(modeName === 'examples') recordsArr = recordsArr.map(x => JSON.parse(x));
                return new WordAndRecordsDto(row.word_id, row.spelling, recordsArr);
            });
        });
    }

    countForeignTableRows(modeName) {
        const qry = WordAPI.selectQueries.selectCountForeignRows.replaceAll('$mode_name', modeName);
        return this.repository.queryAllPromise(qry, {}).then(rows => rows[0].count);
    }

    getMaxRecordsNumberOfAllWords(modeName) {
        const qry = WordAPI.selectQueries.selectMaxRecordsNumber.replaceAll('$mode_name', modeName);
        return this.repository.queryAllPromise(qry, {}).then(rows => rows[0].max_records_count);
    }

    getMatchingValidationValue(modeName, maxPairsNumber) {
        const qry = WordAPI.selectQueries.selectMatchingValidationValue
                    .replaceAll('$mode_name', modeName)
                    .replaceAll('$pairs_N', maxPairsNumber);
        return this.repository.queryAllPromise(qry, {}).then(rows => rows[0].validation_value);
    }
    
    getSpellingAndTrainingEnabled(pageNumber, pageCapacity, qry) {
        qry = qry.replaceAll("'", "''");
        const query = WordAPI.selectQueries.selectSpellingAndTrainingDisabled.replaceAll('$qry', qry);
        return this.repository.queryAllPromise(
            query,
            {$limit: pageCapacity, $offset: (pageNumber - 1)*pageCapacity}
        ).then(rows => rows.map(row => {
            return {
                id: row.id,
                spelling: row.spelling,
                trainingEnabled: !row.training_disabled
            };
        }));
    }

    async updateWordsTrainingInfo(updatedItems) {
        for(let item of updatedItems) {
            const word = (await this.repository.findAllQueryPromise(WordAPI.selectQueries.selectById, {$id: item.id}))[0];
            word.trainingDisabled = Number(item.trainingDisabled);
            await this.repository.updatePromise(word);
        }
    }

    getTrainingWordsNumber() {
        return this.repository.queryAllPromise(WordAPI.selectQueries.selectTrainingWordsNumber, {}).then(rows => rows[0].words_number);
    }

    getWordsPageByQuery(pageNumber, pageCapacity, query) {
        query = query.replaceAll("'", "''");
        const limit = pageCapacity, offset = (pageNumber - 1)*pageCapacity;
        if(limit <= 0) return Promise.resolve([]);
        if(offset < 0) offset = 0;
        const qry = WordAPI.selectQueries.selectPageByQry.replaceAll('$query', query);
        return this.repository.findAllQueryPromise(qry, {$limit: limit, $offset: offset});
    }

    saveCard(card) {
        return this.cardRepository.save(card);
    }

    updateWord(word) {
        return this.repository.updatePromise(word);
    }

    getCardsPage(pageNumber, pageCapacity, qry) {
        qry = qry.replaceAll("'", "''");
        let limit = pageCapacity, offset = (pageNumber - 1)*pageCapacity;
        if(limit <= 0) return Promise.resolve([]);
        if(offset < 0) offset = 0;
        const query = WordAPI.selectQueries.selectCardsPage.replaceAll('$qry', qry);
        return this.cardRepository.findAllByQuery(query, {$limit: limit, $offset: offset});
    }

    updateCard(card) {
        return this.cardRepository.update(card);
    }

    deleteCardById(cardId) {
        return this.cardRepository.deleteById(cardId);
    }

    getCardsNumber(qry) {
        qry = qry.replaceAll("'", "''");
        const query = WordAPI.selectQueries.selectCardsNumberByQry.replaceAll('$qry', qry);
        return this.repository.queryAllPromise(query, {}).then(rows => rows[0].cards_number);
    }

    getTrainingCardsNumber() {
        const query = WordAPI.selectQueries.selectTrainingCardsNumberByQry;
        return this.repository.queryAllPromise(query, {}).then(rows => rows[0].cards_number);
    }

    getRandomWordSpelling(onlyTraining) {
        let whereStmt = '';
        if(onlyTraining) whereStmt = 'WHERE training_disabled=0\n'
        const query = WordAPI.selectQueries.selectRandomWord.replaceAll('$where_stmt', whereStmt);
        return this.repository.queryAllPromise(query, {}).then(rows => {
            return {
                spelling: rows[0].spelling
            };
        });
    }

    getRandomCardNameAndData(onlyTraining) {
        let whereStmt = '';
        if(onlyTraining) whereStmt = 'WHERE training_disabled=0\n'
        const query = WordAPI.selectQueries.selectRandomCard.replaceAll('$where_stmt', whereStmt);
        return this.repository.queryAllPromise(query, {}).then(rows => {
            return {
                cardName: rows[0].card_name,
                data: JSON.parse(rows[0].data_json)
            };
        });
    }

    async updateCardsTrainingInfo(updatedItems) {
        for(let item of updatedItems) {
            const card = (await this.cardRepository.findAllByQuery(WordAPI.selectQueries.selectCardById, {$card_id: item.id}))[0];
            card.trainingDisabled = Number(item.trainingDisabled);
            await this.cardRepository.update(card);
        }
    }
}

module.exports = {WordAPI};