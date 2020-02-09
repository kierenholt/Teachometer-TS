

const TIME_COLUMN = "Time remaining";
const CHECKS_COLUMN = "Checks remaining";

class AssignmentHTML {
    rowHTMLs: any[];
    settings: any;
    timerInterval: number;
    _questionNumbers: any[];
    submitButton: any;
    previewWindow: Window;
    //anticheatDiv: HTMLDivElement;
    
    constructor(settings) {
        this.rowHTMLs = [];

        this.settings = settings;
        this.settings.random = new Random();

        //markbookSettings values are true or false
        this.settings.shuffleQuestions = (this.settings["shuffle questions"] == true);
        this.settings.truncateMarks = Number(this.settings["mark limit"]);
        this.settings.journalMode = (this.settings["journal mode"] == true);
        this.settings.appendToMarkbook =  (this.settings["append mode"] == true);
        this.settings.removeHyperlinks = (this.settings["remove hyperlinks"] == true);

        //checks remaining
        if (this.settings.responses && CHECKS_COLUMN in this.settings.responses) {
            this.settings.numChecksLeft = Number(this.settings.responses[CHECKS_COLUMN]);
        }
        else { //default value
            this.settings.numChecksLeft = Number(this.settings["checks limit"]);
        }

        //timeRemaining
        if (Number(this.settings["time limit"]) > 0) {
            if (this.settings.responses && this.settings.responses[TIME_COLUMN]) {
                this.settings.timeRemaining = Number(this.settings.responses[TIME_COLUMN]);
            }
            else { //default value
                this.settings.timeRemaining = Number(this.settings["time limit"]);
            }
            this.startTimer();
        }                    

        //Number of clicks away
        if (false) {
            window.onblur = function(paramAsn) { 
                var asn = paramAsn;
                return function() {
                    asn.settings.clicksAway++;
                };
            }(this); 
            this.settings.clicksAway = Number(this.settings.scores[0]);
        } 

        if ("question data" in settings) {
            this.consumeRowsString(settings["question data"]);
        }
    }
    
    startTimer() {
        let timerDiv = document.createElement("div");
        timerDiv.className += " timer";
        this.settings.questionsDiv.parentElement.appendChild(timerDiv);
        
        this.timerInterval = setInterval(function(timeLimit, paramDiv, paramAsn) {
            
            var asn = paramAsn;
            var countUp = timeLimit == 0;
            var target = new Date().getTime() + 1000 * 60 * timeLimit;
            var div = paramDiv;
            //REPEATS EVERY 0.9 SECONDS
            return function() {
                let distance = (target - new Date().getTime()) * (countUp ? -1 : 1);
                let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                div.innerHTML = hours + "h " + minutes + "m " + seconds + "s ";

                //if minute elapses, update markbook
                if (minutes < asn.settings.timeRemaining && minutes >= 0) {
                    let scores = {};
                    scores[TIME_COLUMN] = {
                        "value" : minutes,
                        "append" : false };
                    if (asn.settings.markbookUpdate) {
                        asn.settings.markbookUpdate(scores)
                    }
                }

                asn.settings.timeRemaining = minutes;

                if (distance < 60 * 1000 && !countUp) {
                    div.className += " red";
                }      
                
                // If the count down is over, write some text 
                if (distance < 0) {
                    asn.settings.timeRemaining = 0;
                    clearInterval(asn.timerInterval);
                    div.innerHTML = "EXPIRED";
                    asn.settings.numChecksLeft = 1;
                    asn.showAllDecisionImages(false); //does not show warning
                }
            };
            }(this.settings.timeRemaining, timerDiv, this), 900);
    }

