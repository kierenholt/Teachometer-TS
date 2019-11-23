
class AssignmentHTML {
    rowHTMLs: any[];
    settings: any;
    timerDiv: HTMLDivElement;
    timerInterval: number;
    _questionNumbers: any[];
    submitButton: any;
    previewWindow: Window;
    //anticheatDiv: HTMLDivElement;
    
    constructor(internalSettings, markbookSettings) {
        this.rowHTMLs = [];

        this.settings = internalSettings;
        this.settings.random = new Random();


        //markbookSettings values are true or false
        if (markbookSettings) {
            //"score is out of attempted questions not all questions" default true
            this.settings.outOfOnlyQuestionsAttempted = (markbookSettings["score attempted questions only"] == "ON");
            this.settings.shuffleQuestions = (markbookSettings["shuffle"] == "ON");
            this.settings.truncateMarks = Number(markbookSettings["truncate"]);
            //this.settings.numChecksLeft = Number(markbookSettings["check limit"]);
            this.settings.journalMode = (markbookSettings["journal mode"] == "ON");
            //this.settings.antiCheatMode = (markbookSettings["anticheat mode"] == "ON");
            this.settings.allowRefresh = (markbookSettings["allow refresh"] == "ON");
            this.settings.appendToMarkbook =  (markbookSettings["append stored responses"] == "ON");
            this.settings.reportScoreAsPercentage =  (markbookSettings["report score as percentage"] == "ON");
            
            let scoreHeaders = [markbookSettings["scoreHeader1"],markbookSettings["scoreHeader2"],markbookSettings["scoreHeader3"]];
            let scores = [markbookSettings["score1"],markbookSettings["score2"],markbookSettings["score3"]];
            
            var index1 = scoreHeaders.indexOf("checks remaining"); 
            if (index1 > -1) {
                this.settings.numChecksLeft = Number(scores[index1]);
            } 
            var index2 = scoreHeaders.indexOf("clicks away")
            if (index2 > -1) {
                window.onblur = function(paramAsn) { 
                    var asn = paramAsn;
                    return function() {
                        asn.settings.clicksAway++;
                    };
                }(this); 
            
                this.settings.clicksAway = Number(scores[index2]);
            } 

            //add score getters to settings so that solution can call them 
            this.settings.scoreGetters = function(paramAsn,scoreHeaders){
                var asn = paramAsn; 
                var ret = [];
                for (let header of scoreHeaders) {
                    switch (header) {
                        case "attempted %":
                        ret.push(function() {return asn.percentAttempted;})
                        break;
                        case "correct %":
                        ret.push(function() {return asn.percentCorrect;})
                        break;
                        case "stars %":
                        ret.push(function() {return asn.percentStars;})
                        break;
                        case "clicks away":
                        ret.push(function() {return asn.settings.clicksAway;})
                        break;
                        case "checks remaining":
                        ret.push(function() {return asn.settings.numChecksLeft;})
                        break;
                        default: //also case "none"
                        ret.push(function() { return ""; });
                    }
                }
                return ret;
            }(this,scoreHeaders);
            

            //time limit
            this.settings.timeLimit = Number(markbookSettings["time limit"]);
            if (this.settings.timeLimit > -1) {

                this.timerDiv = document.createElement("div");
                this.timerDiv.className += " timer";
                this.settings.questionsDiv.parentElement.appendChild(this.timerDiv);
                
                this.timerInterval = setInterval(function(timeLimit, paramDiv, paramAsn) {

                    var asn = paramAsn;
                      var countUp = timeLimit == 0;
                      var target = new Date().getTime() + 1000 * 60 * timeLimit;
                      var div = paramDiv;

                      return function() {
                          let distance = (target - new Date().getTime()) * (countUp ? -1 : 1);
                          let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                          let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                          div.innerHTML = hours + "h " + minutes + "m " + seconds + "s ";

                          if (distance < 60 * 1000 && !countUp) {
                              div.className += " red";
                          }      
                          
                          // If the count down is over, write some text 
                          if (distance < 0) {
                            clearInterval(asn.timerInterval);
                            div.innerHTML = "EXPIRED";
                            asn.settings.numChecksLeft = 1;
                            asn.showAllDecisionImages(false); //does not show warning
                          }
                      };
                    }(this.settings.timeLimit, this.timerDiv, this), 900);
                
            }

            this.settings.markbookUpdate = markbookSettings.markbookUpdate;
            this.settings.markbookIndex = 0; //incremented by solutions

            this.settings.user = markbookSettings.user;
            this.settings.workbookId = markbookSettings.workbookId;
            this.settings.sheetName = markbookSettings.sheetName;

            //responses
            if (markbookSettings.responses) { 
                this.settings.responses = markbookSettings.responses
            }
            else {
                this.settings.responses = {};
            }

        }
        //end of if(markbooksettings)
    }
    
