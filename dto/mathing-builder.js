class MatchingBuilder {
    constructor(questionsNumber, maxOptions) {
        this.questions = [];
        for(let i = 0; i < questionsNumber; i++) {
            this.questions.push([]);
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

    _allFreeIndicies() {
        const free = [];
        this.questions.forEach((q, i) => {
            if(q.length < this.maxOptions) free.push(i);
        });
        return free;
    }

    _currentStageFreeIndices() {
        const min = this.questions.reduce((acc, val) => {
            if(acc > val.length) acc = val.length;
            return acc;
        }, this.maxOptions);
        if(min === this.maxOptions) return [];
        const free = [];
        this.questions.forEach((q, i) => {
            if(q.length === min) free.push(i);
        });
        return free;
    }

    isBuildingFinished() {
        return this.questions.reduce((acc, val) => {
            return acc && (val.length === this.maxOptions);
        }, true); 
    }

    insertPairs(pairs) {
        let stageFreeIndices = this._currentStageFreeIndices();
        const allFreeIndices = this._allFreeIndicies();

        stageFreeIndices = this._randomSample(stageFreeIndices, stageFreeIndices.length);
        for(let pair of pairs) {
            if(allFreeIndices.length === 0 && stageFreeIndices.length === 0) break;
            if(stageFreeIndices.length !== 0) {
                const index = stageFreeIndices[0];
                stageFreeIndices.splice(0, 1);
                allFreeIndices.splice(allFreeIndices.findIndex(x => x === index), 1);;
                this.questions[index].push(pair);
            } else {
                const index = this._randomSample(allFreeIndices, 1)[0];
                allFreeIndices.splice(allFreeIndices.findIndex(x => x === index), 1);
                this.questions[index].push(pair);
            }
        }
        return this;
    }

    getFinalMatchingTest() {
        return this.questions;
    }
}

module.exports = MatchingBuilder;