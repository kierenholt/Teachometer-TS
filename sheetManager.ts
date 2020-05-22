class SheetManager {
    settings: Settings;
    numberOfFieldsWithQuestionTitles = {};
    columnHeadersWithFieldUIDs = {};
    scoresToSendBuffer = {} ;
    div: Container;
    span: Span;
    timerInterval: number = null;
    endTime: Date;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    registerField(valueField: ValueField, columnHeaderFirstPart: string, jsFunctionName?: string) {
        if (!(columnHeaderFirstPart in this.numberOfFieldsWithQuestionTitles)) {
            this.numberOfFieldsWithQuestionTitles[columnHeaderFirstPart] = 0;
        }
        let letter = jsFunctionName ? jsFunctionName : helpers.lowerCaseLetterFromIndex(
            this.numberOfFieldsWithQuestionTitles[columnHeaderFirstPart]++);
        let columnHeader = columnHeaderFirstPart + "." + letter;
        this.columnHeadersWithFieldUIDs[valueField.UID] = columnHeader;

        //get value from marksheet responses if it exists
        if (this.settings.responses && columnHeader in this.settings.responses) {
            valueField.setValue(this.settings.responses[columnHeader]);
        }
    }

    addFieldToSendBuffer(field: ValueField, scoreLogic: ScoreLogic) {
        let columnHeader = this.columnHeadersWithFieldUIDs[field.UID];
        if (columnHeader) { //field may not be registered!
            if (scoreLogic) {
                if (field instanceof CheckBoxCup) {
                    this.scoresToSendBuffer[columnHeader] = {
                        value: scoreLogic.iconAsString,
                        color: scoreLogic.color,
                        append: this.settings.appendMode
                    };                    
                }
                else {
                    this.scoresToSendBuffer[columnHeader] = {
                        value: field.getValue(),
                        color: scoreLogic.color,
                        append: this.settings.appendMode
                    };
                }
            }
            else {
                this.scoresToSendBuffer[columnHeader] = {
                    value: field.getValue(),
                    color: "white",
                    append: this.settings.appendMode
                };
            }
        }
    }

    //called from submitbutton
    addScoresToBuffer(scores) {
        this.scoresToSendBuffer = helpers.mergeObjects(this.scoresToSendBuffer, scores);
    }

    attemptToSend() {
        let merged = helpers.mergeObjects(this.settings.totalScores,this.scoresToSendBuffer);
        let success = this.settings.writeToSheet(merged);
        if (success) { 
            this.scoresToSendBuffer = {}; //clean buffer
            this.span.innerHTML = "";
        }
        else {
            if (this.timerInterval == null) {
                this.startCountDown();
            }
        }
    }

    createCountdownDiv(parent): Span {
        this.div = new Container(parent, "div");
        this.div.addClass("sheetManagerCountdown");
        this.span = new Span(this.div,"");
        this.div.appendChildElement(this.span);
        return this.div;
    }

    startCountDown() {
        let d = new Date();
        this.endTime = new Date(d.valueOf() + 10000);
        this.timerInterval = setInterval(function(sheetManager: SheetManager) {
            
            var sheetManager = sheetManager;
            //REPEATS EVERY 0.9 SECONDS
            return function() {
                    sheetManager.span.innerHTML = sheetManager.timerText;
                    if (sheetManager.isElapsed) { 
                        sheetManager.span.innerHTML = "retrying...";
                        clearInterval(sheetManager.timerInterval);
                        sheetManager.timerInterval = null; 
                        sheetManager.attemptToSend();
                    }
                };
        }(this), 900);
    }

    get timerText(): string {
        var secondsLeft = Math.floor((this.endTime.valueOf() - new Date().valueOf()) / 1000);
        return `Connection error: retrying in ${secondsLeft} seconds `;
    }

    get isElapsed() : boolean { 
        return this.endTime.valueOf() < new Date().valueOf();
    }
}
