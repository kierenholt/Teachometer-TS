

interface RowData {
    comment: string;
    title: string;
    purpose: string;
    leftRight: string[];
}

class Assignment extends Container {
    questionsDiv: Container;
    questionLogics: QuestionLogic[] = [];
    solutionsDiv: Container;
    jumbledSolutionsDiv: Container;

    settings: Settings;
    
    submitButtonAndFinalScoreLogic: SubmitButtonAndFinalScoreLogic;
    submitButtonDiv: Container;

    constructor(div, settingsObj: Settings) {
        super(null, "div");
        this._element = div; //must come first
        this.settings = settingsObj;
        this.settings.assignment = this;
        if (this.settings.title) window.document.title = this.settings.title;
        
        //divs
        this.questionsDiv = new Container(this, "div").addClass("questionsDiv");
        if (!this.settings.presentMode) { this.solutionsDiv = new Container(this, "div").addClass("solutionsDiv"); }
        //this.jumbledSolutionsDiv = new Container(this, "div").addClass("jumbledSolutionsDiv");

        //if question data included in settings
        if (this.settings.questionJSON) { 
            var rows = JSON.parse(this.settings.questionJSON);
            this.addRowsFromData(rows);
        }

        //if shuffle is ON
        if (this.settings.shuffleQuestions) {this.shuffle(false);}
        if (this.settings.truncateMarks > 0) {this.truncate(this.settings.truncateMarks)}
        

        //APPENDING DOES NOT WORK SO PUSH TO CHILDNODES
        if (this.settings.presentMode) {
            this._childNodes = [this.questionsDiv];
            this.questionsDiv.addClass("slides")
            this.getElement(true).classList.add("reveal");
            this.refresh();
            window["Reveal"].initialize({transition: 'linear'});
        }
        else {
            //submit button and sheet timer
            this.submitButtonAndFinalScoreLogic = new SubmitButtonAndFinalScoreLogic(this.settings);
            this.submitButtonDiv = this.submitButtonAndFinalScoreLogic.createDiv(this);
            
            this._childNodes = [];
            if (this.settings.title) this._childNodes.push(new HeadingCup(this, this.settings.title));
            this._childNodes.push(this.questionsDiv, this.submitButtonDiv);
            if (this.solutionsDiv) {
                this._childNodes.push(new HeadingCup(this,"solutions"));
                this._childNodes.push(this.solutionsDiv);
            }
            if (this.settings.timerLogic) {
                this._childNodes.push(this.settings.timerLogic.createDiv(this));
            }
            if (this.settings.sheetManager) {
                this._childNodes.push(this.settings.sheetManager.createCountdownDiv(this));
            }
            this.refresh();
        }
    
    }
    
    addRowsFromData(rowData: RowData[]) {
        for (var row of rowData) { 
            let QL = new QuestionLogic(row, this.settings);
            let QD = QL.createQuestionDiv(this.questionsDiv);
            this.questionsDiv.appendChildElement(QD);
            let SD = QL.createSolutionDiv(this.solutionsDiv);
            this.solutionsDiv.appendChildElement(SD);
            this.questionLogics.push(QL);
        }
    }
    
    duplicateRow(QL: QuestionLogic) {
        let newQL = new QuestionLogic(QL.rowData, this.settings, QL);
        let newQD = newQL.createQuestionDiv(this.questionsDiv);
        this.questionsDiv.appendChildElement(newQD, QL.questionDiv);
        let newSD = newQL.createSolutionDiv(this.questionsDiv);
        this.solutionsDiv.appendChildElement(newSD, QL.solutionDiv);
    }


    shuffle(shuffleQuestionNumbers) {
        let seed = this.settings.random.next();
        this.questionsDiv.shuffleChildren(new Random(seed));
        this.solutionsDiv.shuffleChildren(new Random(seed));
        if (shuffleQuestionNumbers) {
            helpers.shuffleInPlace(QuestionNumberLogic.instances,new Random(seed));
            QuestionNumberLogic.instances.forEach(q => q.refreshSpans());
        }
    }

