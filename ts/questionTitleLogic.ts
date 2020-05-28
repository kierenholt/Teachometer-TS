class QuestionTitleLogic {
    div: Container;
    value: string;
    settings: Settings;
    static instances: QuestionTitleLogic[] = [];

    constructor(title: string, settings: Settings, after?: QuestionTitleLogic) {
        this.value = title;
        this.settings = settings;
        
        if (after) {
            helpers.insertAfter(QuestionTitleLogic.instances,after,this);
            QuestionTitleLogic.instances.forEach(qn => qn.refresh());
        }
        else {
            QuestionTitleLogic.instances.push(this);
        }
    }

    createTitle(parent: Container) {
        if (this.div) { throw "title already created"; }
        this.div = new Container(parent,"div");
        let span = new Span(this.div, this.value)
        this.div.appendChildElement(span);
        span.addClass("questionTitle");
        return this.div;
    }

    get next() {
        let index = QuestionTitleLogic.instances.indexOf(this);
        return QuestionTitleLogic.instances[index + 1];
    }

    get prev() {
        let index = QuestionTitleLogic.instances.indexOf(this);
        return QuestionTitleLogic.instances[index - 1];
    }

    refresh() { //title does not change text, but becomes hidden
        let hidden = this.prev ? (this.prev.value == this.value) : false;
        if (this.div) { 
            if (hidden) {
                this.div.addClass("displayNone"); this.div.removeClass("displayBlock");
            }
            else {
                this.div.addClass("displayBlock"); this.div.removeClass("displayNone");
            }
        }
    }

    delete() {
        helpers.removeFromArray(QuestionTitleLogic.instances, this);
        QuestionTitleLogic.instances.forEach(qn => qn.refresh());
    }
}