class SheetManager {
    numberOfFieldsWithQuestionTitles = {};
    columnHeadersWithFieldUIDs = {};
    scoresToSendBuffer = {} ;
    div: Container;
    span: Span;
    timerInterval: number = null;
    endTime: Date;

    constructor() {
    }

    //register fields even if writetosheet is null, for the columnheaders
    registerField(valueField: ValueField, 
            columnHeaderFirstPart: string, jsFunctionName?: string) {
        if (!(columnHeaderFirstPart in this.numberOfFieldsWithQuestionTitles)) {
            this.numberOfFieldsWithQuestionTitles[columnHeaderFirstPart] = 0;
        }

        //columnheader is questionnumber + letter or function name 
        let letter = jsFunctionName ? jsFunctionName : helpers.lowerCaseLetterFromIndex(
            this.numberOfFieldsWithQuestionTitles[columnHeaderFirstPart]++);
        let columnHeader = columnHeaderFirstPart + "." + letter;
        this.columnHeadersWithFieldUIDs[valueField.UID] = columnHeader;

        //get value from marksheet responses if it exists
        if (Settings.instance.responses && columnHeader in Settings.instance.responses) {
            valueField.setValue(Settings.instance.responses[columnHeader]);
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
                        append: Settings.instance.appendMode
                    };                    
                }
                else {
                    this.scoresToSendBuffer[columnHeader] = {
                        value: field.getValue(),
                        color: scoreLogic.color,
                        append: Settings.instance.appendMode
                    };
                }
            }
            else {
                this.scoresToSendBuffer[columnHeader] = {
                    value: field.getValue(),
                    color: "white",
                    append: Settings.instance.appendMode
                };
            }
        }
    }

    //called from submitbutton
    addScoresToBuffer(scores) {
        this.scoresToSendBuffer = helpers.mergeObjects(this.scoresToSendBuffer, scores);
    }

    attemptToSend() {
        let merged = helpers.mergeObjects(Settings.instance.totalScores,this.scoresToSendBuffer);
        let onSuccess = (data) => { 
            this.scoresToSendBuffer = {}; //clean buffer
            this.span.innerHTML = "";
        }
        let onRetry = (data) => { 
            this.span.innerHTML = "connection error....retrying";
        };
        Connection.instance.writeToSheet(onSuccess.bind(this), onRetry.bind(this), merged);
    }

    createCountdownDiv(parent): Span {
        this.div = new Container(parent, "div");
        this.div.addClass("sheetManagerCountdown");
        this.span = new Span(this.div,"");
        this.div.appendChildElement(this.span);
        return this.div;
    }

}
