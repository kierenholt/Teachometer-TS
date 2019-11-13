var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//RowHTML -> QuestionHTML -> TemplateHTML 
var RowHTML = /** @class */ (function () {
    function RowHTML(row, showTitle, settings) {
        this.row = row;
        this.settings = settings;
        this._outerDiv = document.createElement("div");
        this.marginDiv = document.createElement("div");
        this.dynamicDiv = document.createElement("div");
        this._outerDiv.className = "outer";
        this.marginDiv.className = "margin";
        this.dynamicDiv.className = "dynamic";
        this._outerDiv.appendChild(this.marginDiv);
        if (showTitle && settings.showRowTitles) {
            this.titleDiv = document.createElement("div");
            this.titleDiv.className = "title";
            this.titleDiv.innerHTML = "<h1>" + this.row.title + "</h1>";
            this._outerDiv.appendChild(this.titleDiv);
        }
        this._outerDiv.appendChild(this.dynamicDiv);
        //delete button
        if (this.settings.allowRowDelete) {
            var deleteButton = document.createElement("img");
            deleteButton.className = "deleteButton hideOnPrint";
            deleteButton.onclick = (function (ref) {
                var r = ref;
                return function () {
                    window.assignment.deleteRows([r]);
                };
            })(this);
            deleteButton.src = imageData.trash;
            this.marginDiv.appendChild(deleteButton);
        }
        //duplicate button
        if (this.settings.allowRowDelete) {
            var duplicateButton = document.createElement("img");
            duplicateButton.className = "duplicateButton hideOnPrint";
            duplicateButton.onclick = (function (ref) { var r = ref; return function () { window.assignment.duplicateRow(r); }; })(this);
            duplicateButton.src = imageData.duplicate;
            this.marginDiv.appendChild(duplicateButton);
        }
    }
    Object.defineProperty(RowHTML.prototype, "outerDiv", {
        get: function () {
            if (!this._cellCups) {
                this.dynamicDiv.innerHTML = this.cellCups.map(function (c) { return c.HTML; }).join("");
            }
            return this._outerDiv;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RowHTML.prototype, "solutionDiv", {
        get: function () { return null; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RowHTML.prototype, "jumbleDivs", {
        get: function () { return null; },
        enumerable: true,
        configurable: true
    });
    RowHTML.prototype.delete = function () {
        this._outerDiv.parentNode.removeChild(this._outerDiv);
    };
    RowHTML.prototype.getInjectorInstance = function () { return null; };
    RowHTML.prototype.replaceSudokuDollar = function (arg0, arg1, replaceSudokuDollar) {
        throw new Error("Method not implemented.");
    };
    Object.defineProperty(RowHTML.prototype, "cellCups", {
        get: function () {
            var _this = this;
            if (this._cellCups == null) {
                this._cellCups = [];
                //for questionHTML this persists the dollar replacer etc.
                var injectorInstance = this.getInjectorInstance();
                for (var _i = 0, _a = this.row.leftRight; _i < _a.length; _i++) {
                    var markdown = _a[_i];
                    if (markdown) {
                        var cellCup = new DivCup(markdown);
                        //STRUCTURAL CUPS
                        //replace code
                        cellCup.replace(/(`{3,}[^`]*`{3,})/, function (s) { return new CodeCup(s); }, null);
                        //replace tables and rows and cells in one go
                        cellCup.replace(/(?:^|\n)([\|¦](?:[^\n]|\n\|)*)/, function (s) { return new TableCup(s); }, null);
                        //replace relative position containers 
                        cellCup.replace(/(?:^|\n)(@\[[0-9]+,[0-9]+\]\([^)]*\))/, function (s) { return new RelativePositionCup(s); }, null);
                        //replace newlines with paragraph (br)
                        cellCup.replace(/(\n[^\n]*)/, function (s) { return new ParagraphCup(s); }, null);
                        //replace fractions
                        //(~\[[^\]]*\]\([^)]*\))
                        //(~\[[^\]]*\]\((?:\\\)|[^)])*\))
                        cellCup.replace(/(~\[[^\]]*\]\((?:\\\)|[^)])*\))/, function (s) { return new FractionCup(s); }, null);
                        //replace anchors
                        if (this.settings.antiCheatMode) {
                            cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, function (s) { return new ChunkCup(""); }, null);
                        }
                        else {
                            cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, function (s) { return new AnchorCup(s); }, null);
                        }
                        //replace images
                        cellCup.replace(/(!\[[^\]]*]\([^\)]*\))/, function (s) { return new ImageCup(s); }, null);
                        //INPUTS 
                        //MUST GO AFTER THE IMAGES AND STUFF
                        cellCup.replace(/(_{10,})/, function (s) { return new TextAreaCup(s, _this.settings.window); }, null);
                        //replace inputs
                        cellCup.replace(/(_{2,9})/, function (s) { return new InputCup(s, _this.settings.window); }, null);
                        //replace checkboxes
                        cellCup.replace(/(?:[^\!]|^)(\[\])/, function (s) { return new CheckBoxCup("", _this.settings.window); }, null);
                        //replace pound signs
                        cellCup.replace(/(££)/, function (s) { return new PoundCup("", _this.settings.window); }, null);
                        //decides whether to replace radio given A. B. C. letter order. ;
                        var replaceRadioInjector = function () {
                            var nextLetter = 'A';
                            return function (letter) {
                                if (letter.length == 2 && (letter[0] == nextLetter || letter[0] == 'A')) {
                                    nextLetter = (String.fromCharCode(letter.charCodeAt(0) + 1));
                                    return true;
                                }
                                return false;
                            };
                        };
                        //replace radio buttons
                        cellCup.replace(/(?:^|\s)([A-Z]\.)/, function (s) { return new RadioCup(s, _this.settings.window); }, replaceRadioInjector());
                        //replace combos
                        cellCup.replace(/({[^}]+\/[^}]+})/, function (s) { return new ComboCup(s, _this.settings.window); }, null);
                        //sudoku needs some dollars hiding!
                        if (this.row.purpose == "sudoku") {
                            cellCup.replace(/(\$\$)/, function (s) { return new InputCup("___", _this.settings.window); }, this.replaceSudokuDollar);
                        }
                        //replace dollars and create solutions array in questions and templates
                        if (injectorInstance) {
                            cellCup.onThisAndChildren(injectorInstance);
                            this.solutions.forEach(function (s) { return s.importResponses(); });
                        }
                        //IMAGES AND TEXT
                        //replace titles
                        cellCup.replace(/((?:\n|^)#[^\n]+(?:\n|$))/, function (s) { return new TitleCup(s); }, null);
                        //replace superscripts
                        cellCup.replace(/(\^[\S]+)/, function (s) { return new SuperScriptCup(s); }, null);
                        cellCup.replace(/(\~[\S]+)/, function (s) { return new SubScriptCup(s); }, null);
                        //replace bolds and underlines
                        cellCup.replace(/(\*[^*]+\*)/, function (s) { return new BoldCup(s); }, null);
                        cellCup.replace(/(_[^_]+_)/, function (s) { return new UnderlineCup(s); }, null);
                        //turn on gridlines button if relative containers found inside cellcup
                        if (this.settings.allowGridlines) {
                            var relCounter = function () {
                                var foundRelativeContainer = false;
                                return function (cup) {
                                    if (cup instanceof RelativePositionCup) {
                                        foundRelativeContainer = true;
                                    }
                                    return foundRelativeContainer;
                                };
                            }();
                            cellCup.onThisAndChildren(relCounter);
                            var relativeCupFound = relCounter();
                            if (relativeCupFound) {
                                //add gridlines button
                                if (!this.cupsWithGridlines) {
                                    this.cupsWithGridlines = [cellCup];
                                    if (true) {
                                        var toggleGridlinesButton = document.createElement("img");
                                        toggleGridlinesButton.className = "toggleGridlinesButton hideOnPrint";
                                        toggleGridlinesButton.onclick = (function (ref) {
                                            var r = ref;
                                            return function () { r.forEach(function (c) { return c.toggleGridlines(); }); };
                                        })(this.cupsWithGridlines);
                                        toggleGridlinesButton.src = imageData.grid;
                                        this.marginDiv.appendChild(toggleGridlinesButton);
                                    }
                                }
                                else {
                                    this.cupsWithGridlines.push(cellCup);
                                }
                            }
                            ;
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RowHTML.prototype, "softErrors", {
        get: function () {
            if (this._softErrors == null) {
                this._softErrors = [];
            }
            return this._softErrors;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RowHTML.prototype, "revealSection", {
        get: function () {
            return "<section><section>\n            <h1>" + this.row.title + "</h1>\n            <div class=\"dynamic\">" + this.dynamicDiv.innerHTML + "</div>\n        </section></section>";
            /*
    <table style="border-collapse: collapse; table-layout: fixed; width: 100%">
            <tr><td colspan="2"><h3>${this.row.title}</h1></td></tr>
            <tr>${this.cellCups.map(c => c.HTML).join("")}</tr>
            </table>
            */
        },
        enumerable: true,
        configurable: true
    });
    return RowHTML;
}());
var QuestionHTML = /** @class */ (function (_super) {
    __extends(QuestionHTML, _super);
    function QuestionHTML(row, showTitle, paramSettings) {
        var _this = _super.call(this, row, showTitle, paramSettings) || this;
        _this.solutions = [];
        //question number
        _this.questionNumberDiv = document.createElement("p");
        _this.questionNumberDiv.className = "questionNumber";
        //margin contains icon buttons 
        _this.marginDiv.insertBefore(_this.questionNumberDiv, _this.marginDiv.childNodes[0]);
        return _this;
        //question number is set later
    }
    QuestionHTML.prototype.delete = function () {
        _super.prototype.delete.call(this);
        //remove solutions
        if (this._solutionDiv) {
            this._solutionDiv.parentNode.removeChild(this._solutionDiv);
        }
        //remove jumbled solutions
        if (this._jumbleDivs) {
            this._jumbleDivs.forEach(function (j) { return j.parentNode.removeChild(j); });
        }
    };
    //injects solutions into dollars and input elements
    QuestionHTML.prototype.getInjectorInstance = function () {
        this.solutions = [];
        return this.injector(this.replacedTemplates(), this.solutions, this.settings);
        //for sudoku this also instantiates replaceSudokuDollar
    };
    Object.defineProperty(QuestionHTML.prototype, "jumbleDivs", {
        //jumbled solutions getter
        get: function () {
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuestionHTML.prototype, "solutionDiv", {
        //solution div getter
        get: function () {
            if (!this._solutionDiv) {
                this._solutionDiv = document.createElement("div");
                this._solutionDiv.className = "solutions";
                this.refreshsolutionDiv();
            }
            return this._solutionDiv;
        },
        enumerable: true,
        configurable: true
    });
    QuestionHTML.prototype.refreshsolutionDiv = function () {
        //solutions
        var buffer = "";
        var ret = [];
        for (var i = 0, solution; solution = this.solutions[i]; i++) {
            var qnNum = this.questionNum + String.fromCharCode(i + 97) + ".";
            ret.push(qnNum);
            if (solution.affectsScore) {
                buffer += qnNum + (" " + solution.solutionText + " <br>");
            }
        }
        if (this._solutionDiv) {
            this._solutionDiv.innerHTML = "<p>" + buffer + "</p>";
        }
        if (this._jumbleDivs) {
            for (var i = 0, solution; solution = this.solutions[i]; i++) {
                if (solution.affectsScore) {
                    this._jumbleDivs[i].innerHTML = solution.solutionText;
                }
            }
        }
        return ret;
    };
    //list of questiontemplate instances which are generated from comments
    QuestionHTML.prototype.replacedTemplates = function () {
        var comments = this.row.comment.split('\n');
        return comments.map(function (c) { return new questionTemplate(c); });
    };
    //called from assignment
    QuestionHTML.prototype.setQuestionNumber = function (n) {
        this.questionNum = n;
        this.questionNumberDiv.innerText = "Q" + this.questionNum + ".";
        return this.refreshsolutionDiv();
    };
    //INJECTS SOLUTIONS INTO EXPRESSION TREE AND REPLACE DOLLARS IN FIELDS
    QuestionHTML.prototype.injector = function (paramTemplates, paramSolutions, paramSettings) {
        var firstRadioCup = null;
        var templates = paramTemplates.slice().reverse();
        var solutions = paramSolutions;
        var settings = paramSettings;
        function addSolution(cup) {
            var ret;
            if (templates.length > 0) {
                ret = new Solution(cup, templates.pop(), settings, solutions);
            }
            else {
                ret = new Solution(cup, null, settings, solutions);
            }
            solutions.push(ret);
        }
        function getTemplateValue() {
            if (templates.length > 0) {
                var t = templates.pop();
                var ret = t.calculatedValue;
                return calculatedJSONtoViewable(ret);
            }
            return "";
        }
        return function (fieldCup) {
            if (fieldCup != null && fieldCup instanceof FieldCup) {
                if (fieldCup instanceof RadioCup) {
                    if (fieldCup.letter == 'A' || firstRadioCup == null) {
                        addSolution(fieldCup);
                        firstRadioCup = fieldCup;
                    }
                    else { //do not increment with next radios
                        firstRadioCup.add(fieldCup);
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
    };
    Object.defineProperty(QuestionHTML.prototype, "disabled", {
        set: function (value) {
            this.solutions.forEach(function (s) { return s.disabled = value; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuestionHTML.prototype, "revealSection", {
        get: function () {
            var solutionPlainText = this.solutions.map(function (s, i) { return String.fromCharCode(97 + i) + ". " + s.solutionText; }).join("<br>");
            return "<section>\n            <section>\n            <h1>" + this.row.title + "</h1>\n            <div class=\"dynamic\">" + this.dynamicDiv.innerHTML + "</div>\n            </section>\n            <section>" + solutionPlainText + "</section>\n        </section>";
            /*
<table style="border-collapse: collapse; table-layout: fixed; width: 100%">
            <tr><td colspan="2"><h3>Q${this.questionNum}. ${this.row.title}</h3></td></tr>
            <tr>${this.cellCups.map(c => c.HTML).join("")}</tr>
            </table>
            */
        },
        enumerable: true,
        configurable: true
    });
    QuestionHTML.prototype.showDecisionImage = function () {
        this.solutions.filter(function (s) { return s.outOf > 0; }).forEach(function (s) { return s.showDecisionImage(); });
    };
    Object.defineProperty(QuestionHTML.prototype, "score", {
        get: function () {
            return this.solutions.filter(function (s) { return s.affectsScore; }).reduce(function (a, b) { return a + b.score; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuestionHTML.prototype, "outOf", {
        get: function () {
            return this.solutions.filter(function (s) { return s.affectsScore; }).reduce(function (a, b) { return a + b.outOf; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    return QuestionHTML;
}(RowHTML));
//takes square grid of rows (equations) with variables as true (columns)
function showVariables(arr, numDollars) {
    //automatically show variables (columns) that only appear once (in diagonal)
    var colsToShow = arr[0].map(function (a) { return false; }); //set all cols to false
    for (var rowCol = 0; rowCol < arr[0].length; rowCol++) {
        colsToShow[rowCol] = (arr[rowCol].filter(function (p) { return p; }).length == 1)
            && (arr.filter(function (p) { return p[rowCol]; }).length == 1);
    }
    //remove equations (rows) with a single true
    arr = arr.filter(function (r) { return r.filter(function (p) { return p; }).length > 1; });
    //target number hidden variables = num of equations at this point
    var maxColsToShow = colsToShow.length - arr.length;
    var backupArr = arr.map(function (row) { return row.slice(); });
    var backupColsToShow = colsToShow.slice();
    while (arr.length > 0 || maxColsToShow < colsToShow.filter(function (p) { return p; }).length) {
        //if too may variables shown, reset and try again
        if (maxColsToShow < colsToShow.filter(function (p) { return p; }).length) {
            arr = backupArr.map(function (row) { return row.slice(); });
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
        var colToRemove = colsWithATrue[Math.floor(Math.random() * colsWithATrue.length)];
        colsToShow[colToRemove] = true;
        //set col to false 
        arr.forEach(function (f) { return f[colToRemove] = false; });
        //if any rows have 1 true, remove that col too since these equations can be solved 
        var rowsWithOneTrue = arr.filter(function (r) { return r.filter(function (p) { return p; }).length == 1; });
        while (rowsWithOneTrue.length > 0) {
            for (var r = 0; r < rowsWithOneTrue.length; r++) {
                var row2 = rowsWithOneTrue[r];
                var singleCol = row2.indexOf(true);
                //set col to false 
                arr.forEach(function (f) { return f[singleCol] = false; });
                //remove rows with only one true
                arr = arr.filter(function (r) { return r.filter(function (p) { return p; }).length > 0; });
            }
            rowsWithOneTrue = arr.filter(function (r) { return r.filter(function (p) { return p; }).length == 1; });
        }
    }
    return colsToShow;
}
var TemplateHTML = /** @class */ (function (_super) {
    __extends(TemplateHTML, _super);
    function TemplateHTML(row, showTitle, paramSettings) {
        var _this = _super.call(this, row, showTitle, paramSettings) || this;
        //refresh button
        if (_this.settings.allowRefresh) {
            var refreshButton = document.createElement("img");
            refreshButton.src = imageData.refresh;
            refreshButton.className = "refreshButton hideOnPrint";
            refreshButton.onclick = (function (ref) { var r = ref; return function () { r.refresh(); }; })(_this);
            _this.marginDiv.appendChild(refreshButton);
        }
        _this.randomForTemplate = paramSettings.random;
        return _this;
    }
    TemplateHTML.prototype.replacedTemplates = function () {
        var comments = this.row.comment.split('\n');
        //GENERATE TEMPLATES THEN OVERWRITE COMMENTS WITH RECALCULATED VALUES
        var templates = [];
        var paramIndexForRangeEvaluation = this.randomForTemplate.next();
        var customFunctions = {};
        for (var i = 0; i < comments.length; i++) {
            templates.push(new Template(comments[i], templates, this.randomForTemplate, paramIndexForRangeEvaluation, customFunctions));
        }
        if (this.row.purpose == "sudoku") {
            //force calculate
            templates.forEach(function (t) { if (t)
                t.forceCalculate(); });
            //number of dollars
            var numDollars = ((this.row.leftRight.join(" ")).match(/\$\$/g) || []).length;
            //sudoku only
            var variablesUsed = templates.map(function (t) {
                if (t)
                    return t.variablesUsed;
                var ret = [];
                for (var i = 0; i < 26; i++)
                    ret.push(false);
                return ret;
            });
            //add variables to their own equations
            for (var i = 0, eqn; eqn = variablesUsed[i]; i++) {
                eqn[i] = true;
            }
            //DO NOT remove all equations (rows) but trim cols (variables) to num templates
            variablesUsed = variablesUsed.map(function (arr) { return arr.slice(0, templates.length); });
            var variablesToShow = showVariables(variablesUsed, numDollars);
            var replaceSudokuDollarInjector = function (variablesToShow) {
                var variablesToShow = variablesToShow;
                var index = 0;
                return function (letter) {
                    index++;
                    return !(variablesToShow[index - 1]);
                };
            };
            this.replaceSudokuDollar = replaceSudokuDollarInjector(variablesToShow);
        }
        //each comment is an equation
        return templates;
    };
    TemplateHTML.prototype.refresh = function () {
        this._cellCups = null;
        this.dynamicDiv.innerHTML = this.cellCups.map(function (c) { return c.HTML; }).join("");
        this.refreshsolutionDiv();
    };
    return TemplateHTML;
}(QuestionHTML));
//# sourceMappingURL=rowHTML.js.map