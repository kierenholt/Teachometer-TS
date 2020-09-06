
//refresh question numbers whenever a question is added or removed
class QuestionNumberLogic {
    spans: Span[] = [];
    settings: Settings;
    static instances: QuestionNumberLogic[] = [];
    isBlank: boolean;
    questionLogic: QuestionLogic;

    constructor(settings: Settings, isBlank: boolean, questionLogic: QuestionLogic, 
            after?: QuestionNumberLogic) {
        this.settings = settings;
        this.isBlank = isBlank;
        this.questionLogic = questionLogic;

        if (after) {
            helpers.insertAfter(QuestionNumberLogic.instances,after,this);
            QuestionNumberLogic.instances.forEach(qn => qn.refreshSpans());
        }
        else {
            QuestionNumberLogic.instances.push(this);
        }
    }

    get next() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return QuestionNumberLogic.instances[index + 1];
    }

    get number(): number {
        if (this.isBlank) throw "blank question number being called!";
        let index = QuestionNumberLogic.instances.indexOf(this);
        //add the number of blank ones before
        let numBlanks = QuestionNumberLogic.instances.slice(0,index).filter(ql => ql.isBlank).length;
        return index + 1 - numBlanks;
    }

    get prev() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return QuestionNumberLogic.instances[index - 1];
    }

    createSpan(parent) {
        var span = new Span(parent, this.isBlank ? "" : "Q" + this.number.toString());
        this.spans.push(span);
        return span;
    }

    refreshSpans() {
        this.spans.forEach(span => span.innerHTML = this.isBlank ? "" : "Q" + this.number.toString());
    }

    destroy() {
        helpers.removeFromArray(QuestionNumberLogic.instances, this);
        QuestionNumberLogic.instances.forEach(qn => qn.refreshSpans());
    }

    //STATIC STUFF FROM SHEETMANAGER

    fieldArraysWithQuestionNumbers: ValueField[] = [];
    static scoresToSendBuffer = {} ;
    static div: Container;
    static span: Span;
    static timerInterval: number = null;
    static endTime: Date;

    getFullColumnHeader(valueField: ValueField) {
        let index = this.fieldArraysWithQuestionNumbers.indexOf(valueField);
        if (index == 0) {
            return this.number + "." + this.questionLogic.rowData.title;
        }
        else {
            return this.number + helpers.lowerCaseLetterFromIndex(index);
        }
    }

    get columnHeaders() {
        return this.fieldArraysWithQuestionNumbers.map(f => this.getFullColumnHeader(f));
    }

    //register fields even if writetosheet is null, for the columnheaders
    registerField(valueField: ValueField) {

        this.fieldArraysWithQuestionNumbers.push(valueField);

        //get value from marksheet responses if it exists
        let columnHeader = this.getFullColumnHeader(valueField);
        if (Settings.instance.responses && columnHeader in Settings.instance.responses) {
            valueField.setValue(Settings.instance.responses[columnHeader]);
        }
    }

    addFieldToSendBuffer(field: ValueField, scoreLogic: ScoreLogic) {
        let columnHeader = this.getFullColumnHeader(field);
        if (columnHeader) { //field may not be registered!
            if (scoreLogic) {
                if (field instanceof CheckBoxCup) {
                    QuestionNumberLogic.scoresToSendBuffer[columnHeader] = {
                        value: scoreLogic.iconAsString,
                        color: scoreLogic.color,
                        append: Settings.instance.appendMode
                    };                    
                }
                else {
                    QuestionNumberLogic.scoresToSendBuffer[columnHeader] = {
                        value: field.getValue(),
                        color: scoreLogic.color,
                        append: Settings.instance.appendMode
                    };
                }
            }
            else {
                QuestionNumberLogic.scoresToSendBuffer[columnHeader] = {
                    value: field.getValue(),
                    color: "white",
                    append: Settings.instance.appendMode
                };
            }
        }
    }

    //called from submitbutton
    static addScoresToBuffer(scores) {
        QuestionNumberLogic.scoresToSendBuffer = helpers.mergeObjects(QuestionNumberLogic.scoresToSendBuffer, scores);
    }

    static attemptToSend() {
        let merged = helpers.mergeObjects(Settings.instance.totalScores,QuestionNumberLogic.scoresToSendBuffer);
        let onSuccess = (data) => { 
            QuestionNumberLogic.scoresToSendBuffer = {}; //clean buffer
            QuestionNumberLogic.span.innerHTML = "";
        }
        let onRetry = (data) => { 
            QuestionNumberLogic.span.innerHTML = "connection error....retrying";
        };
        Connection.instance.writeToSheet(onSuccess.bind(this), onRetry.bind(this), merged);
    }

    static createCountdownDiv(parent): Span {
        QuestionNumberLogic.div = new Container(parent, "div");
        QuestionNumberLogic.div.addClass("sheetManagerCountdown");
        QuestionNumberLogic.span = new Span(QuestionNumberLogic.div,"");
        QuestionNumberLogic.div.appendChildElement(QuestionNumberLogic.span);
        return QuestionNumberLogic.div;
    }
}