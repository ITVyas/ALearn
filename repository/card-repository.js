const SqlitePromiseConnection = require('./sqlite-promise-connection');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const CardDto = require('../dto/card-dto');

const cardQueries = {
    insert: {
        insertCard: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'insert_card.sql'), 'utf8')
    },
    update: {
        updateCard: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'update_card.sql'), 'utf8')
    },
    delete: {
        deleteById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'delete_card.sql'), 'utf8')
    },
    select: {
        selectById: fs.readFileSync(path.join(config.PROJECT_DIR, 'repository', 'queries', 'select_card_by_id.sql'), 'utf8')
    }
};

class CardSqliteRepository {
    constructor() {
        this.promiseConnection = new SqlitePromiseConnection();
    }

    save(card) {
        return this.promiseConnection.run(cardQueries.insert.insertCard, {
            $data_json: JSON.stringify(card.dataObj),
            $card_name: card.cardName,
            $training_disabled: card.trainingDisabled,
            $time: card.time
        });
    }

    update(card) {
        return this.promiseConnection.run(cardQueries.update.updateCard, {
            $card_id: card.id,
            $training_disabled: card.trainingDisabled,
            $card_name: card.cardName,
            $time: card.time,
            $data_json: JSON.stringify(card.dataObj)
        });
    }

    deleteById(cardId) {
        return this.promiseConnection.run(cardQueries.delete.deleteById, {$card_id: cardId});
    }

    findAllByQuery(qry, params) {
        return this.promiseConnection.all(qry, params).then(rows => rows.map(row => {
            return new CardDto(
                row.card_name,
                JSON.parse(row.data_json),
                row.training_disabled,
                row.time,
                row.id
            );
        }));
    }
}

module.exports = CardSqliteRepository;