    consumeRowsString(blobString) {
        let seed = undefined;
        if (!this.settings.journalMode) {
            seed = helpers.CombineHashCodes([this.settings.user]); //different test per user
        }
        this.settings.random = new Random(seed);
           
        var rows = JSON.parse(blobString);

        if (rows != undefined && rows.length > 0) {
            //DO  NOT ADD ROWHTMLS ONE BY ONE
            this.addRows(rows);
        }
        
        //if shuffle is ON
        if (this.settings.shuffleQuestions) {this.shuffle();}
        if (this.settings.truncateMarks > 0) {this.truncate(this.settings.truncateMarks)}
        

        //must be before disabled = true
        if (this.settings.numChecksLeft <= 0) { //show results
            this.questionHTMLs.forEach(s => s.showDecisionImage());
        }

        //SUBMIT BUTTON, if test not already taken and submitted
        if (!this.submitButton)  {
            if (this.settings.numChecksLeft == undefined || this.settings.numChecksLeft != 0) {
                this.submitButton = document.createElement("button");
                this.submitButton.id = "submitButton";

                this.submitButton.onclick = 
                function(paramAssignment) {
                    var asn = paramAssignment; 
                    return function() {asn.showAllDecisionImages(true)};
                }(this);

                var checksLeftText = "";
                if (this.settings.numChecksLeft != undefined) {
                    checksLeftText = this.settings.numChecksLeft < 1 ? "" :
                        this.settings.numChecksLeft == 1 ? ` (${this.settings.numChecksLeft} check remaining)` :
                        ` (${this.settings.numChecksLeft} checks remaining)`;
                }
                this.submitButton.innerText = this.settings.submitButtonText + checksLeftText;
                this.settings.questionsDiv.parentElement.appendChild(this.submitButton);
            }
            else { //checks = 0
                if (this.settings.markbookUpdate) {
                    this.settings.markbookUpdate = undefined;
                }
                var scoreParagraph = document.createElement("p");
                scoreParagraph.id = "scoreParagraph";
                scoreParagraph.innerHTML = `<h1>FINAL SCORE: ${this.rawCorrect} out of ${this.outOf}</h1>`;
                this.settings.questionsDiv.appendChild(scoreParagraph);
                this.disabled = true;
            }
        }
    }

    //CALLED FROM A BUTTON
    addRows(paramRows: RowHTML[], index?: number) {
        var newRowHTMLs = [];
        for (let r = 0, row; row = paramRows[r]; r++) {
            //FILL TITLE ROWS
            let showTitle = true;
            if (this.rowHTMLs.length > 0) {
                let previousTitle = this.rowHTMLs[this.rowHTMLs.length - 1].row.title;
                if (previousTitle == row.title) {
                    showTitle = false;
                }
            }

            //create new row
            let newRowHTML = null;
            if (row.purpose == "question") {
                newRowHTML  = new QuestionHTML(row, showTitle, this.settings);
            }
            else if (row.purpose == "template" || row.purpose == "sudoku") {
                newRowHTML  = new TemplateHTML(row, showTitle, this.settings);  
            }
            else {
                newRowHTML  = new RowHTML(row, showTitle, this.settings);
            }

            //self delete and duplicate
            newRowHTML.deleteSelf = function(paramAsn,paramRow) {
                var asn = paramAsn; var row = paramRow; return function() {asn.deleteRows([row])};
            }(this,newRowHTML);
            newRowHTML.duplicateSelf = function(paramAsn,paramRow) {
                var asn = paramAsn; var row = paramRow; return function() {asn.duplicateRow(row)};
            }(this,newRowHTML);

            newRowHTMLs.push(newRowHTML);
        }

        
        //insert into rowHTMLs
        if (index != undefined && index < this.rowHTMLs.length) {
            var end = this.rowHTMLs.splice(index);
            this.rowHTMLs = this.rowHTMLs.concat(newRowHTMLs).concat(end);
        }
        else {
            this.rowHTMLs = this.rowHTMLs.concat(newRowHTMLs);
        }

        this.refreshDivs();
        this.updateQuestionNumbers(); //must occur after outerDivs are generated
    }

