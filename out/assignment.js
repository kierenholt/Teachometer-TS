var AssignmentHTML = (function () {
    function AssignmentHTML(internalSettings, markbookSettings) {
        this.rowHTMLs = [];
        this.settings = internalSettings;
        this.settings.random = new Random();
        if (markbookSettings) {
            this.settings.shuffleQuestions = (markbookSettings["shuffle questions"] == true);
            this.settings.truncateMarks = Number(markbookSettings["mark limit"]);
            this.settings.journalMode = (markbookSettings["journal mode"] == true);
            this.settings.appendToMarkbook = (markbookSettings["append mode"] == true);
            this.settings.removeHyperlinks = (markbookSettings["remove hyperlinks"] == true);
            this.settings.markbookUpdate = markbookSettings.markbookUpdate;
            this.settings.markbookIndex = 0;
            this.settings.user = markbookSettings.user;
            this.settings.workbookId = markbookSettings.workbookId;
            this.settings.sheetName = markbookSettings.sheetName;
            this.settings.scoreHeaders = markbookSettings["scoreHeaders"];
            this.settings.scores = markbookSettings["scores"];
            if (this.settings.scoreHeaders) {
                var index1 = this.settings.scoreHeaders.indexOf("num checks remaining");
                if (index1 > -1) {
                    this.settings.numChecksLeft = Number(this.settings.scores[index1]);
                }
                this.settings.scoreGetters = function (paramAsn, scoreHeaders) {
                    var asn = paramAsn;
                    var ret = [];
                    for (var _i = 0, scoreHeaders_1 = scoreHeaders; _i < scoreHeaders_1.length; _i++) {
                        var header = scoreHeaders_1[_i];
                        switch (header) {
                            case "% attempted":
                                ret.push(function () { return asn.percentAttempted; });
                                break;
                            case "% correct":
                                ret.push(function () { return asn.percentCorrect; });
                                break;
                            case "% stars":
                                ret.push(function () { return asn.percentStars; });
                                break;
                            case "clicks away":
                                ret.push(function () { return asn.settings.clicksAway; });
                                break;
                            case "num checks remaining":
                                ret.push(function () { return asn.settings.numChecksLeft; });
                                break;
                            case "time remaining (min)":
                                ret.push(function () { return asn.settings.timeRemaining; });
                                break;
                            default:
                                throw new Error("score header not recognised");
                        }
                    }
                    return ret;
                }(this, this.settings.scoreHeaders);
                var index3 = this.settings.scoreHeaders.indexOf("time remaining");
                if (index3 > -1) {
                    this.settings.timeRemaining = Number(this.settings.scores[index3]);
                    if (this.settings.timeRemaining != 0) {
                        var timerDiv = document.createElement("div");
                        timerDiv.className += " timer";
                        this.settings.questionsDiv.parentElement.appendChild(timerDiv);
                        this.timerInterval = setInterval(function (timeLimit, paramDiv, paramAsn) {
                            var asn = paramAsn;
                            var countUp = timeLimit == 0;
                            var target = new Date().getTime() + 1000 * 60 * timeLimit;
                            var div = paramDiv;
                            return function () {
                                var distance = (target - new Date().getTime()) * (countUp ? -1 : 1);
                                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                                div.innerHTML = hours + "h " + minutes + "m " + seconds + "s ";
                                asn.settings.timeRemaining = minutes;
                                if (distance < 60 * 1000 && !countUp) {
                                    div.className += " red";
                                }
                                if (distance < 0) {
                                    asn.settings.timeRemaining = 0;
                                    clearInterval(asn.timerInterval);
                                    div.innerHTML = "EXPIRED";
                                    asn.settings.numChecksLeft = 1;
                                    asn.showAllDecisionImages(false);
                                }
                            };
                        }(this.settings.timeRemaining, timerDiv, this), 900);
                    }
                }
            }
            if (markbookSettings.responses) {
                this.settings.responses = markbookSettings.responses;
            }
            else {
                this.settings.responses = {};
            }
        }
    }
    AssignmentHTML.prototype.addRows = function (paramRows, index) {
        for (var r = 0, row = void 0; row = paramRows[r]; r++) {
            var showTitle = true;
            if (this.rowHTMLs.length > 0) {
                var previousTitle = this.rowHTMLs[this.rowHTMLs.length - 1].row.title;
                if (previousTitle == row.title) {
                    showTitle = false;
                }
            }
            var newRowHTML = null;
            if (row.purpose == "question") {
                newRowHTML = new QuestionHTML(row, showTitle, this.settings);
            }
            else if (row.purpose == "template" || row.purpose == "sudoku") {
                newRowHTML = new TemplateHTML(row, showTitle, this.settings);
            }
            else {
                newRowHTML = new RowHTML(row, showTitle, this.settings);
            }
            newRowHTML.deleteSelf = function (paramAsn, paramRow) {
                var asn = paramAsn;
                var row = paramRow;
                return function () { asn.deleteRows([row]); };
            }(this, newRowHTML);
            newRowHTML.duplicateSelf = function (paramAsn, paramRow) {
                var asn = paramAsn;
                var row = paramRow;
                return function () { asn.duplicateRow(row); };
            }(this, newRowHTML);
            if (index != undefined && index < this.rowHTMLs.length) {
                this.rowHTMLs.splice(index + 1, 0, newRowHTML);
            }
            else {
                this.rowHTMLs.push(newRowHTML);
            }
            this.insertRowIntoDivs(newRowHTML, index);
            if (index != undefined) {
                index++;
            }
        }
        this.updateQuestionNumbersAndMarkbookIndex();
    };
    AssignmentHTML.prototype.scroll = function () {
        this.settings.questionsDiv.lastChild.scrollIntoView();
    };
    AssignmentHTML.prototype.insertRowIntoDivs = function (newRowHTML, index) {
        var _this = this;
        if (index == undefined) {
            index = this.rowHTMLs.length;
        }
        if (this.settings.questionsDiv.children[index + 1]) {
            this.settings.questionsDiv.insertBefore(newRowHTML.outerDiv, this.settings.questionsDiv.children[index + 1]);
        }
        else {
            this.settings.questionsDiv.appendChild(newRowHTML.outerDiv);
        }
        if (this.settings.solutionsDiv && newRowHTML.solutionDiv) {
            if (this.settings.solutionsDiv.children[index + 1]) {
                this.settings.solutionsDiv.insertBefore(newRowHTML.solutionDiv, this.settings.solutionsDiv.children[index + 1]);
            }
            else {
                this.settings.solutionsDiv.appendChild(newRowHTML.solutionDiv);
            }
        }
        if (this.settings.jumbledSolutionsDiv && newRowHTML.jumbleDivs) {
            newRowHTML.jumbleDivs.forEach(function (s) { return _this.settings.jumbledSolutionsDiv.appendChild(s); });
        }
    };
    AssignmentHTML.prototype.refresh = function () {
        this.templateHTMLs.forEach(function (r) { return r.refresh(); });
    };
    AssignmentHTML.prototype.deleteRows = function (TRHTMLs) {
        TRHTMLs.forEach(function (r) { return r.delete(); });
        this.rowHTMLs = this.rowHTMLs.filter(function (r) { return !TRHTMLs.includes(r); });
        this.updateQuestionNumbersAndMarkbookIndex();
    };
    AssignmentHTML.prototype.duplicateRow = function (TRHTML) {
        var index = this.rowHTMLs.indexOf(TRHTML);
        this.addRows([TRHTML.row], index);
        this.updateQuestionNumbersAndMarkbookIndex();
    };
    AssignmentHTML.prototype.deleteAll = function () {
        this.rowHTMLs.forEach(function (r) { return r.delete(false); });
        this.rowHTMLs = [];
    };
    AssignmentHTML.prototype.updateQuestionNumbersAndMarkbookIndex = function () {
        var _this = this;
        this._questionNumbers = [];
        var qn = 1;
        for (var _i = 0, _a = this.questionHTMLs; _i < _a.length; _i++) {
            var rowHTML = _a[_i];
            this._questionNumbers = this._questionNumbers.concat(rowHTML.setQuestionNumber(qn++));
        }
        if (this.settings.jumbledSolutionsDiv) {
            var divs = [];
            for (var i = 0; i < this.settings.jumbledSolutionsDiv.children.length; i++) {
                divs.push(this.settings.jumbledSolutionsDiv.children[i]);
            }
            while (this.settings.jumbledSolutionsDiv.firstChild) {
                this.settings.jumbledSolutionsDiv.removeChild(this.settings.jumbledSolutionsDiv.firstChild);
            }
            helpers.shuffle(divs, this.settings.random);
            divs.forEach(function (d) { return _this.settings.jumbledSolutionsDiv.appendChild(d); });
        }
    };
    Object.defineProperty(AssignmentHTML.prototype, "questionNumbers", {
        get: function () {
            return this._questionNumbers;
        },
        enumerable: true,
        configurable: true
    });
    AssignmentHTML.prototype.showAllDecisionImages = function (showwarning) {
        if (this.settings.numChecksLeft == 1 && showwarning) {
            if (!confirm("This will show your marks, but also prevent you making any further changes. Are you sure?")) {
                return;
            }
        }
        this.questionHTMLs.forEach(function (s) { return s.showDecisionImage(); });
        if (this.settings.numChecksLeft != undefined) {
            this.settings.numChecksLeft--;
            this.settings.numChecksLeft == 1 ? " (" + this.settings.numChecksLeft + " check remaining)" :
                " (" + this.settings.numChecksLeft + " checks remaining)";
            var checksLeftText = this.settings.numChecksLeft < 1 ? "" :
                this.settings.numChecksLeft == 1 ? " (" + this.settings.numChecksLeft + " check remaining)" :
                    " (" + this.settings.numChecksLeft + " checks remaining)";
            if (this.submitButton) {
                this.submitButton.innerText = this.settings.submitButtonText + checksLeftText;
            }
        }
        var scores = this.settings.scoreGetters ? this.settings.scoreGetters.map(function (f) { return f(); }) : null;
        if (this.settings.markbookUpdate) {
            this.settings.markbookUpdate(null, null, "white", false, scores);
        }
        if (this.settings.numChecksLeft == 0) {
            if (this.settings.markbookUpdate) {
                this.settings.markbookUpdate = undefined;
            }
            var scoreParagraph = document.createElement("p");
            scoreParagraph.id = "scoreParagraph";
            scoreParagraph.innerHTML = "<h1>FINAL SCORE: " + this.rawCorrect + " out of " + this.outOf + " (" + this.percentCorrect + "%)</h1>";
            this.submitButton.parentElement.appendChild(scoreParagraph, this.submitButton);
            this.submitButton.remove();
            this.disabled = true;
        }
    };
    Object.defineProperty(AssignmentHTML.prototype, "revealSections", {
        get: function () {
            return this.rowHTMLs.map(function (r) { return r.revealSection; }).join("\n");
        },
        enumerable: true,
        configurable: true
    });
    AssignmentHTML.prototype.previewInNewWindow = function (settings) {
        var styleText = "";
        var css = document.styleSheets[0];
        if (css)
            for (var _i = 0, _a = css.cssRules; _i < _a.length; _i++) {
                var rule = _a[_i];
                styleText += rule.cssText;
            }
        this.previewWindow = window.open("", "preview", "");
        if (this.previewWindow["assignment"]) {
            this.previewWindow["assignment"].deleteAll();
        }
        else {
            this.previewWindow["helpers"] = window.helpersMaker();
            this.previewWindow.document.write("\n<head>\n<style>\n" + styleText + "\n</style>\n</head>\n<body>\n<div id=\"questionsDiv\"></div>\n</body>\n");
            this.previewWindow.stop();
            var newSettings = {};
            for (var index in this.settings) {
                newSettings[index] = this.settings[index];
            }
            newSettings["questionsDiv"] = this.previewWindow.document.getElementById("questionsDiv");
            this.previewWindow["assignment"] = new AssignmentHTML(newSettings, null);
        }
        this.previewWindow["assignment"].consumeRowsString(JSON.stringify(this.rows));
    };
    Object.defineProperty(AssignmentHTML.prototype, "rows", {
        get: function () {
            return this.rowHTMLs.map(function (r) { return r.row; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "questionHTMLs", {
        get: function () {
            return this.rowHTMLs.filter(function (r) { return r instanceof QuestionHTML; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "templateHTMLs", {
        get: function () {
            return this.rowHTMLs.filter(function (r) { return r instanceof TemplateHTML; });
        },
        enumerable: true,
        configurable: true
    });
    AssignmentHTML.prototype.consumeRowsString = function (blobString) {
        var seed = undefined;
        if (!this.settings.journalMode) {
            seed = helpers.CombineHashCodes([this.settings.user]);
        }
        this.settings.random = new Random(seed);
        var rows = JSON.parse(blobString);
        if (rows != undefined && rows.length > 0) {
            this.addRows(rows);
        }
        if (this.settings.shuffleQuestions) {
            this.shuffle();
        }
        if (this.settings.truncateMarks > 0) {
            this.truncate(this.settings.truncateMarks);
        }
        if (this.settings.numChecksLeft <= 0) {
            this.questionHTMLs.forEach(function (s) { return s.showDecisionImage(); });
        }
        if (!this.submitButton) {
            if (this.settings.numChecksLeft == undefined || this.settings.numChecksLeft != 0) {
                this.submitButton = document.createElement("button");
                this.submitButton.id = "submitButton";
                this.submitButton.onclick =
                    function (paramAssignment) {
                        var asn = paramAssignment;
                        return function () { asn.showAllDecisionImages(true); };
                    }(this);
                var checksLeftText = "";
                if (this.settings.numChecksLeft != undefined) {
                    checksLeftText = this.settings.numChecksLeft < 1 ? "" :
                        this.settings.numChecksLeft == 1 ? " (" + this.settings.numChecksLeft + " check remaining)" :
                            " (" + this.settings.numChecksLeft + " checks remaining)";
                }
                this.submitButton.innerText = this.settings.submitButtonText + checksLeftText;
                this.settings.questionsDiv.parentElement.appendChild(this.submitButton);
            }
            else {
                if (this.settings.markbookUpdate) {
                    this.settings.markbookUpdate = undefined;
                }
                var scoreParagraph = document.createElement("p");
                scoreParagraph.id = "scoreParagraph";
                scoreParagraph.innerHTML = "<h1>FINAL SCORE: " + this.rawCorrect + " out of " + this.outOf + " (" + this.percentCorrect + "%)</h1>";
                this.settings.questionsDiv.appendChild(scoreParagraph);
                this.disabled = true;
            }
        }
    };
    Object.defineProperty(AssignmentHTML.prototype, "percentStars", {
        get: function () {
            if (this.outOf == 0) {
                return 0;
            }
            return Math.round(this.rawStars * 100 / (this.settings.outOfOnlyQuestionsAttempted ? this.rawAttempted : this.outOf));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "percentAttempted", {
        get: function () {
            if (this.outOf == 0) {
                return 0;
            }
            return Math.round(this.rawAttempted * 100 / (this.settings.outOfOnlyQuestionsAttempted ? this.rawAttempted : this.outOf));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "percentCorrect", {
        get: function () {
            if (this.outOf == 0) {
                return 0;
            }
            return Math.round(this.rawCorrect * 100 / (this.settings.outOfOnlyQuestionsAttempted ? this.rawAttempted : this.outOf));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "rawCorrect", {
        get: function () {
            return this.questionHTMLs.reduce(function (a, b) { return a + b.correct; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "rawAttempted", {
        get: function () {
            return this.questionHTMLs.reduce(function (a, b) { return a + b.attempted; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "rawStars", {
        get: function () {
            return this.questionHTMLs.reduce(function (a, b) { return a + b.stars; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AssignmentHTML.prototype, "outOf", {
        get: function () {
            return this.questionHTMLs.reduce(function (a, b) { return a + b.outOf; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    AssignmentHTML.prototype.shuffle = function () {
        var _this = this;
        while (this.settings.questionsDiv.firstChild) {
            this.settings.questionsDiv.removeChild(this.settings.questionsDiv.firstChild);
        }
        while (this.settings.solutionsDiv && this.settings.solutionsDiv.firstChild) {
            this.settings.solutionsDiv.removeChild(this.settings.solutionsDiv.firstChild);
        }
        this.rowHTMLs = helpers.shuffle(this.rowHTMLs, this.settings.random);
        this.rowHTMLs.forEach(function (r) { return _this.insertRowIntoDivs(r); });
    };
    AssignmentHTML.prototype.truncate = function (n) {
        if (n == undefined) {
            n = prompt("enter number of marks you want left over", "10");
        }
        var i = 0;
        while (n >= this.questionHTMLs[i].solutions.length && this.questionHTMLs[i]) {
            n -= this.questionHTMLs[i].solutions.length;
            i++;
        }
        var lastQn = this.questionHTMLs[i];
        if (n > 0) {
            for (var j = 0; j < (lastQn.solutions.length - n); j++) {
                lastQn.solutions[lastQn.solutions.length - 1 - j].disabled = true;
            }
        }
        if (n > 0) {
            i++;
        }
        this.deleteRows(this.questionHTMLs.slice(i));
    };
    Object.defineProperty(AssignmentHTML.prototype, "disabled", {
        set: function (value) {
            this.questionHTMLs.forEach(function (q) { return q.disabled = value; });
            if (this.submitButton) {
                this.submitButton.disabled = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    return AssignmentHTML;
}());
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
var CodeError = (function (_super) {
    __extends(CodeError, _super);
    function CodeError(message) {
        return _super.call(this, message) || this;
    }
    return CodeError;
}(Error));
var JSFunction = (function () {
    function JSFunction(code, JSName) {
        try {
            this.interpreter = new Interpreter(code);
        }
        catch (error) {
            this.error = error;
        }
        this.code = code;
        this.JSName = JSName;
        this.cache = {};
    }
    JSFunction.prototype.execute = function (parameters) {
        if (this.error) {
            throw new CodeError(this.error);
        }
        var joinedParameters = parameters.map(function (a) { return JSON.stringify(a); }).join();
        if (joinedParameters in this.cache) {
            return this.cache[joinedParameters];
        }
        if (this.JSName != "console") {
            this.interpreter.appendCode("\n              " + this.JSName + "(" + joinedParameters + ");");
        }
        try {
            var i = 100000;
            while (i-- && this.interpreter.step()) {
            }
        }
        catch (e) {
            throw (e);
            this.interpreter = new Interpreter(this.code);
        }
        if (i == -1) {
            throw new CodeError("your code contains an infinite loop");
        }
        var evaluated = undefined;
        if (this.interpreter.value && this.interpreter.value.K == "Array") {
            var t = 0;
            var arr = [];
            while (t in this.interpreter.value.a) {
                arr[t] = this.interpreter.value.a[t];
                t++;
            }
            evaluated = JSON.stringify(arr);
        }
        else {
            evaluated = JSON.stringify(this.interpreter.value);
        }
        this.cache[joinedParameters] = evaluated;
        return evaluated;
    };
    return JSFunction;
}());
var Cup = (function () {
    function Cup(str) {
        this.attributes = [];
        this.tagName = "";
        this.str = str;
    }
    Cup.prototype.onThisAndChildren = function (action) { action(this); };
    Object.defineProperty(Cup.prototype, "innerHTML", {
        get: function () { return ""; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cup.prototype, "HTML", {
        get: function () { return "<" + this.tagName + " " + this.attributes.join("  ") + ">" + this.innerHTML + "</" + this.tagName + ">"; },
        enumerable: true,
        configurable: true
    });
    return Cup;
}());
var BulletCup = (function (_super) {
    __extends(BulletCup, _super);
    function BulletCup(str) {
        return _super.call(this, str) || this;
    }
    Object.defineProperty(BulletCup.prototype, "HTML", {
        get: function () { return "<li>"; },
        enumerable: true,
        configurable: true
    });
    return BulletCup;
}(Cup));
var ImageCup = (function (_super) {
    __extends(ImageCup, _super);
    function ImageCup(str) {
        var _a;
        var _this = _super.call(this, str) || this;
        _a = str.split(/!\[([^\]]*)]\(([^\)]*)\)/g), _this.comment = _a[1], _this.source = _a[2];
        var commaIndex = _this.comment.indexOf(",");
        if (commaIndex != -1)
            _this.width = Number(_this.comment.substr(commaIndex + 1));
        if (_this.width == null || isNaN(_this.width))
            _this.width = 100;
        _this.tagName = "img";
        _this.attributes.push("style=\"position: relative; left:" + (50 - _this.width / 2) + "%; width:" + _this.width + "%\"");
        _this.attributes.push("src=\"" + _this.source + "\"");
        _this.attributes.push("alt=\"" + _this.comment + "\"");
        return _this;
    }
    ImageCup.prototype.textReplace = function (patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            return getTemplateValue();
        }
        this.source = this.source.replace(patternMakeItGlobal, replacer);
        this.comment = this.comment.replace(patternMakeItGlobal, replacer);
    };
    return ImageCup;
}(Cup));
var AnchorCup = (function (_super) {
    __extends(AnchorCup, _super);
    function AnchorCup(str) {
        var _a;
        var _this = _super.call(this, str) || this;
        _a = str.split(/\[([^\]]*)]\(([^\)]*)\)/), _this.text = _a[1], _this.url = _a[2];
        if (!(_this.url.startsWith("http://") || _this.url.startsWith("https://")))
            _this.url = "https://" + _this.url;
        _this.tagName = "a";
        _this.attributes.push("href=\"" + _this.url + "\"");
        _this.attributes.push("target=\"_blank\"");
        return _this;
    }
    Object.defineProperty(AnchorCup.prototype, "innerHTML", {
        get: function () {
            return this.text;
        },
        enumerable: true,
        configurable: true
    });
    AnchorCup.prototype.textReplace = function (patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            return getTemplateValue();
        }
        this.text = this.text.replace(patternMakeItGlobal, replacer);
        this.url = this.url.replace(patternMakeItGlobal, replacer);
    };
    return AnchorCup;
}(Cup));
var FractionCup = (function (_super) {
    __extends(FractionCup, _super);
    function FractionCup(str) {
        var _a;
        var _this = _super.call(this, str) || this;
        var top = "";
        var bottom = "";
        _a = _this.str.split(/~\[([^\]]*)\]\(((?:\\\)|[^)])*)\)/), top = _a[1], bottom = _a[2];
        _this.top = new InnerFractionCup(top.replace("\\", ""));
        _this.bottom = new InnerFractionCup(bottom.replace("\\", ""));
        return _this;
    }
    FractionCup.prototype.onThisAndChildren = function (action) {
        action(this);
        this.top.onThisAndChildren(action);
        this.bottom.onThisAndChildren(action);
    };
    FractionCup.prototype.replace = function (pattern, nodeConstructor, confirmReplace) {
        this.top.replace(pattern, nodeConstructor, confirmReplace);
        this.bottom.replace(pattern, nodeConstructor, confirmReplace);
    };
    Object.defineProperty(FractionCup.prototype, "HTML", {
        get: function () {
            return "<table class=\"fraction\">\n<tr><td>" + this.top.HTML + "</td></tr>\n<tr><td>" + this.bottom.HTML + "</td></tr>\n</table>";
        },
        enumerable: true,
        configurable: true
    });
    return FractionCup;
}(Cup));
var ChunkCup = (function (_super) {
    __extends(ChunkCup, _super);
    function ChunkCup(str) {
        var _this = _super.call(this, str) || this;
        _this.tagName = "span";
        return _this;
    }
    Object.defineProperty(ChunkCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new ChunkCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ChunkCup.prototype.replace = function (pattern, nodeConstructor, confirmReplace) {
        var retVal = [];
        for (var _i = 0, _a = this.str.split(pattern); _i < _a.length; _i++) {
            var n = _a[_i];
            if (n != null && n.length > 0) {
                if (pattern.test(n) && (confirmReplace == null || confirmReplace(n))) {
                    retVal.push(nodeConstructor(n));
                }
                else {
                    retVal.push(this.thisConstructor(n));
                }
            }
        }
        return retVal;
    };
    ChunkCup.prototype.textReplace = function (patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            return getTemplateValue();
        }
        this.str = this.str.replace(patternMakeItGlobal, replacer);
    };
    Object.defineProperty(ChunkCup.prototype, "innerHTML", {
        get: function () {
            return this.str;
        },
        enumerable: true,
        configurable: true
    });
    return ChunkCup;
}(Cup));
var UnderlineCup = (function (_super) {
    __extends(UnderlineCup, _super);
    function UnderlineCup(str) {
        var _this = _super.call(this, str.substring(1, str.length - 1)) || this;
        _this.tagName = "u";
        return _this;
    }
    Object.defineProperty(UnderlineCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new UnderlineCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    return UnderlineCup;
}(ChunkCup));
var BoldCup = (function (_super) {
    __extends(BoldCup, _super);
    function BoldCup(str) {
        var _this = _super.call(this, str.replace("*", "")) || this;
        _this.tagName = "b";
        return _this;
    }
    Object.defineProperty(BoldCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new BoldCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    return BoldCup;
}(ChunkCup));
var SuperScriptCup = (function (_super) {
    __extends(SuperScriptCup, _super);
    function SuperScriptCup(str) {
        var _this = _super.call(this, str.replace("^", "")) || this;
        _this.tagName = "sup";
        return _this;
    }
    Object.defineProperty(SuperScriptCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new SuperScriptCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    return SuperScriptCup;
}(ChunkCup));
var SubScriptCup = (function (_super) {
    __extends(SubScriptCup, _super);
    function SubScriptCup(str) {
        var _this = _super.call(this, str.replace("~", "")) || this;
        _this.tagName = "sub";
        return _this;
    }
    Object.defineProperty(SubScriptCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new SubScriptCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    return SubScriptCup;
}(ChunkCup));
var TitleCup = (function (_super) {
    __extends(TitleCup, _super);
    function TitleCup(str) {
        var _this = _super.call(this, str.replace("#", "")) || this;
        _this.tagName = "h1";
        return _this;
    }
    Object.defineProperty(TitleCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new TitleCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    return TitleCup;
}(ChunkCup));
var CupContainer = (function (_super) {
    __extends(CupContainer, _super);
    function CupContainer(str) {
        var _this = _super.call(this, str) || this;
        _this.tagName = "div";
        return _this;
    }
    CupContainer.prototype.onThisAndChildren = function (action) {
        action(this);
        if (this.children != null) {
            this.children.forEach(function (s) { return s.onThisAndChildren(action); });
        }
    };
    CupContainer.prototype.replace = function (pattern, nodeConstructor, confirmReplace) {
        if (this.children != null) {
            var newChildren = [];
            for (var i = 0, child = void 0; child = this.children[i]; i++) {
                if (child.replace != null) {
                    if (child instanceof ChunkCup) {
                        newChildren.push.apply(newChildren, child.replace(pattern, nodeConstructor, confirmReplace));
                    }
                    else {
                        child.replace(pattern, nodeConstructor, confirmReplace);
                        newChildren.push(child);
                    }
                }
                else {
                    newChildren.push(child);
                }
            }
            this.children = newChildren;
        }
        return [this];
    };
    Object.defineProperty(CupContainer.prototype, "innerHTML", {
        get: function () {
            return this.children.map(function (c) { return c.HTML; }).join("");
        },
        enumerable: true,
        configurable: true
    });
    return CupContainer;
}(Cup));
var CodeCup = (function (_super) {
    __extends(CodeCup, _super);
    function CodeCup(str) {
        var _this = this;
        str = helpers.trimChar(str, "`");
        str = helpers.trimChar(str, "\n");
        _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        _this.attributes.push("class=\"codeblock\"");
        _this.tagName = "pre";
        _this.replace = null;
        return _this;
    }
    return CodeCup;
}(CupContainer));
var RelativePositionCup = (function (_super) {
    __extends(RelativePositionCup, _super);
    function RelativePositionCup(str, inPixels) {
        var _a;
        var _this = _super.call(this, str) || this;
        if (inPixels == undefined) {
            inPixels = false;
        }
        var xPosAsString = "";
        var yPosAsString = "";
        var childrenAsString = "";
        _a = _this.str.split(/@\[([\-0-9]+),([\-0-9]+)\]\(([^)]*)\)/), xPosAsString = _a[1], yPosAsString = _a[2], childrenAsString = _a[3];
        _this.xPos = Number(xPosAsString).toString() + (inPixels ? "px" : "%");
        _this.yPos = Number(yPosAsString).toString() + (inPixels ? "px" : "%");
        _this.children = [new ChunkCup(childrenAsString)];
        _this.attributes.push("style=\"position:absolute;left:" + _this.xPos + ";top:" + _this.yPos + "\"");
        return _this;
    }
    return RelativePositionCup;
}(CupContainer));
var InnerFractionCup = (function (_super) {
    __extends(InnerFractionCup, _super);
    function InnerFractionCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        return _this;
    }
    return InnerFractionCup;
}(CupContainer));
var ParagraphCup = (function (_super) {
    __extends(ParagraphCup, _super);
    function ParagraphCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        return _this;
    }
    Object.defineProperty(ParagraphCup.prototype, "HTML", {
        get: function () {
            return "<br>" + this.innerHTML;
        },
        enumerable: true,
        configurable: true
    });
    return ParagraphCup;
}(CupContainer));
var DivCup = (function (_super) {
    __extends(DivCup, _super);
    function DivCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(_this.str)];
        return _this;
    }
    Object.defineProperty(DivCup.prototype, "class", {
        set: function (value) {
            this.attributes.push("class=\"" + value + "\"");
        },
        enumerable: true,
        configurable: true
    });
    DivCup.prototype.toggleGridlines = function () {
        this.gridLinesDiv.style.display = (this.gridLinesDiv.style.display == "block") ? "none" : "block";
    };
    Object.defineProperty(DivCup.prototype, "gridLinesDiv", {
        get: function () {
            if (this._gridLinesDiv) {
                return this._gridLinesDiv;
            }
            var ret = document.createElement("div");
            ret.className = "gridlinecontainer";
            ret.innerHTML = "\n      <div class=\"hgridline\"><p>10%</p></div>\n      <div class=\"hgridline\"><p>20%</p></div>\n      <div class=\"hgridline\"><p>30%</p></div>\n      <div class=\"hgridline\"><p>40%</p></div>\n      <div class=\"hgridline\"><p>50%</p></div>\n      <div class=\"hgridline\"><p>60%</p></div>\n      <div class=\"hgridline\"><p>70%</p></div>\n      <div class=\"hgridline\"><p>80%</p></div>\n      <div class=\"hgridline\"><p>90%</p></div>\n      <div class=\"hgridline\"><p>100%</p></div>\n      \n      <div class=\"vgridline\"><p>10%</p></div>\n      <div class=\"vgridline\"><p>20%</p></div>\n      <div class=\"vgridline\"><p>30%</p></div>\n      <div class=\"vgridline\"><p>40%</p></div>\n      <div class=\"vgridline\"><p>50%</p></div>\n      <div class=\"vgridline\"><p>60%</p></div>\n      <div class=\"vgridline\"><p>70%</p></div>\n      <div class=\"vgridline\"><p>80%</p></div>\n      <div class=\"vgridline\"><p>90%</p></div>\n      <div class=\"vgridline\"><p>100%</p></div>\n  ";
            this._gridLinesDiv = ret;
            this.element.appendChild(ret);
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    return DivCup;
}(CupContainer));
var TableCup = (function (_super) {
    __extends(TableCup, _super);
    function TableCup(str) {
        var _this = _super.call(this, str) || this;
        _this.hasBorder = str.startsWith("|");
        _this.tagName = "table";
        _this.children = str.split("\n").filter(function (s) { return s.length > 0; }).map(function (s) { return new RowCup(s); });
        _this.attributes.push("class=\"markdowntable\"");
        _this.attributes.push("style=\"" + (_this.hasBorder ? "" : "border: none;") + "\"");
        return _this;
    }
    return TableCup;
}(CupContainer));
var RowCup = (function (_super) {
    __extends(RowCup, _super);
    function RowCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = str.split(/(\|[^\|]*)/).filter(function (s) { return s.length > 0; }).map(function (s) { return new CellCup(s); });
        _this.tagName = "tr";
        return _this;
    }
    return RowCup;
}(CupContainer));
var CellCup = (function (_super) {
    __extends(CellCup, _super);
    function CellCup(str) {
        var _this = _super.call(this, str) || this;
        _this.str = _this.str.substring(1);
        _this.children = [new ChunkCup(_this.str)];
        _this.tagName = "td";
        return _this;
    }
    return CellCup;
}(CupContainer));
var decisionImageEnum;
(function (decisionImageEnum) {
    decisionImageEnum[decisionImageEnum["None"] = 0] = "None";
    decisionImageEnum[decisionImageEnum["Star"] = 1] = "Star";
    decisionImageEnum[decisionImageEnum["Cross"] = 2] = "Cross";
    decisionImageEnum[decisionImageEnum["Tick"] = 3] = "Tick";
    decisionImageEnum[decisionImageEnum["Hourglass"] = 4] = "Hourglass";
    decisionImageEnum[decisionImageEnum["Error"] = 5] = "Error";
})(decisionImageEnum || (decisionImageEnum = {}));
var FieldCup = (function (_super) {
    __extends(FieldCup, _super);
    function FieldCup(str) {
        var _this = _super.call(this, str) || this;
        _this.instanceNum = FieldCup.instances.length;
        FieldCup.instances.push(_this);
        _this._element = { value: "", "disabled": false };
        _this.attributes.push("id=cup" + _this.instanceNum);
        _this._decisionImage = decisionImageEnum.None;
        return _this;
    }
    Object.defineProperty(FieldCup.prototype, "elementValue", {
        get: function () {
            this._element.value = helpers.replaceAll(this._element.value, "x10^", "e");
            return this._element.value;
        },
        set: function (value) {
            this._element.value = value;
        },
        enumerable: true,
        configurable: true
    });
    FieldCup.prototype.setElement = function (newElement) {
        newElement.value = this._element.value;
        newElement.disabled = this._element.disabled;
        this._element = newElement;
        this._decisionElement = newElement.nextSibling;
        this.decisionImage = this._decisionImage;
    };
    Object.defineProperty(FieldCup.prototype, "decisionImageHTML", {
        get: function () { return "<img style:\"z-index:100;display:none\" hidden />"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FieldCup.prototype, "disabled", {
        get: function () { return this._element.disabled; },
        set: function (value) {
            this._element.disabled = value;
            if (this._decisionElement != null)
                this._decisionElement.hidden = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FieldCup.prototype, "decisionImage", {
        set: function (value) {
            this._decisionImage = value;
            if (this._decisionElement) {
                if (this._decisionImage == decisionImageEnum.None) {
                    this._decisionElement.hidden = true;
                }
                else {
                    this._decisionElement.hidden = false;
                    this._decisionElement.src = this.decisionToDataURL(value);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    FieldCup.prototype.onResponse = function () { };
    FieldCup.prototype.decisionToDataURL = function (decision) {
        if (decision == decisionImageEnum.Cross) {
            return imageData.cross;
        }
        if (decision == decisionImageEnum.Error) {
            return imageData.error;
        }
        if (decision == decisionImageEnum.Hourglass) {
            return imageData.hourglass;
        }
        if (decision == decisionImageEnum.Star) {
            return imageData.star;
        }
        if (decision == decisionImageEnum.Tick) {
            return imageData.tick;
        }
        return "";
    };
    FieldCup.instances = [];
    return FieldCup;
}(Cup));
var RadioSet = (function () {
    function RadioSet() {
        this.radioCups = [];
        this.instanceNum = RadioSet.numInstances++;
        this._decisionImage = decisionImageEnum.None;
    }
    Object.defineProperty(RadioSet.prototype, "decisionImage", {
        set: function (value) {
            this.radioCups.forEach(function (r) { return r.decisionImage = decisionImageEnum.None; });
            var found = this.radioCups.filter(function (r) { return r.elementValue == true; });
            if (found.length) {
                found[0].decisionImage = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    RadioSet.prototype.add = function (radioCup) {
        this.radioCups.push(radioCup);
        radioCup.onResponse = this._cachedOnResponse;
        radioCup.attributes.push("name=radioSet" + this.instanceNum);
    };
    Object.defineProperty(RadioSet.prototype, "onResponse", {
        set: function (value) {
            this._cachedOnResponse = value;
            this.radioCups.forEach(function (r) { return r.onResponse = value; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RadioSet.prototype, "elementValue", {
        get: function () {
            var found = this.radioCups.filter(function (r) { return r.elementValue; });
            if (found.length) {
                return found[0].letter;
            }
            return "";
        },
        set: function (value) {
            this.radioCups.forEach(function (r) { return r.elementValue = (r.letter == value); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RadioSet.prototype, "disabled", {
        get: function () { return this.radioCups ? this.radioCups[0].disabled : false; },
        set: function (value) { this.radioCups.forEach(function (r) { return r.disabled = value; }); },
        enumerable: true,
        configurable: true
    });
    RadioSet.numInstances = 0;
    return RadioSet;
}());
var RadioCup = (function (_super) {
    __extends(RadioCup, _super);
    function RadioCup(str) {
        var _this = _super.call(this, str) || this;
        _this.letter = str[0];
        _this.radioCups = [_this];
        _this._element = { checked: false, "disabled": false };
        return _this;
    }
    Object.defineProperty(RadioCup.prototype, "HTML", {
        get: function () {
            return this.letter + (".<input type=\"radio\" " + this.attributes.join("  ") + " value=\"" + this.letter + "\" >" + this.decisionImageHTML);
        },
        enumerable: true,
        configurable: true
    });
    RadioCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        newElement.onclick = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    Object.defineProperty(RadioCup.prototype, "elementValue", {
        get: function () { return this._element.checked; },
        set: function (value) { this._element.checked = (value == true); },
        enumerable: true,
        configurable: true
    });
    return RadioCup;
}(FieldCup));
var TextAreaCup = (function (_super) {
    __extends(TextAreaCup, _super);
    function TextAreaCup(str) {
        return _super.call(this, str) || this;
    }
    Object.defineProperty(TextAreaCup.prototype, "HTML", {
        get: function () {
            return "<br><textarea " + this.attributes.join("  ") + " rows=\"10\"></textarea>";
        },
        enumerable: true,
        configurable: true
    });
    TextAreaCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        newElement.onblur = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    return TextAreaCup;
}(FieldCup));
var InputCup = (function (_super) {
    __extends(InputCup, _super);
    function InputCup(str) {
        return _super.call(this, str) || this;
    }
    Object.defineProperty(InputCup.prototype, "HTML", {
        get: function () {
            return "<input size=\"" + this.str.length + "\" type=\"text\" " + this.attributes.join("  ") + " >" + this.decisionImageHTML;
        },
        enumerable: true,
        configurable: true
    });
    InputCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        newElement.onblur = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    return InputCup;
}(FieldCup));
var ComboCup = (function (_super) {
    __extends(ComboCup, _super);
    function ComboCup(str) {
        var _this = _super.call(this, str) || this;
        _this.options = [" "].concat(_this.str.substring(1, _this.str.length - 1).split("/"));
        return _this;
    }
    Object.defineProperty(ComboCup.prototype, "HTML", {
        get: function () {
            var optionHTML = this.options.map(function (o) { return "<option value='" + o + "'>" + o + "</option>"; }).join("");
            return "<select " + this.attributes.join("  ") + " >" + optionHTML + " </select>" + this.decisionImageHTML;
        },
        enumerable: true,
        configurable: true
    });
    ComboCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        newElement.onchange = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    ComboCup.prototype.textReplace = function (pattern, getTemplateValue) {
        var replacer = function (match, offset, string) {
            return getTemplateValue();
        };
        this.str = this.str.replace(pattern, replacer);
        this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
    };
    return ComboCup;
}(FieldCup));
var CheckBoxCup = (function (_super) {
    __extends(CheckBoxCup, _super);
    function CheckBoxCup(str) {
        var _this = _super.call(this, str) || this;
        _this._decisionImage = decisionImageEnum.Hourglass;
        return _this;
    }
    Object.defineProperty(CheckBoxCup.prototype, "HTML", {
        get: function () {
            return "<span " + this.attributes.join("  ") + " ></span>" + this.decisionImageHTML;
        },
        enumerable: true,
        configurable: true
    });
    CheckBoxCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        this._element = { value: "", disabled: false };
    };
    Object.defineProperty(CheckBoxCup.prototype, "hoverText", {
        set: function (value) {
            this._element.title = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CheckBoxCup.prototype, "elementValue", {
        get: function () {
            return this._element.value;
        },
        set: function (value) {
            if ((value == "✓") || (value == true)) {
                this._element.value = "tick";
            }
            if ((value == "✗") || (value == false)) {
                this._element.value = "cross";
            }
            if (value == "!") {
                this._element.value = "error";
            }
        },
        enumerable: true,
        configurable: true
    });
    return CheckBoxCup;
}(FieldCup));
var PoundCup = (function (_super) {
    __extends(PoundCup, _super);
    function PoundCup(str) {
        var _this = _super.call(this, str) || this;
        _this._element = { checked: false, "disabled": false, "style": { "color": "" } };
        return _this;
    }
    Object.defineProperty(PoundCup.prototype, "HTML", {
        get: function () {
            return "<span " + this.attributes.join("  ") + " ></span>";
        },
        enumerable: true,
        configurable: true
    });
    PoundCup.prototype.setElement = function (newElement) {
        newElement.style.color = this._element.style.color;
        _super.prototype.setElement.call(this, newElement);
    };
    Object.defineProperty(PoundCup.prototype, "elementValue", {
        get: function () {
            return this._element.innerText;
        },
        set: function (value) {
            this._element.innerText = value;
        },
        enumerable: true,
        configurable: true
    });
    PoundCup.prototype.showDecisionImage = function (image) {
    };
    Object.defineProperty(PoundCup.prototype, "isRed", {
        set: function (value) {
            this._element.style.color = value ? "red" : "";
        },
        enumerable: true,
        configurable: true
    });
    return PoundCup;
}(FieldCup));
function alphaIndex(str) {
    if (isLowerAlpha(str)) {
        return str.charCodeAt(0) - 97;
    }
    if (isUpperAlpha(str)) {
        return str.charCodeAt(0) - 65;
    }
    throw new Error("function alphaindex called on non alphanumeric string");
}
;
function isAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
;
function isLowerAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 97 && code <= 122);
}
;
function isUpperAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 65 && code <= 90);
}
;
function getDigits(n) {
    if (n < 10) {
        return [n];
    }
    return getDigits(Math.floor(n / 10)).concat([n % 10]);
}
function HCF(a, b) {
    if (a <= 0 || b <= 0) {
        return 0;
    }
    if (a < b) {
        return HCF(b, a);
    }
    if (a % b == 0) {
        return b;
    }
    return HCF(b, a % b);
}
function hcfMulti(args) {
    var ret = args.splice(-1);
    while (args.length > 0) {
        var arg = args.splice(-1);
        ret = HCF(ret, arg);
    }
    return ret;
}
function lcm(args) {
    var ret = args.splice(-1);
    while (args.length > 0) {
        var arg = args.splice(-1);
        ret = ret * arg / HCF(ret, arg);
    }
    return ret;
}
function factorial(n) {
    if (n < 2) {
        return 1;
    }
    return n * factorial(n - 1);
}
;
function binomial(x, N, p) {
    return factorial(N) / factorial(N - x) / factorial(x) * Math.pow(p, x) * Math.pow(1 - p, N - x);
}
function roundToSF(n, d) {
    if (n == 0) {
        return n;
    }
    ;
    var biggestTen = Math.floor(Math.log(Math.abs(n)) / Math.LN10) + 1;
    return Math.round(n * Math.pow(10, d - biggestTen)) / Math.pow(10, d - biggestTen);
}
function calculatedJSONtoViewable(ret) {
    ret = JSON.parse(ret);
    if (typeof (ret) == "string") {
        return helpers.stripQuotes(ret);
    }
    if (typeof (ret) == "number") {
        if (ret % 1 == 0) {
            return ret.toString();
        }
        else {
            ret = parseFloat(ret.toPrecision(12));
            return ret.toString();
        }
    }
    if (ret) {
        return ret.toString();
    }
}
function safeStringify(str) {
    var ret = undefined;
    try {
        var obj = JSON.parse(str);
        ret = JSON.stringify(obj);
    }
    catch (e) {
        ret = "\"" + str + "\"";
    }
    return ret;
}
function JSONtoEval(str) {
    var obj = JSON.parse(str);
    if (typeof (obj) == "string") {
        return str;
    }
    if (obj === true) {
        return "true";
    }
    ;
    if (obj === false) {
        return "false";
    }
    ;
    return str;
}
function replaceVariables(s, injector) {
    var buffer = "";
    for (var i = 0; i < s.length; i++) {
        if (isLowerAlpha(s[i]) &&
            (s.length == 1 || s[i].toLowerCase() != "e" || i == 0 || !helpers.isNumeric(s[i - 1]))) {
            var index = alphaIndex(s[i]);
            if (index < injector.allTemplateComments.length) {
                injector.variablesUsed[index] = true;
                var val = injector.allTemplateComments[index].calculatedValue;
                buffer += JSONtoEval(val);
            }
            else {
                throw new TemplateError("variable \"" + s[i] + "\" does not exist", true, true);
            }
        }
        else if (s[i] in injector.customFunctions) {
            if (injector.customFunctions[s[i]]) {
                buffer += JSONtoEval(injector.customFunctions[s[i]]);
            }
            else {
                throw new TemplateError("variable has not yet been defined", false, false);
            }
        }
        else if (s[i] == 'π') {
            buffer += "3.14159265359";
        }
        else {
            buffer += s[i];
        }
    }
    return buffer;
}
function toExpressionTree(s, i, commaIsTerminator) {
    var children = [];
    var buffer = "";
    while (i < s.length && s[i] != ")"
        && s[i] != "]"
        && (commaIsTerminator != true || s[i] != ",")
        && (i + 1 >= s.length || !(s[i] == "/" && s[i + 1] == "/"))) {
        if (s[i] == '(') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = toExpressionTree(s, i + 1);
            children.push(expr);
            i = expr.i;
        }
        else if (s[i] == '[') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = new ArrayExpression(s, i + 1);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && s.substr(i, 2) == "..") {
            if (buffer.length + children.length == 0) {
                throw new TemplateError("Range expression missing something before ..", true, true);
            }
            children.push(buffer);
            return new RangeExpression(new SimpleExpression(children, i), s, i);
        }
        else if (s[i] == ",") {
            if (buffer.length + children.length == 0) {
                throw new TemplateError("List expression missing something before ,", true, true);
            }
            children.push(buffer);
            return new ListExpression(new SimpleExpression(children, i), s, i);
        }
        else if (s[i] == '"') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = new QuoteExpression(s, i);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && isAlpha(s[i]) && isAlpha(s[i + 1])) {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = new FunctionExpression(s, i);
            children.push(expr);
            i = expr.i;
        }
        else {
            buffer += s[i];
        }
        i++;
    }
    if (buffer.length > 0) {
        children.push(buffer);
    }
    return new SimpleExpression(children, i);
}
var SimpleExpression = (function () {
    function SimpleExpression(children, i) {
        this.children = children;
        this.i = i;
    }
    SimpleExpression.prototype.eval = function (injector) {
        injector.count();
        if (this.children.length == 1 && typeof (this.children[0]) != "string") {
            return this.children[0].eval(injector);
        }
        var buffer = "";
        for (var i = 0, expr = void 0; expr = this.children[i]; i++) {
            if (typeof (expr) == "string") {
                buffer += replaceVariables(expr, injector);
            }
            else {
                buffer += JSONtoEval(expr.eval(injector));
            }
        }
        ;
        if (helpers.IsNullOrWhiteSpace(buffer)) {
            return "";
        }
        buffer = helpers.replaceAll(buffer, " ", "");
        buffer = helpers.replaceAll(buffer, "\t", "");
        buffer = helpers.replaceAll(buffer, "--", "+");
        var evaluated = eval(buffer);
        return JSON.stringify(evaluated);
    };
    return SimpleExpression;
}());
var QuoteExpression = (function () {
    function QuoteExpression(s, i) {
        i++;
        this.s = "";
        while (i < s.length && s[i] != '"') {
            this.s += s[i];
            i++;
        }
        this.i = i;
    }
    QuoteExpression.prototype.eval = function (injector) {
        injector.count();
        return "\"" + this.s + "\"";
    };
    return QuoteExpression;
}());
var RangeExpression = (function () {
    function RangeExpression(firstBuffer, s, i) {
        this.minExpr = firstBuffer;
        this.maxExpr = toExpressionTree(s, i + 2);
        this.i = this.maxExpr.i;
    }
    RangeExpression.prototype.eval = function (injector) {
        injector.count();
        var decimalmin = Number(this.minExpr.eval(injector));
        var decimalmax = Number(this.maxExpr.eval(injector));
        var min = Math.ceil(decimalmin);
        var max = Math.floor(decimalmax);
        if (min > max) {
            var tempSwapMinandMax = min;
            min = max;
            max = tempSwapMinandMax;
        }
        var temp = min == max ? min : min + injector.random.next(max - min + 1);
        return JSON.stringify(temp);
    };
    return RangeExpression;
}());
var ListExpression = (function () {
    function ListExpression(firstBuffer, s, i) {
        this.options = [];
        if (firstBuffer != null) {
            this.options.push(firstBuffer);
        }
        while (i < s.length && s[i] != ')'
            && (i + 1 >= s.length || !(s[i] == "/" && s[i + 1] == "/"))) {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {
                    i++;
                }
                var expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new TemplateError("bad list", true, true);
            }
        }
        this.i = i;
    }
    ListExpression.prototype.eval = function (injector) {
        injector.count();
        var randomIndex = injector.indexForListEvaluation % this.options.length;
        var evaluated = this.options[randomIndex].eval(injector);
        return evaluated;
    };
    return ListExpression;
}());
var ArrayExpression = (function () {
    function ArrayExpression(s, i) {
        this.options = [];
        while (i < s.length && s[i] != ']'
            && (i + 1 >= s.length || !(s[i] == "/" && s[i + 1] == "/"))) {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {
                    i++;
                }
                var expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new TemplateError("bad array", true, true);
            }
        }
        this.i = i;
    }
    ArrayExpression.prototype.eval = function (injector) {
        injector.count();
        var evaluated = "[" + this.options.map(function (o) { return o.eval(injector); }).join() + "]";
        return evaluated;
    };
    return ArrayExpression;
}());
var FunctionExpression = (function () {
    function FunctionExpression(s, i) {
        this.functionName = "";
        this.functionNamePreserveCase = "";
        while (i < s.length &&
            (isAlpha(s[i]) || (helpers.isNumeric(s[i])))) {
            this.functionName += s[i].toLowerCase();
            this.functionNamePreserveCase += s[i];
            i++;
        }
        if (s[i] != "(") {
            this.i = i - 1;
            if (this.functionName == "true") {
                this.eval = function (injector) { return true; };
            }
            else if (this.functionName == "false") {
                this.eval = function (injector) { return false; };
            }
            else {
                throw new TemplateError("string without following bracket", true, true);
            }
        }
        else {
            this.list = new ListExpression(null, s, i + 1);
            this.i = this.list.i;
        }
    }
    FunctionExpression.prototype.eval = function (injector) {
        injector.count();
        if (this.functionName == "if") {
            if (this.list.options[0].eval(injector) == "true") {
                return this.list.options[1].eval(injector);
            }
            else {
                return this.list.options[2].eval(injector);
            }
        }
        var evaluatedParameters = this.list.options.map(function (o) {
            var f = o.eval(injector);
            return JSON.parse(f);
        });
        if (this.functionName == "exponent") {
            var asExponent = evaluatedParameters[0].toExponential();
            var Eindex = asExponent.indexOf('e');
            return JSON.stringify(asExponent.substr(Eindex + 1));
        }
        if (this.functionName == "mantissa") {
            var asExponent = evaluatedParameters[0].toExponential();
            var Eindex = asExponent.indexOf('e');
            return JSON.stringify(asExponent.substr(0, Eindex));
        }
        if (this.functionName == "includes") {
            var ret = evaluatedParameters[0].toString().includes(evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "maxlength") {
            if (evaluatedParameters[0][0] == '"') {
                return "\"" + evaluatedParameters[0].substr(1, evaluatedParameters[1]) + "\"";
            }
            var ret_1 = evaluatedParameters[0].toString().substr(0, evaluatedParameters[1]);
            return JSON.stringify(ret_1);
        }
        if (this.functionName == "padleftzeroes") {
            var ret_2 = evaluatedParameters[0].toString().padStart(evaluatedParameters[1], '0');
            return JSON.stringify(ret_2);
        }
        if (this.functionName == "padrightzeroes") {
            var str = evaluatedParameters[0].toString();
            if (!str.includes('.'))
                str += '.';
            var ret_3 = str.padEnd(evaluatedParameters[1], '0');
            return JSON.stringify(ret_3);
        }
        if (this.functionName == "getdigit") {
            var n_1 = evaluatedParameters[0];
            var ret_4 = getDigits(n_1)[evaluatedParameters[1] - 1];
            return JSON.stringify(ret_4);
        }
        if (this.functionName == "dayname") {
            var year = evaluatedParameters[0];
            var month = evaluatedParameters[1];
            var date = evaluatedParameters[2];
            var today = new Date(year, month - 1, date);
            var ret_5 = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];
            return JSON.stringify(ret_5);
        }
        if (this.functionName == "dayofyear") {
            var year = evaluatedParameters[0];
            var month = evaluatedParameters[1];
            var date = evaluatedParameters[2];
            var firstOfYear = new Date(year, 0, 1);
            var today = new Date(year, month - 1, date);
            var ret_6 = Math.round((today.valueOf() - firstOfYear.valueOf()) / 8.64e7 + 1);
            return JSON.stringify(ret_6);
        }
        if (this.functionName == "abs") {
            var ret_7 = Math.abs(evaluatedParameters[0]);
            return JSON.stringify(ret_7);
        }
        if (this.functionName == "mean") {
            var sum = evaluatedParameters.reduce(function (acc, val) { return acc + val; });
            var ret_8 = sum / evaluatedParameters.length;
            return JSON.stringify(ret_8);
        }
        if (this.functionName == "median") {
            evaluatedParameters.sort();
            var l_1 = evaluatedParameters.length;
            var ret_9 = null;
            if (l_1 % 2 == 0) {
                ret_9 = 0.5 * (evaluatedParameters[l_1 / 2 - 1] + evaluatedParameters[l_1 / 2]);
            }
            else {
                ret_9 = evaluatedParameters[(l_1 - 1) / 2];
            }
            return JSON.stringify(ret_9);
        }
        if (this.functionName == "lowerquartile") {
            evaluatedParameters.sort();
            var l_2 = evaluatedParameters.length;
            var ret_10 = null;
            if (l_2 % 4 == 0) {
                ret_10 = 0.5 * (evaluatedParameters[l_2 / 4 - 1] + evaluatedParameters[l_2 / 4]);
            }
            else {
                ret_10 = evaluatedParameters[Math.floor(l_2 / 4)];
            }
            return JSON.stringify(ret_10);
        }
        if (this.functionName == "upperquartile") {
            evaluatedParameters.sort();
            var l_3 = evaluatedParameters.length;
            var ret_11 = null;
            if (l_3 % 4 == 0) {
                ret_11 = 0.5 * (evaluatedParameters[3 * l_3 / 4 - 1] + evaluatedParameters[3 * l_3 / 4]);
            }
            else {
                ret_11 = evaluatedParameters[Math.floor(3 * l_3 / 4)];
            }
            return JSON.stringify(ret_11);
        }
        if (this.functionName == "mode") {
            var freqs = {};
            for (var _i = 0, evaluatedParameters_1 = evaluatedParameters; _i < evaluatedParameters_1.length; _i++) {
                n = evaluatedParameters_1[_i];
                if (n in freqs) {
                    freqs[n] += 1;
                }
                else {
                    freqs[n] = 1;
                }
            }
            var bestF = 0;
            var best = -1;
            var ret_12 = null;
            for (var f in freqs) {
                if (freqs[f] > bestF) {
                    bestF = freqs[f];
                    ret_12 = f;
                }
            }
            return JSON.stringify(ret_12);
        }
        if (this.functionName == "max") {
            var best = evaluatedParameters[0];
            for (var i = 1; i < evaluatedParameters.length; i++) {
                if (evaluatedParameters[i] > best) {
                    best = evaluatedParameters[i];
                }
            }
            return JSON.stringify(best);
        }
        if (this.functionName == "min") {
            var best = evaluatedParameters[0];
            for (var i = 1; i < evaluatedParameters.length; i++) {
                if (evaluatedParameters[i] < best) {
                    best = evaluatedParameters[i];
                }
            }
            return JSON.stringify(best);
        }
        if (this.functionName == "hcf") {
            var ret_13 = hcfMulti(evaluatedParameters);
            return JSON.stringify(ret_13);
        }
        if (this.functionName == "coprime") {
            var denom = evaluatedParameters[0];
            if (denom < 2) {
                throw new TemplateError("no smaller coprime number exists for " + denom, true, true);
            }
            var guess = injector.random.next(denom - 1) + 1;
            while (HCF(denom, guess) > 1) {
                guess = injector.random.next(denom - 1) + 1;
            }
            return JSON.stringify(guess);
        }
        if (this.functionName == "roundtodp") {
            var mult = Math.pow(10, evaluatedParameters[1]);
            var result = Math.round(evaluatedParameters[0] * mult) / mult;
            return JSON.stringify(result);
        }
        if (this.functionName == "roundtosf") {
            var n = evaluatedParameters[0];
            var d = evaluatedParameters[1];
            ret = roundToSF(n, d);
            return JSON.stringify(ret);
        }
        if (this.functionName == "factorial") {
            var ret_14 = factorial(evaluatedParameters[0]);
            return JSON.stringify(ret_14);
        }
        if (this.functionName == "toexponential") {
            var ret_15 = evaluatedParameters[0];
            return JSON.stringify(ret_15.toExponential());
        }
        if (this.functionName == "includesign") {
            var sign = evaluatedParameters[0] < 0 ? "-" : "+";
            var ret_16 = "\"" + sign + " " + Math.abs(evaluatedParameters[0]).toString() + "\"";
            return JSON.stringify(ret_16);
        }
        if (this.functionName == "includeoppsign") {
            var sign = evaluatedParameters[0] < 0 ? "+ " : "- ";
            var ret_17 = "\"" + sign + " " + Math.abs(evaluatedParameters[0]).toString() + "\"";
            return JSON.stringify(ret_17);
        }
        if (this.functionName == "sind") {
            var ret_18 = Math.sin(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret_18);
        }
        if (this.functionName == "cosd") {
            var ret_19 = Math.cos(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret_19);
        }
        if (this.functionName == "tand") {
            var ret_20 = Math.tan(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret_20);
        }
        if (this.functionName == "asind") {
            var ret_21 = (180 * Math.asin(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret_21);
        }
        if (this.functionName == "acosd") {
            var ret_22 = (180 * Math.acos(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret_22);
        }
        if (this.functionName == "atand") {
            var ret_23 = 0;
            if (evaluatedParameters.length == 1) {
                ret_23 = (180 * Math.atan(evaluatedParameters[0]) / Math.PI);
            }
            if (evaluatedParameters.length == 2) {
                ret_23 = (180 * Math.atan(evaluatedParameters[0] / evaluatedParameters[1]) / Math.PI);
                var xIsPos = evaluatedParameters[0] > 0;
                var yIsPos = evaluatedParameters[1] > 0;
                if (xIsPos) {
                    ret_23 += yIsPos ? 0 : 180;
                }
                else {
                    ret_23 += yIsPos ? 360 : 180;
                }
            }
            return JSON.stringify(ret_23);
        }
        if (this.functionName == "choose") {
            var index = evaluatedParameters[0];
            var ret_24 = evaluatedParameters[index + 1];
            return JSON.stringify(ret_24);
        }
        if (this.functionName == "countif") {
            var target = evaluatedParameters[0];
            var ret_25 = evaluatedParameters.slice(1).filter(function (e) { return e == target; }).length;
            return JSON.stringify(ret_25);
        }
        if (this.functionName == "large") {
            var l = evaluatedParameters.length;
            var index2 = l - evaluatedParameters[l - 1] - 1;
            var ret_26 = evaluatedParameters.slice(0, l - 1).sort()[index2];
            return JSON.stringify(ret_26);
        }
        if (this.functionName == "normalcdf") {
            var X = evaluatedParameters[0];
            var T = 1 / (1 + .2316419 * Math.abs(X));
            var D = .3989423 * Math.exp(-X * X / 2);
            var Prob = D * T * (.3193815 + T * (-.3565638 + T * (1.781478 + T * (-1.821256 + T * 1.330274))));
            if (X > 0) {
                Prob = 1 - Prob;
            }
            return JSON.stringify(Prob);
        }
        if (this.functionName == "binomial") {
            var x = evaluatedParameters[0];
            var N = evaluatedParameters[1];
            var p = evaluatedParameters[2];
            var ret_27 = binomial(x, N, p);
            return JSON.stringify(ret_27);
        }
        if (this.functionName == "binomialcdf") {
            var x = evaluatedParameters[0];
            var N = evaluatedParameters[1];
            var p = evaluatedParameters[2];
            var ret_28 = 0;
            for (var i_1 = 0; i_1 <= x; i_1++) {
                ret_28 += binomial(i_1, N, p);
            }
            return JSON.stringify(ret_28);
        }
        if (this.functionName == "sgn") {
            var ret_29 = 0;
            if (evaluatedParameters[0] < 0) {
                ret_29 = -1;
            }
            if (evaluatedParameters[0] > 0) {
                ret_29 = 1;
            }
            return JSON.stringify(ret_29);
            return JSON.stringify(ret_29);
        }
        if (this.functionName == "lcm") {
            var ret_30 = lcm(evaluatedParameters);
            return JSON.stringify(ret_30);
        }
        if (this.functionName == "code") {
            var JSName = helpers.stripQuotes(evaluatedParameters[0]);
            injector.customFunctions[JSName] = null;
            var DEFAULTCODE = "function " + JSName + "() {\n\n    //your code goes here\n\n    }";
            if (injector.allSolutions) {
                var thisSolution = injector.allSolutions.filter(function (s) { return s.template == injector; });
                if (thisSolution.length == 1) {
                    thisSolution[0].triggerCalculateFromLateFunction = false;
                    var code = thisSolution[0].field.elementValue;
                    if (code == "" && JSName != "console") {
                        thisSolution[0].field.elementValue = DEFAULTCODE;
                    }
                    else {
                        if (code != DEFAULTCODE) {
                            injector.customFunctions[JSName] = new JSFunction(code, JSName);
                            injector.allSolutions.filter(function (s) { return s.triggerCalculateFromLateFunction; }).forEach(function (s) {
                                s.template._calculatedValue = "null";
                                s.field.onResponse();
                            });
                        }
                    }
                }
            }
            return "null";
        }
        if (injector.customFunctions[this.functionNamePreserveCase] instanceof JSFunction) {
            return injector.customFunctions[this.functionNamePreserveCase].execute(evaluatedParameters);
        }
        if (this.functionName == "variable") {
            var JSName = helpers.stripQuotes(evaluatedParameters[0]);
            injector.customFunctions[JSName] = null;
            if (injector.allSolutions == undefined) {
                throw new TemplateError("allSolutions not found on template", false, false);
            }
            var thisSolution = injector.allSolutions.filter(function (s) { return s.template == injector; });
            if (thisSolution.length != 1) {
                throw new Error("number of matching solutions != 1");
            }
            thisSolution[0].triggerCalculateFromLateFunction = false;
            if (thisSolution[0].field.elementValue) {
                injector.customFunctions[JSName] = safeStringify(thisSolution[0].field.elementValue);
                injector.allSolutions.filter(function (s) { return s.triggerCalculateFromLateFunction; }).forEach(function (s) {
                    s.template._calculatedValue = "null";
                    s.field.onResponse();
                });
            }
            return "null";
        }
        if (injector.customFunctions[this.functionNamePreserveCase] === null) {
            throw new TemplateError("custom function with name \"" + this.functionNamePreserveCase + "\" not defined", false, false);
        }
        if (typeof (Math[this.functionName]) == "function") {
            var ret_31 = Math[this.functionName](evaluatedParameters[0], evaluatedParameters[1], evaluatedParameters[2]);
            return JSON.stringify(ret_31);
        }
        return "null";
    };
    return FunctionExpression;
}());
var imageData = {
    "cross": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIhSURBVDjLlZPrThNRFIWJicmJz6BWiYbIkYDEG0JbBiitDQgm0PuFXqSAtKXtpE2hNuoPTXwSnwtExd6w0pl2OtPlrphKLSXhx07OZM769qy19wwAGLhM1ddC184+d18QMzoq3lfsD3LZ7Y3XbE5DL6Atzuyilc5Ciyd7IHVfgNcDYTQ2tvDr5crn6uLSvX+Av2Lk36FFpSVENDe3OxDZu8apO5rROJDLo30+Nlvj5RnTlVNAKs1aCVFr7b4BPn6Cls21AWgEQlz2+Dl1h7IdA+i97A/geP65WhbmrnZZ0GIJpr6OqZqYAd5/gJpKox4Mg7pD2YoC2b0/54rJQuJZdm6Izcgma4TW1WZ0h+y8BfbyJMwBmSxkjw+VObNanp5h/adwGhaTXF4NWbLj9gEONyCmUZmd10pGgf1/vwcgOT3tUQE0DdicwIod2EmSbwsKE1P8QoDkcHPJ5YESjgBJkYQpIEZ2KEB51Y6y3ojvY+P8XEDN7uKS0w0ltA7QGCWHCxSWWpwyaCeLy0BkA7UXyyg8fIzDoWHeBaDN4tQdSvAVdU1Aok+nsNTipIEVnkywo/FHatVkBoIhnFisOBoZxcGtQd4B0GYJNZsDSiAEadUBCkstPtN3Avs2Msa+Dt9XfxoFSNYF/Bh9gP0bOqHLAm2WUF1YQskwrVFYPWkf3h1iXwbvqGfFPSGW9Eah8HSS9fuZDnS32f71m8KFY7xs/QZyu6TH2+2+FAAAAABJRU5ErkJggg==",
    "tick": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLvZPZLkNhFIV75zjvYm7VGFNCqoZUJ+roKUUpjRuqp61Wq0NKDMelGGqOxBSUIBKXWtWGZxAvobr8lWjChRgSF//dv9be+9trCwAI/vIE/26gXmviW5bqnb8yUK028qZjPfoPWEj4Ku5HBspgAz941IXZeze8N1bottSo8BTZviVWrEh546EO03EXpuJOdG63otJbjBKHkEp/Ml6yNYYzpuezWL4s5VMtT8acCMQcb5XL3eJE8VgBlR7BeMGW9Z4yT9y1CeyucuhdTGDxfftaBO7G4L+zg91UocxVmCiy51NpiP3n2treUPujL8xhOjYOzZYsQWANyRYlU4Y9Br6oHd5bDh0bCpSOixJiWx71YY09J5pM/WEbzFcDmHvwwBu2wnikg+lEj4mwBe5bC5h1OUqcwpdC60dxegRmR06TyjCF9G9z+qM2uCJmuMJmaNZaUrCSIi6X+jJIBBYtW5Cge7cd7sgoHDfDaAvKQGAlRZYc6ltJlMxX03UzlaRlBdQrzSCwksLRbOpHUSb7pcsnxCCwngvM2Rm/ugUCi84fycr4l2t8Bb6iqTxSCgNIAAAAAElFTkSuQmCC",
    "star": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLlZLNS5RRFMafe9/3vjPOjI1jaKKEVH40tGgRBWEibfoPQoKkVdtoEQQF4T/QqkVtWrSTFrVsF1FgJbWpIAh1k2PNh+PrfL4f95zTQk0HHKkDD/cc7vP8uHCuEhF0q/KnmXNgGR248PZFN4/GISXMC8L89DBPV0Dp4/SsazJjrtfb9/vdxfn/BgjzY5M8Aq8nBya+V3h93vtnQHFxat4kszntJAAAxus1YvnZQV5V/jyTEZarwnwFLGeFZdT0ZFOJdD84qoCDOpQ7grZfRNj020JSEOKvwvxGiF+q0tL0N5PuO+Mk0nC0B0BDsYCCImyzAIktBBloMwKJLSgKYcMAcdhC2KpVlIig+H5qxcv0n0xmj4Gbq+BwC2wtJLbgHUlMEFJwUpMIGpto16u+kJzSACAk+WCzvNbe+AVljkOYIcQQou3TbvdOJo+g4aNdqzaF+PT43HJVA8DQpcVIiPPtaqlEUQzlDELsTpgYwgTAQIjQqlUCtpQfn1spdmxh+PJSQyw9CrbKgM7tvcISQAxlBhC3GuCYXk3cWP25m3M7dk88qbWBRDVApaATOSjPBdXXwYEP5QyCgvjE/kwHgInHtHYBnYA2owhrPiiuw0sOw3EZFEagIB7qChDiYaUcNIoFtP1KxCTPhWiDw7WbXk9vKpnOgsI4exjg6Mbq96YQPxm79uPOvqvbXx4O3KrF6w8osv2df17kr5YXJq7vnw/S0v3k7Ie7xtud/wAaRnP+Cw8iKQAAAABJRU5ErkJggg==",
    "trash": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAFuSURBVBgZBcG/S1RxAADwz3teyp3XFUUWNVSoRGQR3dLQIESBbUZt9gekm9XW2lRbNDv0gxbJWoJoCcT+ABskTgcDDwLpOD19d+/73rfPJ4kAANaejUx03t5eBZIIgKe34r3JB7OTVVvZuzf9lderiKIoip7MLba+xY24H4v4N36PC635uSgFIJ2/Pz7ppH19w66aHk/nqQCfk8LU1BWJAyMyo3Y1bV2nwpeh8nxxthg+Vm+ZUFVKHDjhK1UqlJeK52E61LOkasOhRDAic8EWKp/qxaupmdOO6Fi3bVyiEAQdA6Th7tjMGYcyDTcdtWlUoqYtypHmjy/atadrX6JpU5QaMhDlSPNTFX9kMj0H6rr+gYFCjnSw3XNZ2y9dPfT1lUq5UkA6+Phb3TU3NJArHFeKhtTkSBc+rC//0NBQVbNmwphzGu5oCztUGDz8udydbSrlVmI9eSkIirzYKZokESw+yl+EdtgL75eWAID/yIWfXhcZhKEAAAAASUVORK5CYII=",
    "duplicate": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAy0lEQVQ4T63TMWoCQRQG4G9rzyCBgCGNR0ifJiCinSmCgVS2sfAWaQzYJRcQJNhbW5rWVpTUaZJCBrZYltnd6GbKmXkf/3vMJGqupGa9LLDCZQm4Rid/ngW+8IOPCNLFAddVwByPESDsh+LawAz9NGkP+3wLVQle8IwLtLE5FQgt3OOtCFjgITKDsN9KZzDAexHQwGcOCClD3G0VMEWz5B0EeIzCBNnaCW5xEwH/BLziCUt855DQzlVsBtl7IwxL2vnFHXb/+pnO+phHa64xEbM+Qh0AAAAASUVORK5CYII=",
    "hourglass": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ6SURBVDjLjZO7T1NhGMY7Mji6uJgYt8bElTjof6CDg4sMSqIxJsRGB5F4TwQSIg1QKC0KWmkZEEsKtEcSxF5ohV5pKSicXqX3aqGn957z+PUEGopiGJ583/A+v3znvPkJAAjWR0VNJG0kGhKahCFhXcN3YBFfx8Kry6ym4xIzce88/fbWGY2k5WRb77UTTbWuYA9gDGg7EVmSIOF4g5T7HZKuMcSW5djWDyL0uRf0dCc8inYYxTcw9fAiCMBYB3gVj1z7gLhNTjKCqHkYP79KENC9Bq3uxrrqORzy+9D3tPAAccspVx1gWg0KbaZFbGllWFM+xrKkFQudV0CeDfJsjN4+C2nracjunoPq5VXIBrowMK4V1gG1LGyWdbZwCalsBYUyh2KFQzpXxVqkAGswD3+qBDpZwow9iYE5v26/VwfUQnnznyhvjguQYabIIpKpYD1ahI8UTT92MUSFuP5Z/9TBTgOgFrVjp3nakaG/0VmEfpX58pwzjUEquNk362s+PP8XYD/KpYTBHmRg9Wch0QX1R80dCZhYipudYQY2Auib8RmODVCa4hfUK4ngaiiLNFNFdKeCWWscXZMbWy9Unv9/gsIQU09a4pwvUeA3Uapy2C2wCKXL0DqTePLexbWPOv79E8f0UWrencZ2poxciUWZlKssB4bcHeE83NsFuMgpo2iIpMuNa1TNu4XjhggWvb+R2K3wZdLlAZl8Fd9jRb5sD+Xx0RJBx5gdom6VsMEFDyWF0WyCeSOFcDKPnRxZYTQL5Rc/nn1w4oFsBaIhC3r6FRh5erPRhYMyHdeFw4C6zkRhmijM7CnMu0AUZonCDCnRJBqSus5/ABD6Ba5CkQS8AAAAAElFTkSuQmCC",
    "error": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIsSURBVDjLpVNLSJQBEP7+h6uu62vLVAJDW1KQTMrINQ1vPQzq1GOpa9EppGOHLh0kCEKL7JBEhVCHihAsESyJiE4FWShGRmauu7KYiv6Pma+DGoFrBQ7MzGFmPr5vmDFIYj1mr1WYfrHPovA9VVOqbC7e/1rS9ZlrAVDYHig5WB0oPtBI0TNrUiC5yhP9jeF4X8NPcWfopoY48XT39PjjXeF0vWkZqOjd7LJYrmGasHPCCJbHwhS9/F8M4s8baid764Xi0Ilfp5voorpJfn2wwx/r3l77TwZUvR+qajXVn8PnvocYfXYH6k2ioOaCpaIdf11ivDcayyiMVudsOYqFb60gARJYHG9DbqQFmSVNjaO3K2NpAeK90ZCqtgcrjkP9aUCXp0moetDFEeRXnYCKXhm+uTW0CkBFu4JlxzZkFlbASz4CQGQVBFeEwZm8geyiMuRVntzsL3oXV+YMkvjRsydC1U+lhwZsWXgHb+oWVAEzIwvzyVlk5igsi7DymmHlHsFQR50rjl+981Jy1Fw6Gu0ObTtnU+cgs28AKgDiy+Awpj5OACBAhZ/qh2HOo6i+NeA73jUAML4/qWux8mt6NjW1w599CS9xb0mSEqQBEDAtwqALUmBaG5FV3oYPnTHMjAwetlWksyByaukxQg2wQ9FlccaK/OXA3/uAEUDp3rNIDQ1ctSk6kHh1/jRFoaL4M4snEMeD73gQx4M4PsT1IZ5AfYH68tZY7zv/ApRMY9mnuVMvAAAAAElFTkSuQmCC",
    "refresh": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI/SURBVDjLjZPbS9NhHMYH+zNidtCSQrqwQtY5y2QtT2QGrTZf13TkoYFlzsWa/tzcoR3cSc2xYUlGJfzAaIRltY0N12H5I+jaOxG8De+evhtdOP1hu3hv3sPzPO/z4SsBIPnfuvG8cbBlWiEVO5OUItA0VS8oxi9EdhXo+6yV3V3UGHRvVXHNfNv6zRfNuBZVoiFcB/3LdnQ8U+Gk+bhPVKB3qUOuf6/muaQR/qwDkZ9BRFdCmMr5EPz6BN7lMYylLGgNNaKqt3K0SKDnQ7us690t3rNsxeyvaUz+8OJpzo/QNzd8WTtcaQ7WlBmPvxhx1V2Pg7oDziIBimwwf3qAGWESkVwQ7owNujk1ztvk+cg4NnAUTT4FrrjqUKHdF9jxBfXr1rgjaSk4OlMcLrnOrJ7latxbL1V2lgvlbG9MtMTrMw1r1PImtfyn1n5q47TlBLf90n5NmalMtUdKZoyQMkLKlIGLjMyYhFpmlz3nGEVmFJlRZNaf7pIaEndM24XIjCOzjX9mm2S2JsqdkMYIqbB1j5C6yWzVk7YRFTsGFu7l+4nveExIA9aMCcOJh6DIoMigyOh+o4UryRWQOtIjaJtoziM1FD0mpE4uZcTc72gBaUyYKEI6khgqINXO3saR7kM8IZUVCRDS0Ucf+xFbCReQhr97MZ51wpWxYnhpCD3zOrT4lTisr+AJqVx0Fiiyr4/vhP4VyyMFIUWNqRrV96vWKXKckBoIqWzXYcoPDrUslDJoopuEVEpIB0sR+AuErIiZ6OqMKAAAAABJRU5ErkJggg==",
    "grid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAApklEQVQ4jb3SQQqBURTF8R99E0aSMrEFC7AGpvYmG1A2YgG2YCIDJSlRTF65fS4lcut1T+f/Ou/d1+O5ZkFPysoYqJKAbtCtNww0k4CP6uuABuboBG+EVdGD0jcJg30Wugx6WlbG8IMRKozRDt4gnDqq7Y8MThVOOAfz4jHbsfR9wuCa3eq/b9DAAr3gDbEuul/6NmGwy0L/O8JP/kG9DkGfcXvBwB3GoiAx97DmjwAAAABJRU5ErkJggg=="
};
var helpersMaker = function () {
    var stringToHash = function (str) {
        var hash = 0;
        if (str.length == 0) {
            return hash;
        }
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    };
    var trimChar = function (str, char) {
        var i = 0;
        while (i < str.length && str[i] == char) {
            i++;
        }
        if (i == str.length) {
            return "";
        }
        var j = str.length - 1;
        while (j >= 0 && str[j] == char) {
            j--;
        }
        return str.substring(i, j + 1);
    };
    var CombineHashCodes = function (strings) {
        var hash = 5381;
        for (var i = 0, s; s = strings[i]; i++) {
            hash = ((hash << 5) + hash) ^ stringToHash(s);
        }
        return hash;
    };
    var IsNullOrEmpty = function (str) {
        return (str.length === 0 || !str.trim());
    };
    var IsNullOrWhiteSpace = function (str) {
        return str === null || str.trim().length == 0;
    };
    var createUID = function () {
        return 'ID' + Math.random().toString(36).substr(2, 16);
    };
    var shuffle = function (a, random) {
        var _a;
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(random.next(i + 1));
            _a = [a[j], a[i]], a[i] = _a[0], a[j] = _a[1];
        }
        return a;
    };
    var startsWith = function (a, ai, b, bi) {
        if (ai == 0 && bi != 0) {
            return false;
        }
        if (bi == 0) {
            return a[ai] == b[bi];
        }
        return a[ai] == b[bi] && startsWith(a, ai - 1, b, bi - 1);
    };
    var replaceAll = function (within, toReplace, replaceWith) {
        var ret = "";
        var i = 0;
        var toReplaceLength = toReplace.length;
        while (i < within.length) {
            if (startsWith(within, i + toReplaceLength - 1, toReplace, toReplaceLength - 1)) {
                ret += replaceWith;
                i += toReplaceLength;
            }
            else {
                ret += within[i];
                i += 1;
            }
        }
        return ret;
    };
    var stripQuotes = function (str) {
        if (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"') {
            return str.substr(1, str.length - 2);
        }
        return str.toString();
    };
    var isNumeric = function (str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    };
    var descendants = function (div) {
        var ret = [div];
        var list = div.children;
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var child = list_1[_i];
            ret = ret.concat(descendants(child));
        }
        return ret;
    };
    return {
        CombineHashCodes: CombineHashCodes,
        IsNullOrEmpty: IsNullOrEmpty,
        IsNullOrWhiteSpace: IsNullOrWhiteSpace,
        createUID: createUID,
        shuffle: shuffle,
        replaceAll: replaceAll,
        startsWith: startsWith,
        stripQuotes: stripQuotes,
        trimChar: trimChar,
        isNumeric: isNumeric,
        descendants: descendants
    };
};
var helpers = helpersMaker();
var Random = (function () {
    function Random(seed) {
        if (seed == undefined) {
            var now = new Date();
            seed = now.getTime();
        }
        this._seed = seed % 2147483647;
        if (this._seed <= 0)
            this._seed += 2147483646;
    }
    Random.prototype.next = function (limit) {
        if (limit == undefined) {
            limit = 2147483647;
        }
        this._seed = this._seed * 16807 % 2147483647;
        return this._seed % limit;
    };
    return Random;
}());
var RowHTML = (function () {
    function RowHTML(row, showTitle, settings) {
        this.row = row;
        this.settings = settings;
        this.errors = [];
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
        if (this.settings.allowRowDelete) {
            var deleteButton = document.createElement("img");
            deleteButton.className = "deleteButton hideOnPrint";
            deleteButton.onclick = (function (ref) {
                var r = ref;
                return function () {
                    if (r.deleteSelf)
                        r.deleteSelf();
                };
            })(this);
            deleteButton.src = imageData.trash;
            this.marginDiv.appendChild(deleteButton);
        }
        if (this.settings.allowRowDelete) {
            var duplicateButton = document.createElement("img");
            duplicateButton.className = "duplicateButton hideOnPrint";
            duplicateButton.onclick = (function (ref) {
                var r = ref;
                return function () {
                    if (r.duplicateSelf)
                        r.duplicateSelf();
                };
            })(this);
            duplicateButton.src = imageData.duplicate;
            this.marginDiv.appendChild(duplicateButton);
        }
    }
    Object.defineProperty(RowHTML.prototype, "outerDiv", {
        get: function () {
            if (!this._cellCups) {
                this.dynamicDiv.innerHTML = this.cellCups.map(function (c) { return c.HTML; }).join("");
                if (this.solutions) {
                    this.solutions.forEach(function (s) { return s.importResponses(); });
                }
                if (this.errors.length > 0) {
                    var para = document.createElement("p");
                    para.className = "errorList";
                    para.innerHTML = "<u>This row contains some errors:</u><br>" + this.errors.join("<br>");
                    this._outerDiv.insertBefore(para, this._outerDiv.firstChild);
                }
                this.cellCups[0].element = this.dynamicDiv.children[0];
                if (this.cellCups[1]) {
                    this.cellCups[1].element = this.dynamicDiv.children[1];
                }
                var elems = helpers.descendants(this.dynamicDiv);
                for (var _i = 0, elems_1 = elems; _i < elems_1.length; _i++) {
                    var el = elems_1[_i];
                    if (el.id && el.id.substr(0, 3) == "cup") {
                        var cupFound = FieldCup.instances[Number(el.id.substr(3, 99))];
                        if (cupFound) {
                            cupFound.setElement(el);
                        }
                    }
                }
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
            if (this._cellCups == null) {
                this._cellCups = [];
                var injectorInstance = this.getInjectorInstance();
                for (var _i = 0, _a = this.row.leftRight; _i < _a.length; _i++) {
                    var markdown = _a[_i];
                    if (markdown) {
                        var cellCup = new DivCup(markdown);
                        cellCup.replace(/(`{3,}[^`]*`{3,})/, function (s) { return new CodeCup(s); }, null);
                        cellCup.replace(/(?:^|\n)([\|¦](?:[^\n]|\n\|)*)/, function (s) { return new TableCup(s); }, null);
                        cellCup.replace(/(?:^|\n)(@\[[0-9]+,[0-9]+\]\([^)]*\))/, function (s) { return new RelativePositionCup(s); }, null);
                        cellCup.replace(/(?:^|\n)(\*)/, function (s) { return new BulletCup(s); }, null);
                        cellCup.replace(/(\n[^\n]*)/, function (s) { return new ParagraphCup(s); }, null);
                        cellCup.replace(/(~\[[^\]]*\]\((?:\\\)|[^)])*\))/, function (s) { return new FractionCup(s); }, null);
                        if (this.settings.removeHyperlinks) {
                            cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, function (s) { return new ChunkCup(""); }, null);
                        }
                        else {
                            cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, function (s) { return new AnchorCup(s); }, null);
                        }
                        cellCup.replace(/(!\[[^\]]*]\([^\)]*\))/, function (s) { return new ImageCup(s); }, null);
                        cellCup.replace(/(_{10,})/, function (s) { return new TextAreaCup(s); }, null);
                        cellCup.replace(/(_{2,9})/, function (s) { return new InputCup(s); }, null);
                        cellCup.replace(/(?:[^\!]|^)(\[\])/, function (s) { return new CheckBoxCup(""); }, null);
                        cellCup.replace(/(££)/, function (s) { return new PoundCup(""); }, null);
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
                        cellCup.replace(/(?:^|\s)([A-Z]\.)/, function (s) { return new RadioCup(s); }, replaceRadioInjector());
                        cellCup.replace(/({[^}]+\/[^}]+})/, function (s) { return new ComboCup(s); }, null);
                        if (this.row.purpose == "sudoku") {
                            cellCup.replace(/(\$\$)/, function (s) { return new InputCup("___"); }, this.replaceSudokuDollar);
                        }
                        if (injectorInstance) {
                            cellCup.onThisAndChildren(injectorInstance);
                        }
                        cellCup.replace(/((?:\n|^)#[^\n]+(?:\n|$))/, function (s) { return new TitleCup(s); }, null);
                        cellCup.replace(/(\^[\S]+)/, function (s) { return new SuperScriptCup(s); }, null);
                        cellCup.replace(/(\~[\S]+)/, function (s) { return new SubScriptCup(s); }, null);
                        cellCup.replace(/(\*[^*]+\*)/, function (s) { return new BoldCup(s); }, null);
                        cellCup.replace(/(_[^_]+_)/, function (s) { return new UnderlineCup(s); }, null);
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
                        this._cellCups.push(cellCup);
                    }
                }
                if (this._cellCups.length == 1) {
                    this._cellCups[0].class = "fullWidth";
                }
                if (this._cellCups.length == 2) {
                    this._cellCups[0].class = "leftHalfWidth";
                    this._cellCups[1].class = "rightHalfWidth";
                }
            }
            return this._cellCups;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RowHTML.prototype, "revealSection", {
        get: function () {
            return "<section><section>\n            <h1>" + this.row.title + "</h1>\n            <div class=\"dynamic\">" + this.dynamicDiv.innerHTML + "</div>\n        </section></section>";
        },
        enumerable: true,
        configurable: true
    });
    return RowHTML;
}());
var QuestionHTML = (function (_super) {
    __extends(QuestionHTML, _super);
    function QuestionHTML(row, showTitle, paramSettings) {
        var _this = _super.call(this, row, showTitle, paramSettings) || this;
        _this.solutions = [];
        _this.questionNumberDiv = document.createElement("p");
        _this.questionNumberDiv.className = "questionNumber";
        _this.marginDiv.insertBefore(_this.questionNumberDiv, _this.marginDiv.childNodes[0]);
        return _this;
    }
    QuestionHTML.prototype.delete = function () {
        _super.prototype.delete.call(this);
        if (this._solutionDiv) {
            this._solutionDiv.parentNode.removeChild(this._solutionDiv);
        }
        if (this._jumbleDivs) {
            this._jumbleDivs.forEach(function (j) { return j.parentNode.removeChild(j); });
        }
    };
    QuestionHTML.prototype.getInjectorInstance = function () {
        this.solutions = [];
        return this.injector(this.replacedTemplates(), this.solutions, this.settings);
    };
    Object.defineProperty(QuestionHTML.prototype, "jumbleDivs", {
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
    QuestionHTML.prototype.replacedTemplates = function () {
        var comments = this.row.comment.split('\n');
        return comments.map(function (c) { return new questionTemplate(c); });
    };
    QuestionHTML.prototype.setQuestionNumber = function (n) {
        this.questionNum = n;
        this.questionNumberDiv.innerText = "Q" + this.questionNum + ".";
        return this.refreshsolutionDiv();
    };
    QuestionHTML.prototype.injector = function (paramTemplates, paramSolutions, paramSettings) {
        var currentRadioSet = null;
        var templates = paramTemplates;
        var solutions = paramSolutions;
        var settings = paramSettings;
        var templateIndex = 0;
        function addSolution(cup) {
            var ret;
            if (templates.length > 0) {
                ret = new Solution(cup, templates[templateIndex++], settings, solutions);
            }
            else {
                ret = new Solution(cup, null, settings, solutions);
            }
            solutions.push(ret);
        }
        function getTemplateValue() {
            if (templateIndex < templates.length) {
                var t = templates[templateIndex++];
                var ret = t.calculatedValue;
                return calculatedJSONtoViewable(ret);
            }
            return "";
        }
        return function (fieldCup) {
            if (fieldCup != null && fieldCup instanceof FieldCup) {
                if (fieldCup instanceof RadioCup) {
                    if (fieldCup.letter == 'A' || currentRadioSet == null) {
                        currentRadioSet = new RadioSet();
                        currentRadioSet.add(fieldCup);
                        addSolution(currentRadioSet);
                    }
                    else {
                        currentRadioSet.add(fieldCup);
                    }
                }
                else {
                    addSolution(fieldCup);
                }
            }
            if (fieldCup.textReplace != null) {
                fieldCup.textReplace(/\${2}/g, getTemplateValue);
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
        },
        enumerable: true,
        configurable: true
    });
    QuestionHTML.prototype.showDecisionImage = function () {
        this.solutions.filter(function (s) { return s.outOf > 0; }).forEach(function (s) { return s.showDecisionImage(); });
    };
    Object.defineProperty(QuestionHTML.prototype, "correct", {
        get: function () {
            return this.solutions.reduce(function (a, b) { return a + b.score; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuestionHTML.prototype, "outOf", {
        get: function () {
            return this.solutions.reduce(function (a, b) { return a + b.outOf; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuestionHTML.prototype, "attempted", {
        get: function () {
            return this.solutions.reduce(function (a, b) { return a + b.attempted; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QuestionHTML.prototype, "stars", {
        get: function () {
            return this.solutions.reduce(function (a, b) { return a + b.stars; }, 0);
        },
        enumerable: true,
        configurable: true
    });
    return QuestionHTML;
}(RowHTML));
var TemplateHTML = (function (_super) {
    __extends(TemplateHTML, _super);
    function TemplateHTML(row, showTitle, paramSettings) {
        var _this = _super.call(this, row, showTitle, paramSettings) || this;
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
        var templates = [];
        var paramIndexForRangeEvaluation = this.randomForTemplate.next();
        var customFunctions = {};
        for (var i = 0; i < comments.length; i++) {
            templates.push(new Template(comments[i], templates, this.randomForTemplate, paramIndexForRangeEvaluation, customFunctions));
        }
        templates.forEach(function (t) { if (t)
            t.forceCalculate(); });
        for (var t in templates) {
            for (var e in templates[t].errorMessages) {
                this.errors.push("Error in line " + (t + 1) + " of comments : " + templates[t].errorMessages[e]);
            }
        }
        if (this.row.purpose == "sudoku") {
            var numDollars = ((this.row.leftRight.join(" ")).match(/\$\$/g) || []).length;
            var variablesUsed = templates.map(function (t) {
                if (t)
                    return t.variablesUsed;
                var ret = [];
                for (var i = 0; i < 26; i++)
                    ret.push(false);
                return ret;
            });
            for (var i = 0, eqn; eqn = variablesUsed[i]; i++) {
                eqn[i] = true;
            }
            variablesUsed = variablesUsed.map(function (arr) { return arr.slice(0, templates.length); });
            var variablesToShow = showVariables(variablesUsed, numDollars, this.settings.random);
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
        return templates;
    };
    TemplateHTML.prototype.refresh = function () {
        this._cellCups = null;
        this.dynamicDiv.innerHTML = this.cellCups.map(function (c) { return c.HTML; }).join("");
        this.refreshsolutionDiv();
    };
    return TemplateHTML;
}(QuestionHTML));
function showVariables(arr, numDollars, paramRandom) {
    var colsToShow = arr[0].map(function (a) { return false; });
    for (var rowCol = 0; rowCol < arr[0].length; rowCol++) {
        colsToShow[rowCol] = (arr[rowCol].filter(function (p) { return p; }).length == 1)
            && (arr.filter(function (p) { return p[rowCol]; }).length == 1);
    }
    arr = arr.filter(function (r) { return r.filter(function (p) { return p; }).length > 1; });
    var maxColsToShow = colsToShow.length - arr.length;
    var backupArr = arr.map(function (row) { return row.slice(); });
    var backupColsToShow = colsToShow.slice();
    while (arr.length > 0 || maxColsToShow < colsToShow.filter(function (p) { return p; }).length) {
        if (maxColsToShow < colsToShow.filter(function (p) { return p; }).length) {
            arr = backupArr.map(function (row) { return row.slice(); });
            colsToShow = backupColsToShow.slice();
        }
        var colsWithATrue = [];
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
        if (colsWithATrue.length == 0) {
            break;
        }
        var colToRemove = colsWithATrue[Math.floor(paramRandom.next(colsWithATrue.length))];
        colsToShow[colToRemove] = true;
        arr.forEach(function (f) { return f[colToRemove] = false; });
        var rowsWithOneTrue = arr.filter(function (r) { return r.filter(function (p) { return p; }).length == 1; });
        while (rowsWithOneTrue.length > 0) {
            for (var r = 0; r < rowsWithOneTrue.length; r++) {
                var row2 = rowsWithOneTrue[r];
                var singleCol = row2.indexOf(true);
                arr.forEach(function (f) { return f[singleCol] = false; });
                arr = arr.filter(function (r) { return r.filter(function (p) { return p; }).length > 0; });
            }
            rowsWithOneTrue = arr.filter(function (r) { return r.filter(function (p) { return p; }).length == 1; });
        }
    }
    return colsToShow;
}
var ALLOWABLE_ERROR_FOR_CORRECT_ANSWER = 0.05;
var Solution = (function () {
    function Solution(field, template, settings, allSolutions) {
        this.allSolutions = allSolutions;
        if (template) {
            template.allSolutions = allSolutions;
        }
        this.settings = settings;
        this.markbookIndex = settings.markbookIndex++;
        this.template = template;
        this.field = field;
        this.score = 0;
        this.triggerCalculateFromLateFunction = true;
        this.elementHasChangedSinceLastChecked = false;
        this.notYetChecked = true;
        this.notYetAnswered = true;
        field.onResponse = this.onResponseInjector(this);
    }
    Solution.prototype.importResponses = function () {
        if (this.settings.responses && this.settings.responses[this.markbookIndex]) {
            this.field.elementValue = this.settings.responses[this.markbookIndex];
            this.updateScoreAndImage();
            this.notYetChecked = false;
            this.elementHasChangedSinceLastChecked = true;
        }
        else {
            if (this.template) {
                this.template.forceCalculate();
            }
        }
    };
    Object.defineProperty(Solution.prototype, "affectsScore", {
        get: function () {
            return !(this.field.disabled || this.template == null ||
                !this.triggerCalculateFromLateFunction || this.field instanceof PoundCup);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "solutionText", {
        get: function () {
            if (this.affectsScore) {
                if (this.field instanceof CheckBoxCup || this.field instanceof PoundCup) {
                    return "";
                }
                else {
                    if (this.template instanceof Template) {
                        return calculatedJSONtoViewable(this.template.calculatedValue);
                    }
                    else {
                        return this.template.calculatedValue;
                    }
                }
            }
            return "";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "disabled", {
        set: function (value) {
            this.field.disabled = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "stars", {
        get: function () {
            if (this.image == decisionImageEnum.Star)
                return 1;
            return 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "attempted", {
        get: function () {
            if (this.notYetAnswered || !this.affectsScore)
                return 0;
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "outOf", {
        get: function () {
            if (!this.affectsScore)
                return 0;
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    Solution.prototype.showDecisionImage = function () {
        if (this.affectsScore && this.elementHasChangedSinceLastChecked) {
            this.field.decisionImage = this.image;
        }
        this.elementHasChangedSinceLastChecked = false;
        this.notYetChecked = false;
    };
    Solution.prototype.onResponseInjector = function (solution) {
        var s = solution;
        return function () {
            if (this.elementValue != null) {
                s.updateScoreAndImage();
                var doAppend = !s.notYetChecked &&
                    s.triggerCalculateFromLateFunction &&
                    s.settings.appendToMarkbook;
                var scores = s.settings.scoreGetters ? s.settings.scoreGetters.map(function (f) { return f(); }) : null;
                if (s.settings.markbookUpdate && helpers.isNumeric(s.markbookIndex)) {
                    s.settings.markbookUpdate(s.markbookIndex, s.field.elementValue, s.color, doAppend, scores);
                }
            }
        };
    };
    Solution.prototype.updateScoreAndImage = function () {
        this.elementHasChangedSinceLastChecked = true;
        this.notYetAnswered = false;
        this.color = "White";
        if (this.template) {
            if (this.field instanceof CheckBoxCup) {
                try {
                    this.score = (this.template.calculatedValue == "true") ? 1 : 0;
                    this.field.elementValue = (this.score == 1);
                }
                catch (e) {
                    if (e instanceof CodeError) {
                        this.field.elementValue = "!";
                        this.field.hoverText = e;
                    }
                    else {
                        throw (e);
                    }
                }
            }
            else if (this.field instanceof PoundCup) {
                var poundCoerced = this.field;
                try {
                    var val = this.template.calculatedValue;
                    val = JSON.parse(val);
                    poundCoerced.elementValue = String(val);
                    poundCoerced.isRed = false;
                }
                catch (e) {
                    if (e instanceof CodeError) {
                        poundCoerced.elementValue = e;
                        poundCoerced.isRed = true;
                    }
                    else {
                    }
                }
            }
            else if (this.affectsScore) {
                this.score = this.template.isCorrect(this.field.elementValue) ? 1 : 0;
            }
            else {
                this.template.forceCalculate();
            }
        }
        if (this.affectsScore) {
            if (this.score == 1) {
                if (this.notYetChecked || this.image == decisionImageEnum.Star) {
                    this.image = decisionImageEnum.Star;
                }
                else {
                    this.image = decisionImageEnum.Tick;
                }
            }
            else {
                this.image = decisionImageEnum.Cross;
            }
            this.color = this.image == decisionImageEnum.Star ? "LimeGreen" :
                this.image == decisionImageEnum.Tick ? "LightGreen" :
                    this.image == decisionImageEnum.Cross ? "LightSalmon" : "Salmon";
        }
    };
    return Solution;
}());
var TemplateError = (function (_super) {
    __extends(TemplateError, _super);
    function TemplateError(message, paramFeedbackToUser, paramIsCritical) {
        var _this = _super.call(this, message) || this;
        _this.feedbackToUser = paramFeedbackToUser;
        _this.isCritical = paramIsCritical;
        return _this;
    }
    return TemplateError;
}(Error));
var questionTemplate = (function () {
    function questionTemplate(paramText) {
        this._text = paramText;
    }
    Object.defineProperty(questionTemplate.prototype, "calculatedValue", {
        get: function () {
            return this._text;
        },
        enumerable: true,
        configurable: true
    });
    questionTemplate.prototype.isCorrect = function (value) {
        if (value != null && value != undefined) {
            if (helpers.isNumeric(this.calculatedValue)) {
                return (helpers.isNumeric(value) &&
                    Math.abs(value - this.calculatedValue) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * this.calculatedValue));
            }
            return value.toLowerCase().replace("'", "\'") == this.calculatedValue.toLowerCase();
        }
        return false;
    };
    questionTemplate.prototype.forceCalculate = function () {
        var dummy = this.calculatedValue;
    };
    return questionTemplate;
}());
var Template = (function (_super) {
    __extends(Template, _super);
    function Template(paramText, paramAllTemplates, paramRandom, paramIndexForRangeEvaluation, paramCustomFunctions) {
        var _this = _super.call(this, paramText) || this;
        _this.allTemplateComments = paramAllTemplates;
        _this.random = paramRandom;
        _this.indexForListEvaluation = paramIndexForRangeEvaluation;
        _this.customFunctions = paramCustomFunctions;
        _this.overflowCounter = 0;
        _this.OVERFLOW_LIMIT = 1000;
        _this.variablesUsed = [];
        for (var i = 0; i < 26; i++) {
            _this.variablesUsed.push(false);
        }
        _this._calculatedValue = "null";
        _this.errorMessages = [];
        return _this;
    }
    Template.prototype.count = function () {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw new TemplateError("contains an infinite loop", true, true);
        }
    };
    Object.defineProperty(Template.prototype, "calculatedValue", {
        get: function () {
            if (this.errorMessages.length == 0 && this._calculatedValue == "null") {
                var result = "null";
                try {
                    var expr = toExpressionTree(this._text, 0);
                    result = expr.eval(this);
                }
                catch (e) {
                    if (e.isCritical) {
                        if (e.feedbackToUser)
                            this.errorMessages.push(e.message);
                        else
                            throw (e);
                    }
                }
                this._calculatedValue = result;
            }
            return this._calculatedValue;
        },
        enumerable: true,
        configurable: true
    });
    Template.prototype.removeExtraSigFigs = function (number) {
        var ret = (parseFloat(number).toPrecision(12));
        return parseFloat(ret);
    };
    Template.prototype.isCorrect = function (value) {
        if (this.calculatedValue != null) {
            if (helpers.isNumeric(this.calculatedValue)) {
                var n = Number(this.calculatedValue);
                return (helpers.isNumeric(value) &&
                    Math.abs(value - n) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * n));
            }
            return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
        }
        return false;
    };
    return Template;
}(questionTemplate));
//# sourceMappingURL=assignment.js.map