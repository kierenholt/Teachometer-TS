


//dollars in template markdown need replacing with calculated templates BEFORE cups are rendered (e.g. ![]($$))
//so templates need to be calculated BEFORE cups are rendered
//so templates may request elementvalue BEFORE an element EXISTS!
//so cups need values etc. BEFORE element exists!


//RowHTML -> QuestionHTML -> TemplateHTML 
class RowHTML {
    
    row: any;
    settings: any;
    _outerDiv: HTMLDivElement;
    marginDiv: HTMLDivElement;
    dynamicDiv: HTMLDivElement;
    titleDiv: HTMLDivElement;
    cupsWithGridlines: DivCup[];
    _cellCups: any;
    solutions: any[];
    _softErrors: any;
    deleteSelf: any;
    duplicateSelf: any;
    
    constructor(row, showTitle, settings) {
        this.row = row;
        this.settings = settings;

        this._outerDiv  = document.createElement("div");
        this.marginDiv  = document.createElement("div");
        this.dynamicDiv  = document.createElement("div");
        
        this._outerDiv.className = "outer";
        this.marginDiv.className = "margin";
        this.dynamicDiv.className = "dynamic";

        this._outerDiv.appendChild(this.marginDiv);
        if (showTitle && settings.showRowTitles) {
            this.titleDiv = document.createElement("div");
            this.titleDiv.className = "title";
            this.titleDiv.innerHTML = `<h1>${this.row.title}</h1>`;
            this._outerDiv.appendChild(this.titleDiv);
        }
        this._outerDiv.appendChild(this.dynamicDiv);

        //delete button
        if (this.settings.allowRowDelete) {
            let deleteButton =  document.createElement("img");
            deleteButton.className = "deleteButton hideOnPrint";
            deleteButton.onclick = (function(ref) { var r = ref; return function() {
                    if (r.deleteSelf) r.deleteSelf();
                } })(this);
            deleteButton.src = imageData.trash;
            this.marginDiv.appendChild(deleteButton);        
        }

        //duplicate button
        if (this.settings.allowRowDelete) {
            let duplicateButton =  document.createElement("img");
            duplicateButton.className = "duplicateButton hideOnPrint";
            duplicateButton.onclick = (function(ref) { var r = ref; return function() {
                    if (r.duplicateSelf) r.duplicateSelf(); 
                } })(this);
            duplicateButton.src = imageData.duplicate;
            this.marginDiv.appendChild(duplicateButton);        
        }


    }

    get outerDiv() { //called after constructor because parsing cellcups must happen first
        if (!this._cellCups) {

            //parse markdown and attach cups to solutions
            this.dynamicDiv.innerHTML  = this.cellCups.map(c => c.HTML).join("");
            
            //this also peforms calculation of solution values & templates
            //and assigns decision images to stored responses
            

            //in case of grid, set element for both cellcups
            this.cellCups[0].element = this.dynamicDiv.children[0];
            if (this.cellCups[1]) {
                this.cellCups[1].element = this.dynamicDiv.children[1];
            }
            
            //match up newly made HTMLelements to existing cups, onresponse events
            let elems = helpers.descendants(this.dynamicDiv);
            for (let el of elems) {
                if (el.id && el.id.substr(0,3) == "cup") {
                    let cupFound:FieldCup = FieldCup.instances[Number(el.id.substr(3,99))];
                    if (cupFound) {
                        cupFound.setElement(el);
                    }
                }
            }
        }
        return this._outerDiv;
    }

    get solutionDiv() { return null; }
    get jumbleDivs() { return null; }
    
    delete() {
        this._outerDiv.parentNode.removeChild(this._outerDiv);
    }

    getInjectorInstance() { return null; }
    
    replaceSudokuDollar(arg0: RegExp, arg1: (s: any) => InputCup, replaceSudokuDollar: any) {
        throw new Error("Method not implemented.");
    }