    scroll() {
        this.settings.questionsDiv.lastChild.scrollIntoView();
    }

    
    refreshDivs() {
        while (this.settings.questionsDiv.firstChild) {
            this.settings.questionsDiv.removeChild(this.settings.questionsDiv.firstChild);
        }
        while (this.settings.solutionsDiv && this.settings.solutionsDiv.firstChild) {
            this.settings.solutionsDiv.removeChild(this.settings.solutionsDiv.firstChild);
        }
        while (this.settings.jumbledSolutionsDiv && this.settings.jumbledSolutionsDiv.firstChild) {
            this.settings.jumbledSolutionsDiv.removeChild(this.settings.jumbledSolutionsDiv.firstChild);
        }
        
        //redo divs
        this.rowHTMLs.forEach(r => 
            this.settings.questionsDiv.appendChild(r.outerDiv)
            );
        if (this.settings.solutionsDiv) {
            for (var i = 0; i < this.questionHTMLs.length; i++) {
                this.settings.solutionsDiv.appendChild(this.questionHTMLs[i].solutionDiv)
            }
        }
        if (this.settings.jumbledSolutionsDiv) {
            for (var i = 0; i < this.questionHTMLs.length; i++) {
                for (var j = 0; j < this.questionHTMLs[i].jumbleDivs.length; j++) {
                    this.settings.jumbledSolutionsDiv.appendChild(this.questionHTMLs[i].jumbleDivs[j])
                }
            }
        }

    }

    //also called from a button
    refresh() { //templates only
        this.templateHTMLs.forEach(r => r.refresh());
    }
    
    //called from rowhtml delete button
    deleteRows(TRHTMLs) {
        TRHTMLs.forEach(r => r.delete());
        this.rowHTMLs = this.rowHTMLs.filter(r => !TRHTMLs.includes(r));
        this.updateQuestionNumbers();
    }

    //also called from a button
    duplicateRow(TRHTML) {
        let index = this.rowHTMLs.indexOf(TRHTML);
        this.addRows([TRHTML.row], index);
        this.updateQuestionNumbers();
    }

    //also called from a button
    deleteAll() {
        this.rowHTMLs.forEach(r => r.delete(false));
        this.rowHTMLs = [];
    }

    updateQuestionNumbers() { //happens when row is removed or added
        //update subsequent question numbers
        this._questionNumbers = [];
        let qn = 1; //start numbering at 1
        for (let rowHTML of this.questionHTMLs) {
            rowHTML.questionNumber = qn++; //also triggers solutiondiv refresh
        }

        //shuffle jumbledSolutionsDiv
        if (this.settings.jumbledSolutionsDiv) {
            var divs = []; //HTML collection is not an array
            for (var i = 0; i < this.settings.jumbledSolutionsDiv.children.length; i++) {
                divs.push(this.settings.jumbledSolutionsDiv.children[i])
            }
            while (this.settings.jumbledSolutionsDiv.firstChild) {
                this.settings.jumbledSolutionsDiv.removeChild(this.settings.jumbledSolutionsDiv.firstChild);
            }
            helpers.shuffle(divs,this.settings.random);
            divs.forEach(d => this.settings.jumbledSolutionsDiv.appendChild(d));
        }
    }

    get questionNumbers() { //to populate the marksheet
        return this.questionHTMLs.map(r => r.questionNumbers).reduce((a, b) => a.concat(b), []);
    }
    

    //this is the 'check my answers' button
    showAllDecisionImages(showwarning)
    {
        if (this.settings.numChecksLeft == 1 && showwarning) {
            if (!confirm("This will show your marks, but also prevent you making any further changes. Are you sure?")) {
                return;
            }
        }

        this.questionHTMLs.forEach(s => s.showDecisionImage());
        
        if (this.settings.numChecksLeft != undefined) {
            this.settings.numChecksLeft--;


            //submit button text
            this.settings.numChecksLeft == 1 ? ` (${this.settings.numChecksLeft} check remaining)` :
                ` (${this.settings.numChecksLeft} checks remaining)`;
            var checksLeftText = this.settings.numChecksLeft < 1 ? "" :
                this.settings.numChecksLeft == 1 ? ` (${this.settings.numChecksLeft} check remaining)` :
                ` (${this.settings.numChecksLeft} checks remaining)`;
            if (this.submitButton) {
                this.submitButton.innerText = this.settings.submitButtonText + checksLeftText;
            }
        }

        //THIS CALL TO MARKBOOK UPDATE IS NECESSARY SINCE CHECKS MIGHT RUN OuT ETC.
        let scores = {};
        scores[CHECKS_COLUMN] = 
            {"value" : this.settings.numChecksLeft,
            "append" : false};
        if (this.settings.markbookUpdate) {
            this.settings.markbookUpdate(scores)
        }

        if (this.settings.numChecksLeft == 0) { //NO CHECKS LEFT
            if (this.settings.markbookUpdate) {
                this.settings.markbookUpdate = undefined;
            }
            
            var scoreParagraph = document.createElement("p");
            scoreParagraph.id = "scoreParagraph";
            scoreParagraph.innerHTML = `<h1>FINAL SCORE: ${this.rawCorrect} out of ${this.outOf}</h1>`;
            if (this.submitButton.parentElement) {
                this.submitButton.parentElement.appendChild(scoreParagraph,this.submitButton);
            }
            this.submitButton.remove();
            this.disabled = true;
        }

    }