    //CALLED FROM A BUTTON
    addRows(paramRows: RowHTML[], index?: number) {
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
            newRowHTML.deleteSelf = function(paramAsn,paramRow) {
                var asn = paramAsn; var row = paramRow; return function() {asn.deleteRows([row])};
            }(this,newRowHTML);
            newRowHTML.duplicateSelf = function(paramAsn,paramRow) {
                var asn = paramAsn; var row = paramRow; return function() {asn.duplicateRow(row)};
            }(this,newRowHTML);

            //insert into rowHTMLs
            if (index != undefined && index < this.rowHTMLs.length) {
                this.rowHTMLs.splice(index+1,0,newRowHTML);
            }
            else {
                this.rowHTMLs.push(newRowHTML);                
            }
            this.insertRowIntoDivs(newRowHTML,index);
            if (index != undefined) { index++; }
        }
        this.updateQuestionNumbersAndMarkbookIndex();
    }

    scroll() {
        this.settings.questionsDiv.lastChild.scrollIntoView();
    }

    insertRowIntoDivs(newRowHTML:RowHTML,index?:number) {
        if (index == undefined) {
            index = this.rowHTMLs.length;
        }
        if (this.settings.questionsDiv.children[index+1]) {
            this.settings.questionsDiv.insertBefore(newRowHTML.outerDiv,this.settings.questionsDiv.children[index+1]);
        }
        else {
            this.settings.questionsDiv.appendChild(newRowHTML.outerDiv);
        }
        if (this.settings.solutionsDiv && newRowHTML.solutionDiv) {
            if (this.settings.solutionsDiv.children[index+1]) {
                this.settings.solutionsDiv.insertBefore(newRowHTML.solutionDiv,this.settings.solutionsDiv.children[index+1]);
            }
            else {
                this.settings.solutionsDiv.appendChild(newRowHTML.solutionDiv);
            }
        }
        if (this.settings.jumbledSolutionsDiv && newRowHTML.jumbleDivs) {
            newRowHTML.jumbleDivs.forEach(s => this.settings.jumbledSolutionsDiv.appendChild(s));
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
        this.updateQuestionNumbersAndMarkbookIndex();
    }

    //also called from a button
    duplicateRow(TRHTML) {
        let index = this.rowHTMLs.indexOf(TRHTML);
        this.addRows([TRHTML.row], index);
        this.updateQuestionNumbersAndMarkbookIndex();
    }

    //also called from a button
    deleteAll() {
        this.rowHTMLs.forEach(r => r.delete(false));
        this.rowHTMLs = [];
    }

    updateQuestionNumbersAndMarkbookIndex() { //happens when row is removed or added
        //update subsequent question numbers
        this._questionNumbers = [];
        
        let qn = 1; //start numbering at 1
        for (let rowHTML of this.questionHTMLs) {
            this._questionNumbers = this._questionNumbers.concat(rowHTML.setQuestionNumber(qn++)); //triggers solutiondiv refresh
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
            helpers.shuffle(divs);
            divs.forEach(d => this.settings.jumbledSolutionsDiv.appendChild(d));
        }
    }

    get questionNumbers() { //to populate the marksheet
        return this._questionNumbers;
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
/*
        if (this.settings.markbookUpdate) {
            this.settings.markbookUpdate(
                this.settings.checksLeftIndex, //after all solutions have been set 
                this.settings.numChecksLeft, //field.elementValue
                "white", //solution.color
                false, //append
                null); //no score update
        }*/

        if (this.settings.numChecksLeft == 0) { //NO CHECKS LEFT
            if (this.settings.markbookUpdate) {
                this.settings.markbookUpdate = undefined;
            }
            
            var scoreParagraph = document.createElement("p");
            scoreParagraph.id = "scoreParagraph";
            scoreParagraph.innerHTML = `<h1>FINAL SCORE: ${this.rawCorrect} out of ${this.outOf} (${this.percentCorrect}%)</h1>`;
            this.submitButton.parentElement.appendChild(scoreParagraph,this.submitButton);
                        
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

        if (!this.previewWindow) {
            this.previewWindow = window.open("", "preview", "");
            this.previewWindow["helpers"] = window.helpersMaker();			
        }

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
let newSettings = {};
for (let index in this.settings) {newSettings[index] = this.settings[index];}
newSettings["questionsDiv"] = this.previewWindow.document.getElementById("questionsDiv");

this.previewWindow["assignment"] = new AssignmentHTML(newSettings,null);
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


    consumeRowsString(blobString) {
        let seed = undefined;
        if (!this.settings.journalMode) {
            seed = helpers.CombineHashCodes([this.settings.user]); //different test per user, per name
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
            this.settings.questionsDiv.appendChild(this.submitButton);
        }
        else { //checks = 0
            if (this.settings.markbookUpdate) {
                this.settings.markbookUpdate = undefined;
            }
            var scoreParagraph = document.createElement("p");
            scoreParagraph.id = "scoreParagraph";
            scoreParagraph.innerHTML = `<h1>FINAL SCORE: ${this.rawCorrect} out of ${this.outOf} (${this.percentCorrect}%)</h1>`;
            this.settings.questionsDiv.appendChild(scoreParagraph);
            this.disabled = true;
        }
    }

    //called by solution 
    get percentStars() {
        if (this.outOf == 0) { return 0; }
        return Math.round(this.rawStars * 100 / (this.settings.outOfOnlyQuestionsAttempted ? this.rawAttempted : this.outOf));  
    }

    get percentAttempted () {
        if (this.outOf == 0) { return 0; }
        return Math.round(this.rawAttempted * 100 / (this.settings.outOfOnlyQuestionsAttempted ? this.rawAttempted : this.outOf));  
    }

    get percentCorrect() {
        if (this.outOf == 0) { return 0; }
        return Math.round(this.rawCorrect * 100 / (this.settings.outOfOnlyQuestionsAttempted ? this.rawAttempted : this.outOf));  
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
    

    //also called by a button, does not replace qn numbers
    shuffle() {
        while (this.settings.questionsDiv.firstChild) {
            this.settings.questionsDiv.removeChild(this.settings.questionsDiv.firstChild);
        }
        while (this.settings.solutionsDiv && this.settings.solutionsDiv.firstChild) {
            this.settings.solutionsDiv.removeChild(this.settings.solutionsDiv.firstChild);
        }

        this.rowHTMLs = helpers.shuffle(this.rowHTMLs);
        this.rowHTMLs.forEach(r => this.insertRowIntoDivs(r));
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