    get cellCups() {
        if (this._cellCups == null) {
            this._cellCups = [];

           //for questionHTML this persists the dollar replacer etc.
            let injectorInstance = this.getInjectorInstance();
            
            for (let markdown of this.row.leftRight) {
                if (markdown) {
                    let cellCup = new DivCup(markdown);

                //STRUCTURAL CUPS

                    //replace code
                    cellCup.replace(/(`{3,}[^`]*`{3,})/, (s) => { return new CodeCup(s); }, null);                

                    //replace tables and rows and cells in one go
                    cellCup.replace(/(?:^|\n)([\|¦](?:[^\n]|\n\|)*)/, (s) => { return new TableCup(s); }, null);
                    
                    //replace relative position containers 
                    cellCup.replace(/(?:^|\n)(@\[[0-9]+,[0-9]+\]\([^)]*\))/, (s) => { return new RelativePositionCup(s); }, null);

                    //replace bullet points with li
                    cellCup.replace(/(?:^|\n)(\*)/, (s) => { return new BulletCup(s); }, null);

                    //replace newlines with paragraph (br)
                    cellCup.replace(/(\n[^\n]*)/, (s) => { return new ParagraphCup(s); }, null);

                    //replace fractions
                    //(~\[[^\]]*\]\([^)]*\))
                    //(~\[[^\]]*\]\((?:\\\)|[^)])*\))
                    cellCup.replace(/(~\[[^\]]*\]\((?:\\\)|[^)])*\))/, (s) => { return new FractionCup(s); }, null);
                
                    //replace anchors
                    if (this.settings.removeHyperlinks) {
                        cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, (s) => { return new ChunkCup(""); }, null);
                    }
                    else {
                        cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, (s) => { return new AnchorCup(s); }, null);
                    }
                    
                    //replace images
                    cellCup.replace(/(!\[[^\]]*]\([^\)]*\))/, (s) => { return new ImageCup(s); }, null);


                //INPUTS 

                    //MUST GO AFTER THE IMAGES AND STUFF

                    cellCup.replace(/(_{10,})/, (s) => { return new TextAreaCup(s); }, null);

                    //replace inputs
                    cellCup.replace(/(_{2,9})/, (s) => { return new InputCup(s); }, null);
                    //replace checkboxes
                    cellCup.replace(/(?:[^\!]|^)(\[\])/, (s) => { return new CheckBoxCup(""); }, null);
                    //replace pound signs
                    cellCup.replace(/(££)/, (s) => { return new PoundCup(""); }, null);

                    //decides whether to replace radio given A. B. C. letter order. ;
                    let replaceRadioInjector = function() {
                        var nextLetter = 'A';
                      
                        return function(letter) {
                          if (letter.length == 2 && (letter[0] == nextLetter || letter[0] == 'A')) {
                              nextLetter = (String.fromCharCode(letter.charCodeAt(0) + 1));
                              return true;
                          }
                          return false;
                        };
                      }

                    //replace radio buttons
                    cellCup.replace(/(?:^|\s)([A-Z]\.)/, (s) => { return new RadioCup(s) }, replaceRadioInjector());

                    //replace combos
                    cellCup.replace(/({[^}]+\/[^}]+})/, (s) => { return new ComboCup(s) }, null);
                    
                    //sudoku needs some dollars hiding!
                    if (this.row.purpose == "sudoku") {                          
                        cellCup.replace(/(\$\$)/, (s) => { return new InputCup("___"); }, this.replaceSudokuDollar);
                    }
                
                //REPLACE DOLLARS

                    //replace dollars and create solutions array in questions and templates
                    if (injectorInstance) {
                        cellCup.onThisAndChildren(injectorInstance);
                        this.solutions.forEach(s => s.importResponses());
                    }

                //IMAGES AND TEXT


                    //replace titles
                    cellCup.replace(/((?:\n|^)#[^\n]+(?:\n|$))/, (s) => { return new TitleCup(s); }, null);

                    //replace superscripts
                    cellCup.replace(/(\^[\S]+)/, (s) => { return new SuperScriptCup(s); }, null);
                    cellCup.replace(/(\~[\S]+)/, (s) => { return new SubScriptCup(s); }, null);
                    //replace bolds and underlines
                    cellCup.replace(/(\*[^*]+\*)/, (s) => { return new BoldCup(s); }, null);
                    cellCup.replace(/(_[^_]+_)/, (s) => { return new UnderlineCup(s); }, null);



                    //turn on gridlines button if relative containers found inside cellcup
                    if (this.settings.allowGridlines) {
                        let relCounter = function() {
                            var foundRelativeContainer = false;

                            return function(cup?) {
                                if (cup instanceof RelativePositionCup) {
                                    foundRelativeContainer = true;
                                }
                                return foundRelativeContainer;
                            }
                        }();
                        cellCup.onThisAndChildren(relCounter);
                        var relativeCupFound = relCounter();
                        if (relativeCupFound) {
                            //add gridlines button
                            if (!this.cupsWithGridlines) { 
                                this.cupsWithGridlines = [cellCup];
                                if (true) {
                                    let toggleGridlinesButton =  document.createElement("img");
                                    toggleGridlinesButton.className = "toggleGridlinesButton hideOnPrint";
                                    toggleGridlinesButton.onclick = (function(ref) {
                                            var r = ref; 
                                            return function() {r.forEach(c => c.toggleGridlines())} 
                                        })(this.cupsWithGridlines);
                                    toggleGridlinesButton.src = imageData.grid;
                                    this.marginDiv.appendChild(toggleGridlinesButton);     
                                }
                            }
                            else {
                                this.cupsWithGridlines.push(cellCup);
                            }
                        };
                    }

                    //ADD TO ROW
                    this._cellCups.push(cellCup);

                }
            }

            //WIDTH
            if (this._cellCups.length == 1) {
                this._cellCups[0].class = "fullWidth";
            }
            if (this._cellCups.length == 2) {
                this._cellCups[0].class = "leftHalfWidth";
                this._cellCups[1].class = "rightHalfWidth";
            }

            


        } //end of if null
        return this._cellCups;
    }

    get revealSection() {
        return `<section><section>
            <h1>${this.row.title}</h1>
            <div class="dynamic">${this.dynamicDiv.innerHTML}</div>
        </section></section>`;
    }

}



class QuestionHTML extends RowHTML {
    questionNumberDiv: HTMLParagraphElement;
    _solutionDiv: any;
    _jumbleDivs: any;
    questionNum: string;
    constructor(row, showTitle, paramSettings) {
        super(row, showTitle, paramSettings);
        
        
        this.solutions = [];
        //question number
        this.questionNumberDiv = document.createElement("p");
        this.questionNumberDiv.className = "questionNumber";
        //margin contains icon buttons 
        this.marginDiv.insertBefore(this.questionNumberDiv,this.marginDiv.childNodes[0]);
        //question number is set later
    }

    delete() {
        super.delete();
        //remove solutions
        if (this._solutionDiv) {
            this._solutionDiv.parentNode.removeChild(this._solutionDiv);
        }
        //remove jumbled solutions
        if (this._jumbleDivs) {
            this._jumbleDivs.forEach(j => j.parentNode.removeChild(j));
        }
    }

    //injects solutions into dollars and input elements
    getInjectorInstance() {
            this.solutions = [];
            return this.injector(this.replacedTemplates(), this.solutions, this.settings);
            //for sudoku this also instantiates replaceSudokuDollar
    }   
    
    //jumbled solutions getter
    get jumbleDivs() {
        if (!this._jumbleDivs) {
            this._jumbleDivs = [];
            for (var i = 0; i < this.solutions.length; i++) {
                var j = document.createElement("div");
                j.className = "jumbleDivs";
                this._jumbleDivs.push(j);
            }
            this.refreshsolutionDiv();
        }
        return this._jumbleDivs;
    }

    //solution div getter
    get solutionDiv() {
        if (!this._solutionDiv) {
            this._solutionDiv = document.createElement("div");
            this._solutionDiv.className = "solutions";
            this.refreshsolutionDiv();
        }
        return this._solutionDiv;
    }

    refreshsolutionDiv() { //needed for question because it updates questionnumber
        //solutions
        var buffer = "";
        var ret = []
        for (var i = 0, solution; solution = this.solutions[i]; i++) {
            let qnNum = this.questionNum + String.fromCharCode(i + 97) +".";
            ret.push(qnNum);
            if (solution.affectsScore) {
                buffer += qnNum + ` ${solution.solutionText} <br>`;
            }
        }
        if (this._solutionDiv) {
            this._solutionDiv.innerHTML = `<p>${buffer}</p>`;
        }
        if (this._jumbleDivs) {
            for (var i = 0, solution; solution = this.solutions[i]; i++) {
                if (solution.affectsScore) {
                    this._jumbleDivs[i].innerHTML = solution.solutionText;
                }
            }
        }
        return ret;
    }

    //list of questiontemplate instances which are generated from comments
    replacedTemplates() {
        let comments = this.row.comment.split('\n');
        return comments.map(c => new questionTemplate(c));
    }

    //called from assignment
    setQuestionNumber(n) {
        this.questionNum = n;
        this.questionNumberDiv.innerText = `Q${this.questionNum}.`;
        return this.refreshsolutionDiv();
    }
    
    //INJECTS SOLUTIONS INTO EXPRESSION TREE AND REPLACE DOLLARS IN FIELDS
    injector(paramTemplates, paramSolutions, paramSettings)  {
            
            var currentRadioSet = null;
            var templates = paramTemplates.slice().reverse();
            var solutions = paramSolutions;
            var settings =  paramSettings;
            
            function addSolution(cup) {
                var ret;
                if (templates.length > 0) {
                    ret =  new Solution(cup,templates.pop(),settings, solutions);
                }
                else { 
                    ret = new Solution(cup,null,settings, solutions);
                }
                solutions.push(ret);
            }

            function getTemplateValue() {
                if (templates.length > 0) {
                    let t = templates.pop();
                    let ret = t.calculatedValue;
                    return calculatedJSONtoViewable(ret);
                }
                return "";
            }

            return function(fieldCup) {
                if (fieldCup != null && fieldCup instanceof FieldCup) {
                    if (fieldCup instanceof RadioCup) {
                        if (fieldCup.letter == 'A' || currentRadioSet == null) {
                            currentRadioSet = new RadioSet();
                            currentRadioSet.add(fieldCup);
                            addSolution(currentRadioSet);
                        }
                        else { //do not increment with next radios
                            currentRadioSet.add(fieldCup);
                        }
                    }
                    else { //input or select or textarea etc.
                        addSolution(fieldCup);
                    }
                }
                //if dollar is found, do not add a solution but do remove a template and replace the dollar
                if (fieldCup.textReplace != null) {
                    fieldCup.textReplace(/\${2}/g, getTemplateValue);
                    //jumbled solutions getterplace(/\${2}/g, getTemplateValue);
                    //do not add to solutions since the dollar solution is removed during textreplace
                }
            };
        }

    set disabled(value) {
        this.solutions.forEach(s => s.disabled = value);
    }
    
    get revealSection() {
        let solutionPlainText = this.solutions.map((s,i) => String.fromCharCode(97+i) + ". " + s.solutionText ).join("<br>");
        return `<section>
            <section>
            <h1>${this.row.title}</h1>
            <div class="dynamic">${this.dynamicDiv.innerHTML}</div>
            </section>
            <section>${solutionPlainText}</section>
        </section>`;

            /*
<table style="border-collapse: collapse; table-layout: fixed; width: 100%">
            <tr><td colspan="2"><h3>Q${this.questionNum}. ${this.row.title}</h3></td></tr>
            <tr>${this.cellCups.map(c => c.HTML).join("")}</tr>
            </table>
            */
    }

    showDecisionImage() {
        this.solutions.filter(s => s.outOf > 0).forEach(s => s.showDecisionImage());
    }

    get correct() {
        return this.solutions.reduce((a, b) => a + b.score, 0);
    }
    
    get outOf() {
        return this.solutions.reduce((a, b) => a + b.outOf, 0);
    }

    get attempted() {
        return this.solutions.reduce((a, b) => a + b.attempted, 0);
    }

    get stars() {
        return this.solutions.reduce((a, b) => a + b.stars, 0);
    }

}





class TemplateHTML extends QuestionHTML{
    randomForTemplate: any;
    constructor(row, showTitle, paramSettings) {
        super(row, showTitle, paramSettings);
        
        //refresh button
        if (this.settings.allowRefresh) {       
            let refreshButton =  document.createElement("img");
            refreshButton.src = imageData.refresh;
            refreshButton.className = "refreshButton hideOnPrint";
            refreshButton.onclick = (function(ref) {var r = ref; return function() {r.refresh()};})(this);
            this.marginDiv.appendChild(refreshButton);
        }


        this.randomForTemplate = paramSettings.random;
    }


    replacedTemplates() {
        let comments = this.row.comment.split('\n');

        //GENERATE TEMPLATES THEN OVERWRITE COMMENTS WITH RECALCULATED VALUES

            let templates = [];
            let paramIndexForRangeEvaluation = this.randomForTemplate.next();
            let customFunctions = {};
            for (var i = 0; i < comments.length; i++) { 
                templates.push(new Template(comments[i], templates, this.randomForTemplate, paramIndexForRangeEvaluation, customFunctions));
            }
            if (this.row.purpose == "sudoku") {
                //force calculate
                templates.forEach(function(t) {if (t) t.forceCalculate()});
                //number of dollars
                var numDollars = ((this.row.leftRight.join(" ")).match(/\$\$/g) || []).length;
                //sudoku only
                var variablesUsed = templates.map(function(t) {
                        if (t) return t.variablesUsed;
                        let ret =  [];
                        for (var i = 0; i < 26; i++) ret.push(false);
                        return ret; 
                    });
                //add variables to their own equations
                for (var i = 0, eqn; eqn = variablesUsed[i]; i++) {
                    eqn[i] = true;
                }
                //DO NOT remove all equations (rows) but trim cols (variables) to num templates
                variablesUsed = variablesUsed.map(arr => arr.slice(0,templates.length));
                
                var variablesToShow = showVariables(variablesUsed,numDollars,this.settings.random);
                var replaceSudokuDollarInjector = function(variablesToShow) {
                    var variablesToShow = variablesToShow;
                    var index = 0;

                    return function(letter) {
                      index++;
                      return !(variablesToShow[index-1]);
                    };
                  }
                this.replaceSudokuDollar = replaceSudokuDollarInjector(variablesToShow);

        }
        //each comment is an equation

        return templates;
    }


        
    refresh() { 
        this._cellCups = null;
        this.dynamicDiv.innerHTML  = this.cellCups.map(c => c.HTML).join("");
        this.refreshsolutionDiv();
    }
}


//takes square grid of rows (equations) with variables as true (columns)
function showVariables(arr:boolean[][],numDollars,paramRandom) {
    //automatically show variables (columns) that only appear once (in diagonal)
    var colsToShow = arr[0].map(a => false); //set all cols to false
    for (var rowCol = 0; rowCol < arr[0].length; rowCol++) {
        colsToShow[rowCol] = (arr[rowCol].filter(p => p).length == 1) 
            && (arr.filter(p => p[rowCol]).length == 1);
    }
    

    //remove equations (rows) with a single true
    arr = arr.filter(r => r.filter(p => p).length > 1);
    
    //target number hidden variables = num of equations at this point
    var maxColsToShow = colsToShow.length - arr.length;
    var backupArr = arr.map(row => row.slice());
    var backupColsToShow = colsToShow.slice();

    while (arr.length  > 0 || maxColsToShow < colsToShow.filter(p => p).length) {

        //if too may variables shown, reset and try again
        if (maxColsToShow < colsToShow.filter(p => p).length) {
            arr = backupArr.map(row => row.slice());
            colsToShow = backupColsToShow.slice();
        }

        var colsWithATrue = [];
        //get colsWithATrue from within the hidden

        /*for (var col = numDollars; col <  arr[0].length; col++) {
            var hasATrue = false;
            for (var row = 0; row < arr.length; row++) {
                hasATrue |= arr[row][col]; 
            }
            if (hasATrue) {
                colsWithATrue.push(col);
            }
        }*/

        //get cols with a true from within the dollars

        if (colsWithATrue.length == 0) {
            for (var col = 0; col < numDollars; col++) {
                var hasATrue = false;
                for (var row = 0; row < arr.length; row++) {
                    hasATrue = hasATrue || arr[row][col]; 
                }
                if (hasATrue) {
                    colsWithATrue.push(col);
                }
            }
        }

        //if no cols then stop
        if (colsWithATrue.length == 0) {
            break;
        }

        //randomly pick a col to remove

        var colToRemove = colsWithATrue[Math.floor(paramRandom.next(colsWithATrue.length))];
        colsToShow[colToRemove] = true;
        //set col to false 
        arr.forEach(f => f[colToRemove] = false);
        //if any rows have 1 true, remove that col too since these equations can be solved 
        var rowsWithOneTrue = arr.filter(r => r.filter(p => p).length == 1);
        while (rowsWithOneTrue.length > 0) {
            for (var r = 0; r < rowsWithOneTrue.length; r++) {
                var row2 = rowsWithOneTrue[r];
                var singleCol = row2.indexOf(true);
                //set col to false 
                arr.forEach(f => f[singleCol] = false);
                //remove rows with only one true
                arr = arr.filter(r => r.filter(p => p).length > 0);
            }
            rowsWithOneTrue = arr.filter(r => r.filter(p => p).length == 1);
        }
    }
    return colsToShow;
}