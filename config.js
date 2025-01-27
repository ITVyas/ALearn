const path = require('node:path');

const config = {
    SQLITE_PATH: path.resolve(path.join(__dirname, 'repository', 'word.db')),
    ARRAY_SEPARATOR: '~#',
    PROJECT_DIR: __dirname,
    MATCHING_BATCH_PICK_SIZE: 8,
    MATCHING_MAX_RECORDS_PER_WORD: 4,
    TESTING_MAX_RECORDS_PER_WORD: 4,
};

module.exports = config;