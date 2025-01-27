const config = require('../config');
const sqlite3 = require('sqlite3').verbose();

class SqlitePromiseConnection {
    constructor() {
        this.db = new sqlite3.Database(config.SQLITE_PATH);
        this.db.run('PRAGMA foreign_keys = ON;');
    }

    run(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if(err) return reject(err);
                resolve(this);
            });
        }); 
    }

    all(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, function(err, rows) {
                if(err) return reject(err);
                resolve(rows);
            });
        });
    }

}

module.exports = SqlitePromiseConnection;