    get revealSections() {
        return this.rowHTMLs.map(r => r.revealSection).join("\n");
    }

    previewInNewWindow(settings) {
        let styleText = "";
        var css:any = document.styleSheets[0];
        if (css) for (let rule of css.cssRules) {styleText += rule.cssText;}

            this.previewWindow = window.open("", "preview", "");
            if (this.previewWindow["assignment"]) {
                this.previewWindow["assignment"].deleteAll();
            }
            else { //initialise new assignment
                this.previewWindow["helpers"] = window.helpersMaker();			
                this.previewWindow.document.write(`
<head>
<style>
${styleText}
</style>
</head>
<body>
<div id="questionsDiv"></div>
</body>
`);
                this.previewWindow.stop();
                settings["questionsDiv"] = this.previewWindow.document.getElementById("questionsDiv");

                this.previewWindow["assignment"] = new AssignmentHTML(settings);
            }
            this.previewWindow["assignment"].consumeRowsString(JSON.stringify(this.rows));
    }


    get rows() {
        return this.rowHTMLs.map(r => r.row);
    }

    get questionHTMLs() { //QUESTIONS AND TEMPLATES
        return this.rowHTMLs.filter(r =>  r instanceof QuestionHTML);
    }

    get templateHTMLs() {
        return this.rowHTMLs.filter(r =>  r instanceof TemplateHTML);
    }


    get rawCorrect() {
        return this.questionHTMLs.reduce((a, b) => a + b.correct, 0); //all solutions count 1 mark
    }

    get rawAttempted() {
        return this.questionHTMLs.reduce((a, b) => a + b.attempted, 0); //all solutions count 1 mark
    }

    get rawStars() {
        return this.questionHTMLs.reduce((a, b) => a + b.stars, 0); //all solutions count 1 mark
    }
    //called by solution when updating markbook
    get outOf() {
        return this.questionHTMLs.reduce((a, b) => a + b.outOf, 0); //all solutions count 1 mark
    }
    

    get aggregateScoreGetter() { //should not be a getter since needs to be passed as a function
        return function(paramAsn) {
            var asn = paramAsn;
            return function() {
                return {
                    "Correct":{"value":asn.rawCorrect},
                    "Attempted":{"value":asn.rawAttempted},
                    "Stars":{"value":asn.rawStars},
                    "Out of":{"value":asn.outOf}
                };
            }
        }(this);
    }


    //also called by a button, does not replace qn numbers
    shuffle() {
        this.rowHTMLs = helpers.shuffle(this.rowHTMLs,this.settings.random);
        this.refreshDivs();
    }

    truncate(n) {
        /*** MARKS ***/
        if (n == undefined) {
            n  = prompt("enter number of marks you want left over","10");
        }
        let i = 0;
        while (n >= this.questionHTMLs[i].solutions.length && this.questionHTMLs[i]) {
            n -= this.questionHTMLs[i].solutions.length;
            i++;
        }
        //trim surplus solutions from this question
        let lastQn = this.questionHTMLs[i];
        if (n > 0) {
            for (let j = 0; j < (lastQn.solutions.length - n); j++) {
                lastQn.solutions[lastQn.solutions.length - 1 - j].disabled = true;
            }
        }
        if (n > 0) { i++; }
        this.deleteRows(this.questionHTMLs.slice(i));
        
        /*** QUESTIONS

        let n  = prompt("enter number of questions you want left over","10")
        if ((helpers.isNumeric(n)) {
            this.deleteRows(this.rowHTMLs.slice(n));
        }*/
    }

    set disabled(value) {
        this.questionHTMLs.forEach(q => q.disabled = value);
        if (this.submitButton)  {    
            this.submitButton.disabled = value;
        }
    }
    
}
