class Word {   
    constructor(spelling, translationsArr, explanationsArr, examplesArr, training_disabled=0, time=Date.now(), id = undefined) {
        this.spelling = spelling;
        this.translations = translationsArr;
        this.explanations = explanationsArr;
        this.examples = examplesArr;
        this.trainingDisabled = training_disabled;
        this.time = time;
        this.id = id;
    }
}

module.exports = {Word};