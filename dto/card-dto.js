class CardDto {
    constructor(cardName, dataObj, trainingDisabled=0, time=Date.now(), id = undefined) {
        this.cardName = cardName;
        this.dataObj = dataObj;
        this.trainingDisabled = trainingDisabled;
        this.time = time;
        this.id = id;
    }
}

module.exports = CardDto;