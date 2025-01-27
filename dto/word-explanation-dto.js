class WordExplanationDto {
    constructor(id, word_id, translation) {
        this.id = id;
        this.word_id = word_id;
        this.value = translation;
    }
}

module.exports = WordExplanationDto;