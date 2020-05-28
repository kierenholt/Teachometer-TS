
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
}