



class QuestionLogic {
    questionNumberLogic: QuestionNumberLogic;
    questionTitleLogic: QuestionTitleLogic;
    commentLogic: CommentLogic;

    rowData: RowData;

    questionDiv: IQuestionOrSectionDiv;
    solutionDiv: SolutionDiv;
    static purposesWithQuestionNumber = ["question","sudoku","template"];
    settings: Settings;
    
    constructor(rowData: RowData, settings: Settings, after? :QuestionLogic) {
        this.rowData = rowData;
        this.settings = settings;
        


        //add blank question number if its not a question
        this.questionNumberLogic = new QuestionNumberLogic(this.settings, 
            !this.isQuestionOrTemplateOrSudoku, this,
            after ? after.questionNumberLogic : null);


        //title - must come before content div constructor
        this.questionTitleLogic = new QuestionTitleLogic(this.rowData.title, this.settings, after? after.questionTitleLogic : null);
    }
    
    static get readOnlyInstances(): QuestionLogic[] {
        return QuestionNumberLogic.instances.map(qnl => qnl.questionLogic);
    };
    
    createQuestionDiv(parent):IQuestionOrSectionDiv {
        if (this.settings.presentMode) {
            this.questionDiv = new SectionDiv(parent, 
                this.questionTitleLogic, 
                this.questionNumberLogic, 
                this.rowData.leftRight,
                this)
        }
        else {
            this.questionDiv = new QuestionDiv(parent, 
                this.questionTitleLogic, 
                this.questionNumberLogic, 
                this.rowData.leftRight,
                this);
        }

        if (this.isQuestionOrTemplateOrSudoku) {
            this.commentLogic = new CommentLogic(this.rowData.comment, this.questionDiv.contentDiv.setValueFields, 
                this.rowData.purpose, this);
        }
        
        //page mode - hide question div unless it is stored pageNumber
        if (Settings.instance.pageMode) {
            if (QuestionLogic.readOnlyInstances.indexOf(this) + 1 != Settings.instance.pageNumber) {
                this.questionDiv.removeClass("displayBlock");
                this.questionDiv.addClass("displayNone");
            }
        }

        return this.questionDiv;
    }

    createSolutionDiv(parent):SolutionDiv {
        //add solutions even for row questions - so that shuffle works easier
        this.solutionDiv = new SolutionDiv(parent, this.questionNumberLogic, this.commentLogic);
        return this.solutionDiv;
    }

    get isQuestionOrTemplateOrSudoku():boolean { return QuestionLogic.purposesWithQuestionNumber.indexOf(this.rowData.purpose) != -1;}

    destroy() {
        this.questionTitleLogic.delete(); //updates other question numbers
        if (this.questionNumberLogic) { this.questionNumberLogic.destroy(); } //updates other titles
        if (this.commentLogic) { this.commentLogic.destroy(); }

        this.questionDiv.destroy();
        if (this.solutionDiv) { this.solutionDiv.destroy(); }
    }


    //on click right arrow
    hideThisAndShowNextQuestion() {
        var onSuccess = (pageNumber) => {
            this.questionDiv.removeClass("displayBlock");
            this.questionDiv.addClass("displayNone");
            let next = QuestionLogic.readOnlyInstances[pageNumber-1];
            if (next) next.questionDiv.addClass("displayBlock");
        }

        Connection.instance.pageRequest(onSuccess.bind(this));
    }

    static toggleHideAllQuestionsButOne(questionLogic: QuestionLogic) {
        if (questionLogic.questionDiv.classes.indexOf("displayBlock") != -1) {
            QuestionLogic.readOnlyInstances.forEach(ql => {
                ql.questionDiv.removeClass("displayNone");
                ql.questionDiv.removeClass("displayBlock"); 
            });
        }
        else {
            QuestionLogic.readOnlyInstances.filter(ql => ql != questionLogic).forEach(ql2 => 
                { 
                    ql2.questionDiv.addClass("displayNone");
                    ql2.questionDiv.removeClass("displayBlock"); 
                }
            );
            questionLogic.questionDiv.addClass("displayBlock");
            questionLogic.questionDiv.removeClass("displayNone");
        }
    }
}

class IQuestionOrSectionDiv extends Container {
    contentDiv: ContentDiv;
}

class QuestionDiv extends IQuestionOrSectionDiv {
    contentDiv: ContentDiv;
    marginDiv: Container;
    
    constructor(parent: Container, 
            questionTitleLogic: QuestionTitleLogic,
            questionNumberLogic: QuestionNumberLogic,
            leftRightMarkdown: string[], 
            questionLogic: QuestionLogic) {
        super(parent, "div");
        this.classes.push("question");
        this.classes.push("greyBorder");

        //content and margin divs
        this.contentDiv =  new ContentDiv(this, questionTitleLogic, leftRightMarkdown);
        this._childNodes = [this.contentDiv];
        if (questionLogic.isQuestionOrTemplateOrSudoku || Settings.instance.mode == Mode.builder || 
            Settings.instance.pageMode) {
            this.classes.push("withMargin"); 
            this.marginDiv =  new MarginDiv(this, questionNumberLogic, questionLogic);
            this._childNodes.push(this.marginDiv);
        }
    }
}

class SectionDiv extends IQuestionOrSectionDiv {
    contentDiv: ContentDiv;
    marginDiv: MarginDiv;

    constructor(parent: Container, 
            questionTitleLogic: QuestionTitleLogic,
            questionNumberLogic: QuestionNumberLogic,
            leftRightMarkdown: string[], 
            questionLogic: QuestionLogic) {
            
        super(parent, "section");

        //content and margin divs
        this.contentDiv =  new ContentDiv(this, questionTitleLogic, leftRightMarkdown);
        this._childNodes = [this.contentDiv];
        if (questionLogic.isQuestionOrTemplateOrSudoku) {
            this.marginDiv =  new MarginDiv(this, questionNumberLogic, questionLogic);
            this._childNodes.push(this.marginDiv);
        }
    }
}