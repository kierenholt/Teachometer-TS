

interface RowData {
    comment: string;
    title: string;
    purpose: string;
    leftRight: string[];
}

class Assignment extends Container {
    questionsDiv: Container;
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
        if (this.settings.showSolutions) { 
            this.solutionsDiv = new Container(this, "div").addClass("solutionsDiv"); 
        }
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
            this._childNodes = [];
            //student picker - teacher only
            if (this.settings.studentPicker) {
                this._childNodes.push(this.settings.studentPicker.createCombo(this));
            }   
            this._childNodes.push(this.questionsDiv);   
            //submit button      
            if (!this.settings.instantChecking) {
                this.submitButtonAndFinalScoreLogic = new SubmitButtonAndFinalScoreLogic(this.settings);
                this.submitButtonDiv = this.submitButtonAndFinalScoreLogic.createDiv(this);
                this._childNodes.push(this.submitButtonDiv);
            }
            //solutions
            if (this.solutionsDiv) {
                this._childNodes.push(new HeadingCup(this,"solutions"));
                this._childNodes.push(this.solutionsDiv);
            }
            //timer
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
            if (this.solutionsDiv) {
                let SD = QL.createSolutionDiv(this.solutionsDiv);
                this.solutionsDiv.appendChildElement(SD);
            }
        }
    }
    
    duplicateRow(QL: QuestionLogic) {
        let newQL = new QuestionLogic(QL.rowData, this.settings, QL);
        let newQD = newQL.createQuestionDiv(this.questionsDiv);
        this.questionsDiv.appendChildElement(newQD, QL.questionDiv);
        let newSD = newQL.createSolutionDiv(this.questionsDiv);
        if (this.solutionsDiv) this.solutionsDiv.appendChildElement(newSD, QL.solutionDiv);
    }


    shuffle(shuffleQuestionNumbers) {
        let seed = this.settings.random.next();
        this.questionsDiv.shuffleChildren(new Random(seed));
        if (this.solutionsDiv) this.solutionsDiv.shuffleChildren(new Random(seed));
        if (shuffleQuestionNumbers) {
            helpers.shuffleInPlace(QuestionNumberLogic.instances,new Random(seed));
            QuestionNumberLogic.instances.forEach(q => q.refreshSpans());
        }
    }

    //resets questions according to question logic order (only relevant in lesson mode)
    resetQuestionOrder() {
        for (let ql of QuestionLogic.readOnlyInstances) {
            this.questionsDiv.appendChildElement(ql.questionDiv);
            if (this.solutionsDiv) this.solutionsDiv.appendChildElement(ql.solutionDiv);
        }
    }

    deleteAll() {
        QuestionLogic.readOnlyInstances.forEach(ql => ql.destroy());
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
        while (QuestionLogic.readOnlyInstances[i] && n >= helpers.lengthOfObject(QuestionLogic.readOnlyInstances[i].commentLogic.scoreLogicsWithCommentLetters) ) {
            n -= helpers.lengthOfObject(QuestionLogic.readOnlyInstances[i].commentLogic.scoreLogicsWithCommentLetters);
            i++;
        }
        //trim surplus solutions from this question
        let lastQn = QuestionLogic.readOnlyInstances[i];
        if (lastQn) {
            let scoreLogics: ScoreLogic[] = helpers.getValuesFromObject(lastQn.commentLogic.scoreLogicsWithCommentLetters);
            if (n > 0) {
                lastQn.commentLogic.truncate(scoreLogics.length - n);
            }
            if (n > 0) { i++; }
            QuestionLogic.readOnlyInstances.slice(i).forEach(ql => ql.destroy());
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
    <link id="style" rel="stylesheet" type="text/css" href="https://www.teachometer.co.uk/user/css/assignment.css">
    <script src="https://www.teachometer.co.uk/user/js/assignment.min.js"></script>
    <script async src="https://www.teachometer.co.uk/user/js/acorn_interpreter.js"></script>

</head>

<body onload="init()">
    <div id="assignment"></div>
    <script>

        function init() {
            var previewSettings = {
                questionJSON: ${JSON.stringify(JSON.stringify(this.currentQuestionData))}
            };

        window.assignment = new Assignment(document.getElementById("assignment"),new Settings(previewSettings,4));
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
    <link id="style" rel="stylesheet" type="text/css" href="https://www.teachometer.co.uk/user/css/reveal.css">
    <script src="https://www.teachometer.co.uk/user/js/assignment.min.js"></script>
    <script src="https://www.teachometer.co.uk/user/js/reveal.min.js"></script>
    <script async src="https://www.teachometer.co.uk/user/js/acorn_interpreter.js"></script>

</head>

<body onload="init()">
    <div id="assignment"></div>
    <script>

        function init() {
            var revealSettings = {
                questionJSON: ${JSON.stringify(JSON.stringify(this.currentQuestionData))},
            };

        window.assignment = new Assignment(document.getElementById("assignment"),new Settings(revealSettings,3));
        }
    </script>
</body>
</html>
`);
        previewWindow.document.close();

    }

    //columnHeaders
    get questionNumbers() { //to populate the marksheet
        return QuestionLogic.readOnlyInstances.reduce((a, b) => a.concat(b.columnHeaders), []);
    }

    get currentQuestionData() {
        return QuestionLogic.readOnlyInstances.map(ql => ql.rowData);
    }
}

