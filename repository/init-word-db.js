const sqlite3 = require('sqlite3').verbose();
const path = require('node:path')
const config = require('../config');

const db = new sqlite3.Database(config.SQLITE_PATH);
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS word_spelling (\
                id INTEGER PRIMARY KEY,\
                spelling TEXT NOT NULL,\
                training_disabled INT NOT NULL DEFAULT 0,\
                time INTEGER NOT NULL);');

    db.run('CREATE TABLE IF NOT EXISTS word_translations (\
                id INTEGER PRIMARY KEY,\
                word_id INT NOT NULL REFERENCES word_spelling(id) ON DELETE CASCADE,\
                translation TEXT NOT NULL);');

    db.run('CREATE TABLE IF NOT EXISTS word_explanations (\
                id INTEGER PRIMARY KEY,\
                word_id INT NOT NULL REFERENCES word_spelling(id) ON DELETE CASCADE,\
                explanation TEXT NOT NULL);');

    db.run('CREATE TABLE IF NOT EXISTS word_examples (\
                id INTEGER PRIMARY KEY,\
                word_id INT NOT NULL REFERENCES word_spelling(id) ON DELETE CASCADE,\
                example_json TEXT NOT NULL);');

    db.run('CREATE TABLE IF NOT EXISTS info_cards (\
        id INTEGER PRIMARY KEY,\
        card_name TEXT,\
        data_json TEXT NOT NULL,\
        training_disabled INT NOT NULL DEFAULT 0,\
        time INT NOT NULL);');
});