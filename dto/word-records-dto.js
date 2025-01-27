class WordAndRecordsDto {
    constructor(word_id, spelling, recordsArr) {
        this.word_id = word_id;
        this.spelling = spelling;
        this.recordsArr = recordsArr;
    }
}

module.exports = WordAndRecordsDto;