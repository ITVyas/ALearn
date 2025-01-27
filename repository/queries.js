const fs = require('node:fs');
const path = require('node:path');


const queries = {
    insert: {
        insertSpelling: fs.readFileSync(path.join(__dirname, 'queries', 'insert_spelling.sql'), 'utf8'),
        insertTranslation: fs.readFileSync(path.join(__dirname, 'queries', 'insert_translation.sql'), 'utf8'),
        insertExplanation: fs.readFileSync(path.join(__dirname, 'queries', 'insert_explanation.sql'), 'utf8'),
        insertExample: fs.readFileSync(path.join(__dirname, 'queries', 'insert_example.sql'), 'utf8')
    },

    delete: {
        deleteWord: fs.readFileSync(path.join(__dirname, 'queries', 'delete_word.sql'), 'utf8'),
        deleteTranslation: fs.readFileSync(path.join(__dirname, 'queries', 'delete_translation.sql'), 'utf8'),
        deleteExplanation: fs.readFileSync(path.join(__dirname, 'queries', 'delete_explanation.sql'), 'utf8'),
        deleteExample: fs.readFileSync(path.join(__dirname, 'queries', 'delete_example.sql'), 'utf8')
    },

    update: {
        updateSpelling: fs.readFileSync(path.join(__dirname, 'queries', 'update_word_spelling.sql'), 'utf8')
    },

    select: {
        selectById: fs.readFileSync(path.join(__dirname, 'queries', 'select_word_by_id.sql'), 'utf8'),
        selectWordsNumber: fs.readFileSync(path.join(__dirname, 'queries', 'select_words_number.sql'), 'utf8'),
    }
};

module.exports = queries;