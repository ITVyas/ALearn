class MatchingBuilder {
    constructor(questionsNumber, maxOptions) {
        this.questions = [];
        this.currentStageFreeIndices = [];
        for(let i = 0; i < questionsNumber; i++) {
            this.questions.push([]);
            this.currentStageFreeIndices.push(i);
        }

        this.maxOptions = maxOptions;
    }

    _randomSample(arr, n) {
        n = Math.min(n, arr.length)
        var result = [],
            len = arr.length,
            taken = [];
        while (n--) {
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    _resetCurrentStageFreeIndices() {
        this.currentStageFreeIndices = [];
        for(let i = 0; i < this.questions.length; i++) {
            if(this.questions[i].length !== this.maxOptions)
                this.currentStageFreeIndices.push(i);
        }
    }

    isBuildingFinished() {
        return this.questions.reduce((acc, val) => {
            return acc && (val.length === this.maxOptions);
        }, true);
    }

    insertPairs(pairs) {
        let currentPairsIndex = 0;

        while(true) {
            let picked_indicies = this._randomSample(this.currentStageFreeIndices, pairs.length);
            this.currentStageFreeIndices = this.currentStageFreeIndices.filter(x => !picked_indicies.includes(x))
            for(let pickedIndex of picked_indicies) {
                this.questions[pickedIndex].push(pairs[currentPairsIndex++]);
            }
            if(this.currentStageFreeIndices.length === 0) this._resetCurrentStageFreeIndices();
            if(currentPairsIndex === pairs.length || this.currentStageFreeIndices.length === 0)
                break;
        }

        return this;
    }

    getFinalMatchingTest() {
        return this.questions;
    }
}

module.exports = MatchingBuilder;