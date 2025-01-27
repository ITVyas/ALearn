const queries = require('./queries');
const SqlitePromiseConnection = require('./sqlite-promise-connection');
const WordExampleDto = require('../dto/word-example-dto');
const WordExplanationDto = require('../dto/word-explanation-dto');
const WordTranslationDto = require('../dto/word-translation-dto');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');


class WordForeignRecordsRepository {
    static utilQueries = null;

    constructor() {
        this.promiseConnection = new SqlitePromiseConnection();
        if(!WordForeignRecordsRepository.utilQueries)
            WordForeignRecordsRepository.utilQueries = {
                deleteExampleById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'delete_example_by_id.sql'), 'utf8'),
                deleteTranslationById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'delete_translation_by_id.sql'), 'utf8'),
                deleteExplanationById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'delete_explanation_by_id.sql'), 'utf8'),
            };
    }

    findAllByQueryPromise(qry, params) {
        return this.promiseConnection.all(qry, params).then(rows => rows.map(row => {
            if(row.translation) return new WordTranslationDto(row.id, row.word_id, row.translation);
            if(row.explanation) return new WordExplanationDto(row.id, row.word_id, row.explanation);
            if(row.example_json) return new WordExampleDto(row.id, row.word_id, JSON.parse(row.example_json));
            Promise.reject(`While extracting data out of DB error occured. Extracted data does not satisfies any word foreign table DTO structre. Qry: ${qry}`);
        }));
    }

    savePromise(record) {
        let qry;
        if(record instanceof WordExampleDto) qry = queries.insert.insertExample;
        else if(record instanceof WordExplanationDto) qry = queries.insert.insertExplanation;
        else if(record instanceof WordTranslationDto) qry = queries.insert.insertTranslation; 
        else return Promise.reject(new Error('record is not instance of foreign records dto.'));
        if(record instanceof WordExampleDto) record.value = JSON.stringify(record.value);
        return this.promiseConnection.run(qry, {$word_id: record.word_id, $sample: record.value});
    }

    deletePromise(record) {
        let qry;
        if(record instanceof WordExampleDto) qry = WordForeignRecordsRepository.utilQueries.deleteExampleById;
        else if(record instanceof WordExplanationDto) qry = WordForeignRecordsRepository.utilQueries.deleteExplanationById;
        else if(record instanceof WordTranslationDto) qry = WordForeignRecordsRepository.utilQueries.deleteTranslationById;
        else return Promise.reject(new Error('record is not instance of foreign records dto.'));
        if(record.id !== 0 && !record.id) return Promise.reject(new Error('record has no record.id property.'));
        return this.promiseConnection.run(qry, {$id: record.id});
    }
}

module.exports = WordForeignRecordsRepository;