
//refresh question numbers whenever a question is added or removed
class QuestionNumberLogic {
    spans: Span[] = [];
    settings: Settings;
    static instances: QuestionNumberLogic[] = [];

    constructor(settings: Settings, after?: QuestionNumberLogic) {
        this.settings = settings;
        
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

    get number() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return index + 1;
    }

    get prev() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return QuestionNumberLogic.instances[index - 1];
    }

    createSpan(parent) {
        var span = new Span(parent, this.number.toString());
        this.spans.push(span);
        return span;
    }

    refreshSpans() {
        this.spans.forEach(span => span.innerHTML = this.number.toString());
    }

    destroy() {
        helpers.removeFromArray(QuestionNumberLogic.instances, this);
        QuestionNumberLogic.instances.forEach(qn => qn.refreshSpans());
    }
}