    deleteAll() {
        this.questionLogics.forEach(ql => ql.destroy());
    }
    
    scroll() {
        this.questionsDiv._element.lastElementChild.scrollIntoView();
    }
    
    truncate(n) {
        if (n == undefined) {
            n  = prompt("enter number of marks you want left over","10");
        }
        let i = 0;
        //find question which runs over the mark limit
        while (this.questionLogics[i] && n >= helpers.lengthOfObject(this.questionLogics[i].commentLogic.scoreLogicsWithCommentLetters) ) {
            n -= helpers.lengthOfObject(this.questionLogics[i].commentLogic.scoreLogicsWithCommentLetters);
            i++;
        }
        //trim surplus solutions from this question
        let lastQn = this.questionLogics[i];
        if (lastQn) {
            let scoreLogics: ScoreLogic[] = helpers.getValuesFromObject(lastQn.commentLogic.scoreLogicsWithCommentLetters);
            if (n > 0) {
                lastQn.commentLogic.truncate(scoreLogics.length - n);
            }
            if (n > 0) { i++; }
            this.questionLogics.slice(i).forEach(ql => ql.destroy());
        }
    }
    
    regenerateAllQuestions() { //templates only
        CommentLogic.instances.forEach(c => c.generateNewDollars());
    }

    previewInNewWindow() {
        let previewWindow = window.open("", "", "");
            previewWindow.document.write(`
<html>
<head>

    <meta charset="UTF-8"> 
    <link id="style" rel="stylesheet" type="text/css" href="assignment.css">
    <script src="assignment.js"></script>
    <script async src="acorn_interpreter.js"></script>

</head>

<body onload="init()">
    <div id="assignment"></div>
    <script>

        function init() {
            var previewSettings = {
                appendMode: false,
                endTime: null,
                initialChecksRemaining : -1,
                presentMode: false,
                questionJSON: ${JSON.stringify(JSON.stringify(this.currentQuestionData))},

                removeHyperlinks: false,
                responses: null,
                shuffleQuestions: false,
                startTime: new Date(),
                title: "",

                truncateMarks: -1,
                
                allowGridlines : true,
                allowRowDelete : true,
                allowRowDuplicate: true,
                allowRefresh: true,
            };

        window.assignment = new Assignment(document.getElementById("assignment"),new Settings(previewSettings));
        }
    </script>
</body>
</html>
`);
        previewWindow.document.close();
    }

    presentInNewWindow() {
        let previewWindow = window.open("", "", "");
            previewWindow.document.write(`
<html>
<head>

    <meta charset="UTF-8"> 
    <link id="style" rel="stylesheet" type="text/css" href="reveal.css">
    <script src="assignment.js"></script>
    <script src="reveal.js"></script>
    <script async src="acorn_interpreter.js"></script>

</head>

<body onload="init()">
    <div id="assignment"></div>
    <script>

        function init() {
            var revealSettings = {
                appendMode: false,
                endTime: null,
                initialChecksRemaining : -1,
                presentMode: true,
                questionJSON: ${JSON.stringify(JSON.stringify(this.currentQuestionData))},

                removeHyperlinks: false,
                responses: null,
                shuffleQuestions: false,
                startTime: new Date(),
                title: "",

                truncateMarks: -1,
                
                allowGridlines : false,
                allowRowDelete : false,
                allowRowDuplicate: false,
                allowRefresh: false,
            };

        window.assignment = new Assignment(document.getElementById("assignment"),new Settings(revealSettings));
        }
    </script>
</body>
</html>
`);
        previewWindow.document.close();

    }

    get questionNumbers() { //to populate the marksheet
        return this.questionLogics.reduce((a, b) => a.concat(b.questionNumbers), []);
    }

    get currentQuestionData() {
        return this.questionLogics.map(ql => ql.rowData);
    }
}

