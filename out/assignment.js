const TIME_COLUMN = "Time remaining";
const CHECKS_COLUMN = "Checks remaining";
class AssignmentHTML {
    constructor(settings) {
        this.rowHTMLs = [];
        this.settings = settings;
        this.settings.random = new Random();
        this.settings.shuffleQuestions = (this.settings["shuffle questions"] == true);
        this.settings.truncateMarks = Number(this.settings["mark limit"]);
        this.settings.journalMode = (this.settings["journal mode"] == true);
        this.settings.appendToMarkbook = (this.settings["append mode"] == true);
        this.settings.removeHyperlinks = (this.settings["remove hyperlinks"] == true);
        if (this.settings.responses && CHECKS_COLUMN in this.settings.responses) {
            this.settings.numChecksLeft = Number(this.settings.responses[CHECKS_COLUMN]);
        }
        else {
            this.settings.numChecksLeft = Number(this.settings["checks limit"]);
        }
        if (Number(this.settings["time limit"]) > 0) {
            if (this.settings.responses && this.settings.responses[TIME_COLUMN]) {
                this.settings.timeRemaining = Number(this.settings.responses[TIME_COLUMN]);
            }
            else {
                this.settings.timeRemaining = Number(this.settings["time limit"]);
            }
            this.startTimer();
        }
        if (false) {
            window.onblur = function (paramAsn) {
                var asn = paramAsn;
                return function () {
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
        this.timerInterval = setInterval(function (timeLimit, paramDiv, paramAsn) {
            var asn = paramAsn;
            var countUp = timeLimit == 0;
            var target = new Date().getTime() + 1000 * 60 * timeLimit;
            var div = paramDiv;
            return function () {
                let distance = (target - new Date().getTime()) * (countUp ? -1 : 1);
                let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((distance % (1000 * 60)) / 1000);
                div.innerHTML = hours + "h " + minutes + "m " + seconds + "s ";
                if (minutes < asn.settings.timeRemaining && minutes >= 0) {
                    let scores = {};
                    scores[TIME_COLUMN] = {
                        "value": minutes,
                        "append": false
                    };
                    if (asn.settings.markbookUpdate) {
                        asn.settings.markbookUpdate(scores);
                    }
                }
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
    consumeRowsString(blobString) {
        let seed = undefined;
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
        if (this.settings.numChecksLeft == 0) {
            this.questionHTMLs.forEach(s => s.showDecisionImage());
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
                        this.settings.numChecksLeft == 1 ? ` (${this.settings.numChecksLeft} check remaining)` :
                            ` (${this.settings.numChecksLeft} checks remaining)`;
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
                scoreParagraph.innerHTML = `<h1>FINAL SCORE: ${this.rawCorrect} out of ${this.outOf}</h1>`;
                this.settings.questionsDiv.appendChild(scoreParagraph);
                this.disabled = true;
            }
        }
    }
    addRows(paramRows, index) {
        var newRowHTMLs = [];
        for (let r = 0, row; row = paramRows[r]; r++) {
            let showTitle = true;
            if (newRowHTMLs.length > 0) {
                let previousTitle = newRowHTMLs[newRowHTMLs.length - 1].row.title;
                if (previousTitle == row.title) {
                    showTitle = false;
                }
            }
            let newRowHTML = null;
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
                return function () {
                    asn.deleteRows([row]);
                    asn.updateQuestionNumbers();
                };
            }(this, newRowHTML);
            newRowHTML.duplicateSelf = function (paramAsn, paramRow) {
                var asn = paramAsn;
                var row = paramRow;
                return function () { asn.duplicateRow(row); };
            }(this, newRowHTML);
            newRowHTMLs.push(newRowHTML);
        }
        if (index != undefined && index < this.rowHTMLs.length) {
            var end = this.rowHTMLs.splice(index);
            this.rowHTMLs = this.rowHTMLs.concat(newRowHTMLs).concat(end);
        }
        else {
            this.rowHTMLs = this.rowHTMLs.concat(newRowHTMLs);
        }
        this.refreshDivs();
        this.updateQuestionNumbers();
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
        if (this.settings.revealMode) {
            this.rowHTMLs.forEach(function (r) {
                var sec = document.createElement("section");
                sec.appendChild(r.outerDiv);
                r.settings.questionsDiv.appendChild(sec);
            });
        }
        else {
            this.rowHTMLs.forEach(r => r.settings.questionsDiv.appendChild(r.outerDiv));
        }
        if (this.settings.solutionsDiv) {
            for (var i = 0; i < this.questionHTMLs.length; i++) {
                this.settings.solutionsDiv.appendChild(this.questionHTMLs[i].solutionDiv);
            }
        }
        if (this.settings.jumbledSolutionsDiv) {
            for (var i = 0; i < this.questionHTMLs.length; i++) {
                for (var j = 0; j < this.questionHTMLs[i].jumbleDivs.length; j++) {
                    this.settings.jumbledSolutionsDiv.appendChild(this.questionHTMLs[i].jumbleDivs[j]);
                }
            }
        }
    }
    refresh() {
        this.templateHTMLs.forEach(r => r.refresh());
    }
    deleteRows(TRHTMLs) {
        TRHTMLs.forEach(r => r.delete());
        this.rowHTMLs = this.rowHTMLs.filter(r => !TRHTMLs.includes(r));
    }
    duplicateRow(TRHTML) {
        let index = this.rowHTMLs.indexOf(TRHTML);
        this.addRows([TRHTML.row], index);
        this.updateQuestionNumbers();
    }
    deleteAll() {
        this.rowHTMLs.forEach(r => r.delete(false));
        this.rowHTMLs = [];
    }
    updateQuestionNumbers() {
        this._questionNumbers = [];
        let qn = 1;
        for (let rowHTML of this.questionHTMLs) {
            rowHTML.questionNumber = qn++;
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
            divs.forEach(d => this.settings.jumbledSolutionsDiv.appendChild(d));
        }
    }
    get questionNumbers() {
        return this.questionHTMLs.map(r => r.questionNumbers).reduce((a, b) => a.concat(b), []);
    }
    showAllDecisionImages(showwarning) {
        if (this.settings.numChecksLeft == 1 && showwarning) {
            if (!confirm("This will show your marks, but also prevent you making any further changes. Are you sure?")) {
                return;
            }
        }
        this.questionHTMLs.forEach(s => s.showDecisionImage());
        if (this.settings.numChecksLeft != undefined) {
            this.settings.numChecksLeft--;
            this.settings.numChecksLeft == 1 ? ` (${this.settings.numChecksLeft} check remaining)` :
                ` (${this.settings.numChecksLeft} checks remaining)`;
            var checksLeftText = this.settings.numChecksLeft < 1 ? "" :
                this.settings.numChecksLeft == 1 ? ` (${this.settings.numChecksLeft} check remaining)` :
                    ` (${this.settings.numChecksLeft} checks remaining)`;
            if (this.submitButton) {
                this.submitButton.innerText = this.settings.submitButtonText + checksLeftText;
            }
        }
        let scores = {};
        scores[CHECKS_COLUMN] =
            { "value": this.settings.numChecksLeft,
                "append": false };
        if (this.settings.markbookUpdate) {
            this.settings.markbookUpdate(scores);
        }
        if (this.settings.numChecksLeft == 0) {
            if (this.settings.markbookUpdate) {
                this.settings.markbookUpdate = undefined;
            }
            var scoreParagraph = document.createElement("p");
            scoreParagraph.id = "scoreParagraph";
            scoreParagraph.innerHTML = `<h1>FINAL SCORE: ${this.rawCorrect} out of ${this.outOf}</h1>`;
            if (this.submitButton.parentElement) {
                this.submitButton.parentElement.appendChild(scoreParagraph, this.submitButton);
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
        var css = document.styleSheets[0];
        if (css)
            for (let rule of css.cssRules) {
                styleText += rule.cssText;
            }
        this.previewWindow = window.open("", "preview", "");
        if (this.previewWindow["assignment"]) {
            this.previewWindow["assignment"].deleteAll();
        }
        else {
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
    get questionHTMLs() {
        return this.rowHTMLs.filter(r => r instanceof QuestionHTML);
    }
    get templateHTMLs() {
        return this.rowHTMLs.filter(r => r instanceof TemplateHTML);
    }
    get rawCorrect() {
        return this.questionHTMLs.reduce((a, b) => a + b.correct, 0);
    }
    get rawAttempted() {
        return this.questionHTMLs.reduce((a, b) => a + b.attempted, 0);
    }
    get rawStars() {
        return this.questionHTMLs.reduce((a, b) => a + b.stars, 0);
    }
    get outOf() {
        return this.questionHTMLs.reduce((a, b) => a + b.outOf, 0);
    }
    get aggregateScoreGetter() {
        return function (paramAsn) {
            var asn = paramAsn;
            return function () {
                return {
                    "Correct": { "value": asn.rawCorrect },
                    "Attempted": { "value": asn.rawAttempted },
                    "Stars": { "value": asn.rawStars },
                    "Out of": { "value": asn.outOf }
                };
            };
        }(this);
    }
    shuffle() {
        this.rowHTMLs = helpers.shuffle(this.rowHTMLs, this.settings.random);
        this.refreshDivs();
    }
    truncate(n) {
        if (n == undefined) {
            n = prompt("enter number of marks you want left over", "10");
        }
        let i = 0;
        while (n >= this.questionHTMLs[i].solutions.length && this.questionHTMLs[i]) {
            n -= this.questionHTMLs[i].solutions.length;
            i++;
        }
        let lastQn = this.questionHTMLs[i];
        if (n > 0) {
            for (let j = 0; j < (lastQn.solutions.length - n); j++) {
                lastQn.solutions[lastQn.solutions.length - 1 - j].disabled = true;
            }
        }
        if (n > 0) {
            i++;
        }
        this.deleteRows(this.questionHTMLs.slice(i));
    }
    set disabled(value) {
        this.questionHTMLs.forEach(q => q.disabled = value);
        if (this.submitButton) {
            this.submitButton.disabled = value;
        }
    }
}
class CodeError extends Error {
    constructor(message) {
        super(message);
    }
}
class JSFunction {
    constructor(code, JSName) {
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
    execute(parameters) {
        if (this.error) {
            throw new CodeError(this.error);
        }
        let joinedParameters = parameters.map(a => JSON.stringify(a)).join();
        if (joinedParameters in this.cache) {
            return this.cache[joinedParameters];
        }
        if (this.JSName != "console") {
            this.interpreter.appendCode(`
              ${this.JSName}(${joinedParameters});`);
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
            let arr = [];
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
    }
}
class Cup {
    constructor(str) {
        this.attributes = {};
        this.tagName = "";
        this.str = str;
    }
    get joinedAttributes() {
        let buffer = "";
        for (var key in this.attributes) {
            if (this.attributes.hasOwnProperty(key)) {
                buffer += key + "=\"" + this.attributes[key] + "\" ";
            }
        }
        return buffer;
    }
    onThisAndChildren(action) { action(this); }
    get innerHTML() { return ""; }
    get HTML() { return `<${this.tagName} ${this.joinedAttributes} >${this.innerHTML}</${this.tagName}>`; }
}
class BulletCup extends Cup {
    constructor(str) { super(str); }
    get HTML() { return "<li>"; }
}
class ImageCup extends Cup {
    constructor(str) {
        super(str);
        [, this.comment, this.source,] = str.split(/!\[([^\]]*)]\(([^\)]*)\)/g);
        let commaIndex = this.comment.indexOf(",");
        if (commaIndex != -1)
            this.width = Number(this.comment.substr(commaIndex + 1));
        if (this.width == null || isNaN(this.width))
            this.width = 100;
        this.tagName = "img";
        this.attributes["style"] = `position: relative; left:${(50 - this.width / 2)}%; width:${this.width}%`;
        this.attributes["src"] = this.source;
        this.attributes["alt"] = this.comment;
        this.domain = helpers.getDomainFromUrl(this.source);
    }
    textReplace(patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            return getTemplateValue();
        }
        this.source = this.source.replace(patternMakeItGlobal, replacer);
        this.comment = this.comment.replace(patternMakeItGlobal, replacer);
        this.attributes["src"] = this.source;
        this.attributes["alt"] = this.comment;
        this.domain = helpers.getDomainFromUrl(this.source);
    }
    get HTML() {
        var cite = this.domain == "i.imgur.com" ? "" : `<cite>${this.comment} Digital image taken from <a href=${this.source}>${this.domain}</a>`;
        return `<${this.tagName} ${this.joinedAttributes} >${this.innerHTML}</${this.tagName}>
      ${cite}</cite>.
      `;
    }
}
class AnchorCup extends Cup {
    constructor(str) {
        super(str);
        [, this.text, this.url,] = str.split(/\[([^\]]*)]\(([^\)]*)\)/);
        if (!(this.url.startsWith("http://") || this.url.startsWith("https://")))
            this.url = "https://" + this.url;
        this.tagName = "a";
        this.attributes["href"] = this.url;
        this.attributes["target"] = "_blank";
    }
    get innerHTML() {
        return this.text;
    }
    textReplace(patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            return getTemplateValue();
        }
        this.text = this.text.replace(patternMakeItGlobal, replacer);
        this.url = this.url.replace(patternMakeItGlobal, replacer);
        this.attributes["href"] = this.url;
    }
}
class FractionCup extends Cup {
    constructor(str) {
        super(str);
        let top = "";
        let bottom = "";
        [, top, bottom] = this.str.split(/~\[([^\]]*)\]\(((?:\\\)|[^)])*)\)/);
        this.top = new InnerFractionCup(top.replace("\\", ""));
        this.bottom = new InnerFractionCup(bottom.replace("\\", ""));
    }
    onThisAndChildren(action) {
        action(this);
        this.top.onThisAndChildren(action);
        this.bottom.onThisAndChildren(action);
    }
    replace(pattern, nodeConstructor, confirmReplace) {
        this.top.replace(pattern, nodeConstructor, confirmReplace);
        this.bottom.replace(pattern, nodeConstructor, confirmReplace);
    }
    get HTML() {
        return `<table class="fraction">
<tr><td>${this.top.HTML}</td></tr>
<tr><td>${this.bottom.HTML}</td></tr>
</table>`;
    }
}
class ChunkCup extends Cup {
    constructor(str) {
        super(str);
        this.tagName = "span";
    }
    get thisConstructor() { return (s) => new ChunkCup(s); }
    replace(pattern, nodeConstructor, confirmReplace) {
        let retVal = [];
        for (let n of this.str.split(pattern)) {
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
    }
    textReplace(patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            return getTemplateValue();
        }
        this.str = this.str.replace(patternMakeItGlobal, replacer);
    }
    get innerHTML() {
        return this.str;
    }
}
class UnderlineCup extends ChunkCup {
    constructor(str) {
        super(str.substring(1, str.length - 1));
        this.tagName = "u";
    }
    get thisConstructor() { return (s) => new UnderlineCup(s); }
    ;
}
class BoldCup extends ChunkCup {
    constructor(str) {
        super(str.replace("*", ""));
        this.tagName = "b";
    }
    get thisConstructor() { return (s) => new BoldCup(s); }
    ;
}
class SuperScriptCup extends ChunkCup {
    constructor(str) {
        super(str.replace("^", ""));
        this.tagName = "sup";
    }
    get thisConstructor() { return (s) => new SuperScriptCup(s); }
    ;
}
class SubScriptCup extends ChunkCup {
    constructor(str) {
        super(str.replace("~", ""));
        this.tagName = "sub";
    }
    get thisConstructor() { return (s) => new SubScriptCup(s); }
    ;
}
class TitleCup extends ChunkCup {
    constructor(str) {
        super(str.replace("#", ""));
        this.tagName = "h1";
    }
    get thisConstructor() { return (s) => new TitleCup(s); }
    ;
}
class CupContainer extends Cup {
    constructor(str) {
        super(str);
        this.tagName = "div";
    }
    onThisAndChildren(action) {
        action(this);
        if (this.children != null) {
            this.children.forEach(s => s.onThisAndChildren(action));
        }
    }
    replace(pattern, nodeConstructor, confirmReplace) {
        if (this.children != null) {
            let newChildren = [];
            for (let i = 0, child; child = this.children[i]; i++) {
                if (child.replace != null) {
                    if (child instanceof ChunkCup) {
                        newChildren.push(...child.replace(pattern, nodeConstructor, confirmReplace));
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
    }
    get innerHTML() {
        return this.children.map(c => c.HTML).join("");
    }
}
class RolloverCup extends CupContainer {
    constructor(str) {
        str = helpers.trimChar(str, "?");
        super(str);
        this.attributes["class"] = "rollover";
        this.children = [new ChunkCup(str)];
    }
}
class CodeCup extends CupContainer {
    constructor(str) {
        str = helpers.trimChar(str, "`");
        str = helpers.trimChar(str, "\n");
        super(str);
        this.children = [new ChunkCup(str)];
        this.attributes["class"] = "codeblock";
        this.tagName = "pre";
        this.replace = null;
    }
}
class RelativePositionCup extends CupContainer {
    constructor(str, inPixels) {
        super(str);
        if (inPixels == undefined) {
            inPixels = false;
        }
        let xPosAsString = "";
        let yPosAsString = "";
        let childrenAsString = "";
        [, xPosAsString, yPosAsString, childrenAsString] = this.str.split(/@\[([\-0-9]+),([\-0-9]+)\]\(([^)]*)\)/);
        this.xPos = Number(xPosAsString).toString() + (inPixels ? "px" : "%");
        this.yPos = Number(yPosAsString).toString() + (inPixels ? "px" : "%");
        this.children = [new ChunkCup(childrenAsString)];
        this.attributes["style"] = `position:absolute;left:${this.xPos};top:${this.yPos}`;
    }
}
class InnerFractionCup extends CupContainer {
    constructor(str) {
        super(str);
        this.children = [new ChunkCup(str)];
    }
}
class ParagraphCup extends CupContainer {
    constructor(str) {
        super(str);
        this.children = [new ChunkCup(str)];
    }
    get HTML() {
        return `<br>${this.innerHTML}`;
    }
}
class DivCup extends CupContainer {
    constructor(str) {
        super(str);
        this.children = [new ChunkCup(this.str)];
    }
    set class(value) {
        this.attributes["class"] = value;
    }
    toggleGridlines() {
        this.gridLinesDiv.style.display = (this.gridLinesDiv.style.display == "block") ? "none" : "block";
    }
    get gridLinesDiv() {
        if (this._gridLinesDiv) {
            return this._gridLinesDiv;
        }
        var ret = document.createElement("div");
        ret.className = "gridlinecontainer";
        ret.innerHTML = `
      <div class="hgridline"><p>10%</p></div>
      <div class="hgridline"><p>20%</p></div>
      <div class="hgridline"><p>30%</p></div>
      <div class="hgridline"><p>40%</p></div>
      <div class="hgridline"><p>50%</p></div>
      <div class="hgridline"><p>60%</p></div>
      <div class="hgridline"><p>70%</p></div>
      <div class="hgridline"><p>80%</p></div>
      <div class="hgridline"><p>90%</p></div>
      <div class="hgridline"><p>100%</p></div>
      
      <div class="vgridline"><p>10%</p></div>
      <div class="vgridline"><p>20%</p></div>
      <div class="vgridline"><p>30%</p></div>
      <div class="vgridline"><p>40%</p></div>
      <div class="vgridline"><p>50%</p></div>
      <div class="vgridline"><p>60%</p></div>
      <div class="vgridline"><p>70%</p></div>
      <div class="vgridline"><p>80%</p></div>
      <div class="vgridline"><p>90%</p></div>
      <div class="vgridline"><p>100%</p></div>
  `;
        this._gridLinesDiv = ret;
        this.element.appendChild(ret);
        return ret;
    }
}
class TableCup extends CupContainer {
    constructor(str) {
        super(str);
        this.hasBorder = str.startsWith("|");
        this.tagName = "table";
        this.children = str.split("\n").filter(s => s.length > 0).map(s => new RowCup(s));
        this.attributes["class"] = "markdowntable";
        this.attributes["style"] = this.hasBorder ? "" : "border: none;";
    }
}
class RowCup extends CupContainer {
    constructor(str) {
        super(str);
        this.children = str.split(/(\|[^\|]*)/).filter(s => s.length > 0).map(s => new CellCup(s));
        this.tagName = "tr";
    }
}
class CellCup extends CupContainer {
    constructor(str) {
        super(str);
        this.str = this.str.substring(1);
        this.children = [new ChunkCup(this.str)];
        this.tagName = "td";
    }
}
var decisionImageEnum;
(function (decisionImageEnum) {
    decisionImageEnum[decisionImageEnum["None"] = 0] = "None";
    decisionImageEnum[decisionImageEnum["Star"] = 1] = "Star";
    decisionImageEnum[decisionImageEnum["Cross"] = 2] = "Cross";
    decisionImageEnum[decisionImageEnum["Tick"] = 3] = "Tick";
    decisionImageEnum[decisionImageEnum["Hourglass"] = 4] = "Hourglass";
    decisionImageEnum[decisionImageEnum["Error"] = 5] = "Error";
})(decisionImageEnum || (decisionImageEnum = {}));
class FieldCup extends Cup {
    constructor(str) {
        super(str);
        this.instanceNum = FieldCup.instances.length;
        FieldCup.instances.push(this);
        this._element = { value: "", "disabled": false };
        this.attributes["id"] = `cup${this.instanceNum}`;
        this._decisionImage = decisionImageEnum.None;
    }
    set elementValue(value) {
        this._element.value = value;
    }
    get elementValue() {
        this._element.value = helpers.replaceAll(this._element.value, "x10^", "e");
        return this._element.value;
    }
    setElement(newElement) {
        newElement.value = this._element.value;
        newElement.disabled = this._element.disabled;
        this._element = newElement;
        this._decisionElement = newElement.nextSibling;
        this.decisionImage = this._decisionImage;
    }
    get decisionImageHTML() { return `<img style:"z-index:100;display:none" hidden />`; }
    set disabled(value) {
        this._element.disabled = value;
    }
    get disabled() { return this._element.disabled; }
    set decisionImage(value) {
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
    }
    onResponse() { }
    decisionToDataURL(decision) {
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
    }
}
FieldCup.instances = [];
class RadioSet {
    constructor() {
        this.radioCups = [];
        this.instanceNum = RadioSet.numInstances++;
        this._decisionImage = decisionImageEnum.None;
    }
    set decisionImage(value) {
        this.radioCups.forEach(r => r.decisionImage = decisionImageEnum.None);
        let found = this.radioCups.filter(r => r.elementValue == true);
        if (found.length) {
            found[0].decisionImage = value;
        }
    }
    add(radioCup) {
        this.radioCups.push(radioCup);
        radioCup.onResponse = this._cachedOnResponse;
        radioCup.attributes["name"] = `radioSet${this.instanceNum}`;
    }
    set onResponse(value) {
        this._cachedOnResponse = value;
        this.radioCups.forEach(r => r.onResponse = value);
    }
    get elementValue() {
        let found = this.radioCups.filter(r => r.elementValue);
        if (found.length) {
            return found[0].letter;
        }
        return "";
    }
    set elementValue(value) {
        this.radioCups.forEach(r => r.elementValue = (r.letter == value));
    }
    set disabled(value) { this.radioCups.forEach(r => r.disabled = value); }
    get disabled() { return this.radioCups ? this.radioCups[0].disabled : false; }
}
RadioSet.numInstances = 0;
class RadioCup extends FieldCup {
    constructor(str) {
        super(str);
        this.letter = str[0];
        this.radioCups = [this];
        this._element = { checked: false, "disabled": false };
    }
    get HTML() {
        return this.letter + `.<input type="radio" ${this.joinedAttributes} value="${this.letter}" >${this.decisionImageHTML}`;
    }
    setElement(newElement) {
        super.setElement(newElement);
        newElement.onclick = function (paramCup) {
            let cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    }
    get elementValue() { return this._element.checked; }
    set elementValue(value) { this._element.checked = (value == true); }
}
class TextAreaCup extends FieldCup {
    constructor(str) {
        super(str);
    }
    get HTML() {
        return `<br><textarea ${this.joinedAttributes} rows="10"></textarea>`;
    }
    setElement(newElement) {
        super.setElement(newElement);
        newElement.onblur = function (paramCup) {
            let cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    }
}
class InputCup extends FieldCup {
    constructor(str) {
        super(str);
    }
    get HTML() {
        return `<input size="${this.str.length}" type="text" ${this.joinedAttributes} >${this.decisionImageHTML}`;
    }
    setElement(newElement) {
        super.setElement(newElement);
        newElement.onblur = function (paramCup) {
            let cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    }
}
class ComboCup extends FieldCup {
    constructor(str) {
        super(str);
        this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
    }
    get HTML() {
        let optionHTML = this.options.map(o => `<option value='${o}'>${o}</option>`).join("");
        return `<select ${this.joinedAttributes} >${optionHTML} </select>${this.decisionImageHTML}`;
    }
    setElement(newElement) {
        super.setElement(newElement);
        newElement.onchange = function (paramCup) {
            let cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    }
    textReplace(pattern, getTemplateValue) {
        var replacer = function (match, offset, string) {
            return getTemplateValue();
        };
        this.str = this.str.replace(pattern, replacer);
        this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
    }
}
class CheckBoxCup extends FieldCup {
    constructor(str) {
        super(str);
        this._decisionImage = decisionImageEnum.Hourglass;
    }
    get HTML() {
        return `<span ${this.joinedAttributes} ></span>${this.decisionImageHTML}`;
    }
    setElement(newElement) {
        super.setElement(newElement);
        this._element = { value: "", disabled: false };
    }
    set hoverText(value) {
        this._element.title = value;
    }
    set elementValue(value) {
        if ((value == "✓") || (value == true)) {
            this._element.value = "tick";
        }
        if ((value == "✗") || (value == false)) {
            this._element.value = "cross";
        }
        if (value == "!") {
            this._element.value = "error";
        }
    }
    get elementValue() {
        return this._element.value;
    }
}
class PoundCup extends FieldCup {
    constructor(str) {
        super(str);
        this._element = { checked: false, "disabled": false, "style": { "color": "" } };
    }
    get HTML() {
        return `<span ${this.joinedAttributes} ></span>`;
    }
    setElement(newElement) {
        newElement.style.color = this._element.style.color;
        super.setElement(newElement);
    }
    set elementValue(value) {
        this._element.innerText = value;
    }
    get elementValue() {
        return this._element.innerText;
    }
    showDecisionImage(image) {
    }
    set isRed(value) {
        this._element.style.color = value ? "red" : "";
    }
}
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
    if (ret === "false") {
        return "false";
    }
    if (ret === "true") {
        return "true";
    }
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
function compareobjects(A, B) {
    if (A === undefined || B === undefined) {
        return A === undefined && B === undefined;
    }
    if (A instanceof Array || B instanceof Array) {
        if (A instanceof Array && B instanceof Array) {
            return (A.length == B.length) && A.every(function (e, i) {
                return compareobjects(e, B[i]);
            });
        }
        else {
            return false;
        }
    }
    return A == B;
}
function safeStringify(str) {
    let ret = undefined;
    try {
        let obj = JSON.parse(str);
        ret = JSON.stringify(obj);
    }
    catch (e) {
        ret = `"${str}"`;
    }
    return ret;
}
function JSONtoEval(str) {
    let obj = JSON.parse(str);
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
    let buffer = "";
    for (let i = 0; i < s.length; i++) {
        if (isLowerAlpha(s[i]) &&
            (s.length == 1 || s[i].toLowerCase() != "e" || i == 0 || !helpers.isNumeric(s[i - 1]))) {
            let index = alphaIndex(s[i]);
            if (index < injector.allTemplateComments.length) {
                injector.variablesUsed[index] = true;
                let val = injector.allTemplateComments[index].calculatedValue;
                buffer += JSONtoEval(val);
            }
            else {
                throw new TemplateError(`variable "${s[i]}" does not exist`, true, true);
            }
        }
        else if (s[i] in injector.customFunctions) {
            if (injector.customFunctions[s[i]]) {
                buffer += JSONtoEval(injector.customFunctions[s[i]]);
            }
            else {
                throw new TemplateError(`variable has not yet been defined`, false, false);
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
    let children = [];
    let buffer = "";
    while (i < s.length && s[i] != ")"
        && s[i] != "]"
        && (commaIsTerminator != true || s[i] != ",")
        && (i + 1 >= s.length || !(s[i] == "/" && s[i + 1] == "/"))) {
        if (s[i] == '(') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            let expr = toExpressionTree(s, i + 1);
            children.push(expr);
            i = expr.i;
        }
        else if (s[i] == '[') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            let expr = new ArrayExpression(s, i + 1);
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
            let expr = new QuoteExpression(s, i);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && isAlpha(s[i]) && isAlpha(s[i + 1])) {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            let expr = new FunctionExpression(s, i);
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
class SimpleExpression {
    constructor(children, i) {
        this.children = children;
        this.i = i;
    }
    eval(injector) {
        injector.count();
        if (this.children.length == 1 && typeof (this.children[0]) != "string") {
            return this.children[0].eval(injector);
        }
        let buffer = "";
        for (let i = 0, expr; expr = this.children[i]; i++) {
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
        buffer = helpers.replaceAll(buffer, "\t", "");
        buffer = helpers.replaceAll(buffer, "--", "+");
        var evaluated = eval(buffer);
        return JSON.stringify(evaluated);
    }
}
class QuoteExpression {
    constructor(s, i) {
        i++;
        this.s = "";
        while (i < s.length && s[i] != '"') {
            this.s += s[i];
            i++;
        }
        this.i = i;
    }
    eval(injector) {
        injector.count();
        return `"${this.s}"`;
    }
}
class RangeExpression {
    constructor(firstBuffer, s, i) {
        this.minExpr = firstBuffer;
        this.maxExpr = toExpressionTree(s, i + 2);
        this.i = this.maxExpr.i;
    }
    eval(injector) {
        injector.count();
        let decimalmin = Number(this.minExpr.eval(injector));
        let decimalmax = Number(this.maxExpr.eval(injector));
        let min = Math.ceil(decimalmin);
        let max = Math.floor(decimalmax);
        if (min > max) {
            let tempSwapMinandMax = min;
            min = max;
            max = tempSwapMinandMax;
        }
        let temp = min == max ? min : min + injector.random.next(max - min + 1);
        return JSON.stringify(temp);
    }
}
class ListExpression {
    constructor(firstBuffer, s, i) {
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
                let expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new TemplateError("bad list", true, true);
            }
        }
        this.i = i;
    }
    eval(injector) {
        injector.count();
        let randomIndex = injector.indexForListEvaluation % this.options.length;
        let evaluated = this.options[randomIndex].eval(injector);
        return evaluated;
    }
}
class ArrayExpression {
    constructor(s, i) {
        this.options = [];
        while (i < s.length && s[i] != ']'
            && (i + 1 >= s.length || !(s[i] == "/" && s[i + 1] == "/"))) {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {
                    i++;
                }
                let expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new TemplateError("bad array", true, true);
            }
        }
        this.i = i;
    }
    eval(injector) {
        injector.count();
        let evaluated = "[" + this.options.map(o => o.eval(injector)).join() + "]";
        return evaluated;
    }
}
class FunctionExpression {
    constructor(s, i) {
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
    eval(injector) {
        injector.count();
        if (this.functionName == "if") {
            if (this.list.options[0].eval(injector) == "true") {
                return this.list.options[1].eval(injector);
            }
            else {
                return this.list.options[2].eval(injector);
            }
        }
        let evaluatedParameters = this.list.options.map(function (o) {
            var f = o.eval(injector);
            return JSON.parse(f);
        });
        if (this.functionName == "exponent") {
            let asExponent = evaluatedParameters[0].toExponential();
            let Eindex = asExponent.indexOf('e');
            return JSON.stringify(asExponent.substr(Eindex + 1));
        }
        if (this.functionName == "mantissa") {
            let asExponent = evaluatedParameters[0].toExponential();
            let Eindex = asExponent.indexOf('e');
            return JSON.stringify(asExponent.substr(0, Eindex));
        }
        if (this.functionName == "tostandardform") {
            let ret = evaluatedParameters[0];
            return JSON.stringify(ret.toExponential().replace("e", " x 10^").replace("+", ""));
        }
        if (this.functionName == "includes") {
            var ret = evaluatedParameters[0].toString().includes(evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "maxlength") {
            if (evaluatedParameters[0][0] == '"') {
                return `"${evaluatedParameters[0].substr(1, evaluatedParameters[1])}"`;
            }
            let ret = evaluatedParameters[0].toString().substr(0, evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "padleftzeroes") {
            let ret = evaluatedParameters[0].toString().padStart(evaluatedParameters[1], '0');
            return JSON.stringify(ret);
        }
        if (this.functionName == "padrightzeroes") {
            let str = evaluatedParameters[0].toString();
            if (!str.includes('.'))
                str += '.';
            let ret = str.padEnd(evaluatedParameters[1], '0');
            return JSON.stringify(ret);
        }
        if (this.functionName == "getdigit") {
            let n = evaluatedParameters[0];
            let ret = getDigits(n)[evaluatedParameters[1] - 1];
            return JSON.stringify(ret);
        }
        if (this.functionName == "dayname") {
            let year = evaluatedParameters[0];
            let month = evaluatedParameters[1];
            let date = evaluatedParameters[2];
            let today = new Date(year, month - 1, date);
            let ret = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];
            return JSON.stringify(ret);
        }
        if (this.functionName == "dayofyear") {
            let year = evaluatedParameters[0];
            let month = evaluatedParameters[1];
            let date = evaluatedParameters[2];
            let firstOfYear = new Date(year, 0, 1);
            let today = new Date(year, month - 1, date);
            let ret = Math.round((today.valueOf() - firstOfYear.valueOf()) / 8.64e7 + 1);
            return JSON.stringify(ret);
        }
        if (this.functionName == "abs") {
            let ret = Math.abs(evaluatedParameters[0]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "mean") {
            let sum = evaluatedParameters.reduce(function (acc, val) { return acc + val; });
            let ret = sum / evaluatedParameters.length;
            return JSON.stringify(ret);
        }
        if (this.functionName == "median") {
            evaluatedParameters.sort();
            let l = evaluatedParameters.length;
            let ret = null;
            if (l % 2 == 0) {
                ret = 0.5 * (evaluatedParameters[l / 2 - 1] + evaluatedParameters[l / 2]);
            }
            else {
                ret = evaluatedParameters[(l - 1) / 2];
            }
            return JSON.stringify(ret);
        }
        if (this.functionName == "lowerquartile") {
            evaluatedParameters.sort();
            let l = evaluatedParameters.length;
            let ret = null;
            if (l % 4 == 0) {
                ret = 0.5 * (evaluatedParameters[l / 4 - 1] + evaluatedParameters[l / 4]);
            }
            else {
                ret = evaluatedParameters[Math.floor(l / 4)];
            }
            return JSON.stringify(ret);
        }
        if (this.functionName == "upperquartile") {
            evaluatedParameters.sort();
            let l = evaluatedParameters.length;
            let ret = null;
            if (l % 4 == 0) {
                ret = 0.5 * (evaluatedParameters[3 * l / 4 - 1] + evaluatedParameters[3 * l / 4]);
            }
            else {
                ret = evaluatedParameters[Math.floor(3 * l / 4)];
            }
            return JSON.stringify(ret);
        }
        if (this.functionName == "mode") {
            let freqs = {};
            for (n of evaluatedParameters) {
                if (n in freqs) {
                    freqs[n] += 1;
                }
                else {
                    freqs[n] = 1;
                }
            }
            let bestF = 0;
            let best = -1;
            let ret = null;
            for (var f in freqs) {
                if (freqs[f] > bestF) {
                    bestF = freqs[f];
                    ret = f;
                }
            }
            return JSON.stringify(ret);
        }
        if (this.functionName == "max") {
            let best = evaluatedParameters[0];
            for (var i = 1; i < evaluatedParameters.length; i++) {
                if (evaluatedParameters[i] > best) {
                    best = evaluatedParameters[i];
                }
            }
            return JSON.stringify(best);
        }
        if (this.functionName == "min") {
            let best = evaluatedParameters[0];
            for (var i = 1; i < evaluatedParameters.length; i++) {
                if (evaluatedParameters[i] < best) {
                    best = evaluatedParameters[i];
                }
            }
            return JSON.stringify(best);
        }
        if (this.functionName == "hcf") {
            let ret = hcfMulti(evaluatedParameters);
            return JSON.stringify(ret);
        }
        if (this.functionName == "coprime") {
            let denom = evaluatedParameters[0];
            if (denom < 2) {
                throw new TemplateError("no smaller coprime number exists for " + denom, true, true);
            }
            let guess = injector.random.next(denom - 1) + 1;
            while (HCF(denom, guess) > 1) {
                guess = injector.random.next(denom - 1) + 1;
            }
            return JSON.stringify(guess);
        }
        if (this.functionName == "roundtodp") {
            let mult = Math.pow(10, evaluatedParameters[1]);
            let result = Math.round(evaluatedParameters[0] * mult) / mult;
            return JSON.stringify(result);
        }
        if (this.functionName == "roundtosf") {
            var n = evaluatedParameters[0];
            var d = evaluatedParameters[1];
            ret = roundToSF(n, d);
            return JSON.stringify(ret);
        }
        if (this.functionName == "factorial") {
            let ret = factorial(evaluatedParameters[0]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "includesign") {
            let sign = evaluatedParameters[0] < 0 ? "-" : "+";
            let ret = `"${sign} ${Math.abs(evaluatedParameters[0]).toString()}"`;
            return JSON.stringify(ret);
        }
        if (this.functionName == "includeoppsign") {
            let sign = evaluatedParameters[0] < 0 ? "+ " : "- ";
            let ret = `"${sign} ${Math.abs(evaluatedParameters[0]).toString()}"`;
            return JSON.stringify(ret);
        }
        if (this.functionName == "sind") {
            let ret = Math.sin(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret);
        }
        if (this.functionName == "cosd") {
            let ret = Math.cos(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret);
        }
        if (this.functionName == "tand") {
            let ret = Math.tan(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret);
        }
        if (this.functionName == "asind") {
            let ret = (180 * Math.asin(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret);
        }
        if (this.functionName == "acosd") {
            let ret = (180 * Math.acos(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret);
        }
        if (this.functionName == "atand") {
            let ret = 0;
            if (evaluatedParameters.length == 1) {
                ret = (180 * Math.atan(evaluatedParameters[0]) / Math.PI);
            }
            if (evaluatedParameters.length == 2) {
                ret = (180 * Math.atan(evaluatedParameters[0] / evaluatedParameters[1]) / Math.PI);
                let xIsPos = evaluatedParameters[0] > 0;
                let yIsPos = evaluatedParameters[1] > 0;
                if (xIsPos) {
                    ret += yIsPos ? 0 : 180;
                }
                else {
                    ret += yIsPos ? 360 : 180;
                }
            }
            return JSON.stringify(ret);
        }
        if (this.functionName == "choose") {
            var index = evaluatedParameters[0];
            let ret = evaluatedParameters[index + 1];
            return JSON.stringify(ret);
        }
        if (this.functionName == "countif") {
            var target = evaluatedParameters[0];
            let ret = evaluatedParameters.slice(1).filter(e => e == target).length;
            return JSON.stringify(ret);
        }
        if (this.functionName == "large") {
            var l = evaluatedParameters.length;
            var index2 = l - evaluatedParameters[0];
            let ret = evaluatedParameters.slice(1).sort()[index2];
            return JSON.stringify(ret);
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
            let x = evaluatedParameters[0];
            let N = evaluatedParameters[1];
            let p = evaluatedParameters[2];
            let ret = binomial(x, N, p);
            return JSON.stringify(ret);
        }
        if (this.functionName == "binomialcdf") {
            let x = evaluatedParameters[0];
            let N = evaluatedParameters[1];
            let p = evaluatedParameters[2];
            let ret = 0;
            for (let i = 0; i <= x; i++) {
                ret += binomial(i, N, p);
            }
            return JSON.stringify(ret);
        }
        if (this.functionName == "sgn") {
            let ret = 0;
            if (evaluatedParameters[0] < 0) {
                ret = -1;
            }
            if (evaluatedParameters[0] > 0) {
                ret = 1;
            }
            return JSON.stringify(ret);
            return JSON.stringify(ret);
        }
        if (this.functionName == "lcm") {
            let ret = lcm(evaluatedParameters);
            return JSON.stringify(ret);
        }
        if (this.functionName == "compareobjects") {
            let ret = compareobjects(evaluatedParameters[0], evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "code") {
            let JSName = helpers.stripQuotes(evaluatedParameters[0]);
            injector.customFunctions[JSName] = null;
            let DEFAULTCODE = `function ${JSName}() {

    //your code goes here

    }`;
            if (injector.allSolutions) {
                let thisSolution = injector.allSolutions.filter(s => s.template == injector);
                if (thisSolution.length == 1) {
                    thisSolution[0].triggerCalculateFromLateFunction = false;
                    let code = thisSolution[0].field.elementValue;
                    if (code == "" && JSName != "console") {
                        thisSolution[0].field.elementValue = DEFAULTCODE;
                    }
                    else {
                        if (code != DEFAULTCODE) {
                            injector.customFunctions[JSName] = new JSFunction(code, JSName);
                            injector.allSolutions.filter(s => s.triggerCalculateFromLateFunction).forEach(function (s) {
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
            let JSName = helpers.stripQuotes(evaluatedParameters[0]);
            injector.customFunctions[JSName] = null;
            if (injector.allSolutions == undefined) {
                throw new TemplateError("allSolutions not found on template", false, false);
            }
            let thisSolution = injector.allSolutions.filter(s => s.template == injector);
            if (thisSolution.length != 1) {
                throw new Error("number of matching solutions != 1");
            }
            thisSolution[0].triggerCalculateFromLateFunction = false;
            if (thisSolution[0].field.elementValue) {
                injector.customFunctions[JSName] = safeStringify(thisSolution[0].field.elementValue);
                injector.allSolutions.filter(s => s.triggerCalculateFromLateFunction).forEach(function (s) {
                    s.template._calculatedValue = "null";
                    s.field.onResponse();
                });
            }
            return "null";
        }
        if (injector.customFunctions[this.functionNamePreserveCase] === null) {
            throw new TemplateError(`custom function with name "${this.functionNamePreserveCase}" not defined`, false, false);
        }
        if (typeof (Math[this.functionName]) == "function") {
            let ret = Math[this.functionName](evaluatedParameters[0], evaluatedParameters[1], evaluatedParameters[2]);
            return JSON.stringify(ret);
        }
        return "null";
    }
}
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
        let hash = 5381;
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
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(random.next(i + 1));
            [a[i], a[j]] = [a[j], a[i]];
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
        let ret = [div];
        let list = div.children;
        for (let child of list) {
            ret = ret.concat(descendants(child));
        }
        return ret;
    };
    var getDomainFromUrl = function (url) {
        var a = document.createElement('a');
        a.setAttribute('href', url);
        return a.hostname;
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
        descendants: descendants,
        getDomainFromUrl: getDomainFromUrl
    };
};
var helpers = helpersMaker();
class Random {
    constructor(seed) {
        if (seed == undefined) {
            var now = new Date();
            seed = now.getTime();
        }
        this._seed = seed % 2147483647;
        if (this._seed <= 0)
            this._seed += 2147483646;
    }
    next(limit) {
        if (limit == undefined) {
            limit = 2147483647;
        }
        this._seed = this._seed * 16807 % 2147483647;
        return this._seed % limit;
    }
}
class RowHTML {
    constructor(row, showTitle, settings) {
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
            this.titleDiv.innerHTML = `<h1>${this.row.title}</h1>`;
            this._outerDiv.appendChild(this.titleDiv);
        }
        this._outerDiv.appendChild(this.dynamicDiv);
        if (this.settings.allowRowDelete) {
            let deleteButton = document.createElement("img");
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
            let duplicateButton = document.createElement("img");
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
    get outerDiv() {
        if (!this._cellCups) {
            this.dynamicDiv.innerHTML = this.cellCups.map(c => c.HTML).join("");
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
            let elems = helpers.descendants(this.dynamicDiv);
            for (let el of elems) {
                if (el.id && el.id.substr(0, 3) == "cup") {
                    let cupFound = FieldCup.instances[Number(el.id.substr(3, 99))];
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
    replaceSudokuDollar(arg0, arg1, replaceSudokuDollar) {
        throw new Error("Method not implemented.");
    }
    get cellCups() {
        if (this._cellCups == null) {
            this._cellCups = [];
            let injectorInstance = this.getInjectorInstance();
            for (let markdown of this.row.leftRight) {
                if (markdown) {
                    let cellCup = new DivCup(markdown);
                    cellCup.replace(/(\?{3,}[^\?]*\?{3,})/, (s) => { return new RolloverCup(s); }, null);
                    cellCup.replace(/(`{3,}[^`]*`{3,})/, (s) => { return new CodeCup(s); }, null);
                    cellCup.replace(/(?:^|\n)([\|¦](?:[^\n]|\n\|)*)/, (s) => { return new TableCup(s); }, null);
                    cellCup.replace(/(?:^|\n)(@\[[0-9]+,[0-9]+\]\([^)]*\))/, (s) => { return new RelativePositionCup(s); }, null);
                    cellCup.replace(/(?:^|\n)(\*)/, (s) => { return new BulletCup(s); }, null);
                    cellCup.replace(/(\n[^\n]*)/, (s) => { return new ParagraphCup(s); }, null);
                    cellCup.replace(/(~\[[^\]]*\]\((?:\\\)|[^)])*\))/, (s) => { return new FractionCup(s); }, null);
                    if (this.settings.removeHyperlinks) {
                        cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, (s) => { return new ChunkCup(""); }, null);
                    }
                    else {
                        cellCup.replace(/(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/, (s) => { return new AnchorCup(s); }, null);
                    }
                    cellCup.replace(/(!\[[^\]]*]\([^\)]*\))/, (s) => { return new ImageCup(s); }, null);
                    cellCup.replace(/(_{10,})/, (s) => { return new TextAreaCup(s); }, null);
                    cellCup.replace(/(_{2,9})/, (s) => { return new InputCup(s); }, null);
                    cellCup.replace(/(?:[^\!]|^)(\[\])/, (s) => { return new CheckBoxCup(""); }, null);
                    cellCup.replace(/(££)/, (s) => { return new PoundCup(""); }, null);
                    let replaceRadioInjector = function () {
                        var nextLetter = 'A';
                        return function (letter) {
                            if (letter.length == 2 && (letter[0] == nextLetter || letter[0] == 'A')) {
                                nextLetter = (String.fromCharCode(letter.charCodeAt(0) + 1));
                                return true;
                            }
                            return false;
                        };
                    };
                    cellCup.replace(/(?:^|\s)([A-Z]\.)/, (s) => { return new RadioCup(s); }, replaceRadioInjector());
                    cellCup.replace(/({[^}]+\/[^}]+})/, (s) => { return new ComboCup(s); }, null);
                    if (this.row.purpose == "sudoku") {
                        cellCup.replace(/(\$\$)/, (s) => { return new InputCup("___"); }, this.replaceSudokuDollar);
                    }
                    if (injectorInstance) {
                        cellCup.onThisAndChildren(injectorInstance);
                    }
                    cellCup.replace(/((?:\n|^)#[^\n]+(?:\n|$))/, (s) => { return new TitleCup(s); }, null);
                    cellCup.replace(/(\^[\S]+)/, (s) => { return new SuperScriptCup(s); }, null);
                    cellCup.replace(/(\~[\S]+)/, (s) => { return new SubScriptCup(s); }, null);
                    cellCup.replace(/(\*[^*]+\*)/, (s) => { return new BoldCup(s); }, null);
                    cellCup.replace(/(_[^_]+_)/, (s) => { return new UnderlineCup(s); }, null);
                    if (this.settings.allowGridlines) {
                        let relCounter = function () {
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
                                    let toggleGridlinesButton = document.createElement("img");
                                    toggleGridlinesButton.className = "toggleGridlinesButton hideOnPrint";
                                    toggleGridlinesButton.onclick = (function (ref) {
                                        var r = ref;
                                        return function () { r.forEach(c => c.toggleGridlines()); };
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
    }
    get revealSection() {
        return `<section><section>
            <h1>${this.row.title}</h1>
            <div class="dynamic">${this.dynamicDiv.innerHTML}</div>
        </section></section>`;
    }
}
class QuestionHTML extends RowHTML {
    constructor(row, showTitle, paramSettings) {
        super(row, showTitle, paramSettings);
        this.solutions = [];
        this.questionNumberDiv = document.createElement("p");
        this.questionNumberDiv.className = "questionNumber";
        this.marginDiv.insertBefore(this.questionNumberDiv, this.marginDiv.childNodes[0]);
    }
    delete() {
        super.delete();
        if (this._solutionDiv) {
            this._solutionDiv.parentNode.removeChild(this._solutionDiv);
        }
        if (this._jumbleDivs) {
            this._jumbleDivs.forEach(j => j.parentNode.removeChild(j));
        }
    }
    getInjectorInstance() {
        this.solutions = [];
        return this.injector(this.replacedTemplates(), this.solutions, this.settings);
    }
    get jumbleDivs() {
        if (!this._jumbleDivs) {
            this._jumbleDivs = [];
            for (var i = 0; i < this.solutions.length; i++) {
                var j = document.createElement("div");
                j.className = "jumbleDivs";
                this._jumbleDivs.push(j);
            }
            this.refreshDivs();
        }
        return this._jumbleDivs;
    }
    get solutionDiv() {
        if (!this._solutionDiv) {
            this._solutionDiv = document.createElement("div");
            this._solutionDiv.className = "solutions";
            this.refreshDivs();
        }
        return this._solutionDiv;
    }
    refreshDivs() {
        if (this._solutionDiv) {
            this._solutionDiv.innerHTML = `<p>${this.solutionText}</p>`;
        }
        if (this._jumbleDivs) {
            for (var i = 0, solution; solution = this.solutions[i]; i++) {
                if (solution.affectsScore) {
                    this._jumbleDivs[i].innerHTML = solution.solutionText;
                }
            }
        }
        if (this.questionNumberDiv) {
            this.questionNumberDiv.innerText = `Q${this.questionNumber}.`;
        }
    }
    replacedTemplates() {
        let comments = this.row.comment.split('\n');
        return comments.map(c => new questionTemplate(c));
    }
    set questionNumber(n) {
        for (var i = 0, solution; solution = this.solutions[i]; i++) {
            if (solution.affectsScore) {
                solution.questionNumber = n.toString() + String.fromCharCode(97 + i);
            }
        }
        this._questionNumber = n;
        this.refreshDivs();
    }
    get questionNumber() {
        return this._questionNumber;
    }
    get questionNumbers() {
        return this.solutions.filter(s => s.affectsScore).map(s => s.questionNumber);
    }
    get solutionText() {
        return this.solutions.filter(s => s.affectsScore)
            .map(s => `Q${s.questionNumber}. ${s.solutionText}`).join("<br>");
    }
    injector(paramTemplates, paramSolutions, paramSettings) {
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
                let t = templates[templateIndex++];
                let ret = t.calculatedValue;
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
    }
    set disabled(value) {
        this.solutions.forEach(s => s.disabled = value);
    }
    get revealSection() {
        let solutionPlainText = this.solutions.map((s, i) => String.fromCharCode(97 + i) + ". " + s.solutionText).join("<br>");
        return `<section>
            <section>
            <h1>${this.row.title}</h1>
            <div class="dynamic">${this.dynamicDiv.innerHTML}</div>
            </section>
            <section>${solutionPlainText}</section>
        </section>`;
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
class TemplateHTML extends QuestionHTML {
    constructor(row, showTitle, paramSettings) {
        super(row, showTitle, paramSettings);
        if (this.settings.allowRefresh) {
            let refreshButton = document.createElement("img");
            refreshButton.src = imageData.refresh;
            refreshButton.className = "refreshButton hideOnPrint";
            refreshButton.onclick = (function (ref) { var r = ref; return function () { r.refresh(); }; })(this);
            this.marginDiv.appendChild(refreshButton);
        }
        this.randomForTemplate = paramSettings.random;
    }
    replacedTemplates() {
        let comments = this.row.comment.split('\n');
        let templates = [];
        let paramIndexForRangeEvaluation = this.randomForTemplate.next();
        let customFunctions = {};
        for (var i = 0; i < comments.length; i++) {
            templates.push(new Template(comments[i], templates, this.randomForTemplate, paramIndexForRangeEvaluation, customFunctions));
        }
        templates.forEach(function (t) { if (t)
            t.forceCalculate(); });
        for (var t in templates) {
            for (var e in templates[t].errorMessages) {
                this.errors.push(`Error in line ${t + 1} of comments : ` + templates[t].errorMessages[e]);
            }
        }
        if (this.row.purpose == "sudoku") {
            var numDollars = ((this.row.leftRight.join(" ")).match(/\$\$/g) || []).length;
            var variablesUsed = templates.map(function (t) {
                if (t)
                    return t.variablesUsed;
                let ret = [];
                for (var i = 0; i < 26; i++)
                    ret.push(false);
                return ret;
            });
            for (var i = 0, eqn; eqn = variablesUsed[i]; i++) {
                eqn[i] = true;
            }
            variablesUsed = variablesUsed.map(arr => arr.slice(0, templates.length));
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
    }
    refresh() {
        this._cellCups = null;
        this.dynamicDiv.innerHTML = this.cellCups.map(c => c.HTML).join("");
        this.questionNumber = this._questionNumber;
    }
}
function showVariables(arr, numDollars, paramRandom) {
    var colsToShow = arr[0].map(a => false);
    for (var rowCol = 0; rowCol < arr[0].length; rowCol++) {
        colsToShow[rowCol] = (arr[rowCol].filter(p => p).length == 1)
            && (arr.filter(p => p[rowCol]).length == 1);
    }
    arr = arr.filter(r => r.filter(p => p).length > 1);
    var maxColsToShow = colsToShow.length - arr.length;
    var backupArr = arr.map(row => row.slice());
    var backupColsToShow = colsToShow.slice();
    while (arr.length > 0 || maxColsToShow < colsToShow.filter(p => p).length) {
        if (maxColsToShow < colsToShow.filter(p => p).length) {
            arr = backupArr.map(row => row.slice());
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
        arr.forEach(f => f[colToRemove] = false);
        var rowsWithOneTrue = arr.filter(r => r.filter(p => p).length == 1);
        while (rowsWithOneTrue.length > 0) {
            for (var r = 0; r < rowsWithOneTrue.length; r++) {
                var row2 = rowsWithOneTrue[r];
                var singleCol = row2.indexOf(true);
                arr.forEach(f => f[singleCol] = false);
                arr = arr.filter(r => r.filter(p => p).length > 0);
            }
            rowsWithOneTrue = arr.filter(r => r.filter(p => p).length == 1);
        }
    }
    return colsToShow;
}
const ALLOWABLE_ERROR_FOR_CORRECT_ANSWER = 0.05;
class Solution {
    constructor(field, template, settings, allSolutions) {
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
        this.notYetChecked = true;
        this.notYetAnswered = true;
        field.onResponse = this.onResponseInjector(this);
    }
    importResponses() {
        if (this.settings.responses && this._questionNumber in this.settings.responses) {
            this.settings.showUseCheckButtonMessage = false;
            this.field.elementValue = this.settings.responses[this._questionNumber];
            this.updateScoreAndImage();
            this.notYetChecked = false;
        }
        else {
            if (this.template) {
                this.template.forceCalculate();
            }
        }
    }
    get affectsScore() {
        return !(this.field.disabled || this.template == null ||
            !this.triggerCalculateFromLateFunction || this.field instanceof PoundCup);
    }
    get questionNumber() {
        return this._questionNumber;
    }
    set questionNumber(value) {
        this._questionNumber = value;
        this.importResponses();
    }
    get solutionText() {
        if (this.affectsScore) {
            if (this.field instanceof CheckBoxCup || this.field instanceof PoundCup) {
                return "";
            }
            else {
                if (this.template instanceof Template) {
                    var commentIndex = this.template._text.lastIndexOf("//");
                    var comment = (commentIndex == -1) ? "" : " (" + this.template._text.substring(commentIndex + 2) + ")";
                    return calculatedJSONtoViewable(this.template.calculatedValue) + comment;
                }
                else {
                    return this.template.calculatedValue;
                }
            }
        }
        return "";
    }
    set disabled(value) {
        this.field.disabled = value;
    }
    get stars() {
        if (this.image == decisionImageEnum.Star)
            return 1;
        return 0;
    }
    get attempted() {
        if (this.notYetAnswered || !this.affectsScore)
            return 0;
        return 1;
    }
    get outOf() {
        if (!this.affectsScore)
            return 0;
        return 1;
    }
    showDecisionImage() {
        if (this.field.elementValue != "" && this.affectsScore && this.elementHasChangedSinceLastChecked) {
            this.field.decisionImage = this.image;
            this._lastCheckedElementValue = this.field.elementValue;
            this.notYetChecked = false;
        }
    }
    get elementHasChangedSinceLastChecked() {
        return this.field.elementValue != this._lastCheckedElementValue;
    }
    onResponseInjector(solution) {
        let s = solution;
        return function () {
            if (this.elementValue != null && this.elementValue != "") {
                s.updateScoreAndImage();
                let doAppend = !s.notYetChecked &&
                    s.triggerCalculateFromLateFunction &&
                    s.settings.appendToMarkbook;
                let scores = {};
                scores[s.questionNumber] = {
                    "value": s.field.elementValue,
                    "color": s.color,
                    "append": doAppend
                };
                if (s.settings.markbookUpdate) {
                    s.settings.markbookUpdate(scores);
                }
            }
        };
    }
    updateScoreAndImage() {
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
                let poundCoerced = this.field;
                try {
                    let val = this.template.calculatedValue;
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
        if (this.notYetChecked && this.settings.numChecksLeft < 0) {
            this.showDecisionImage();
        }
        else {
            if (!this.triggerCalculateFromLateFunction && this.settings.showUseCheckButtonMessage !== false) {
                window.alert("To check an answer after the first attempt, you must use the 'check answers button' at the bottom of the page.");
                this.settings.showUseCheckButtonMessage = false;
            }
            if (this.elementHasChangedSinceLastChecked) {
                this.field.decisionImage = decisionImageEnum.Hourglass;
            }
        }
    }
}
class TemplateError extends Error {
    constructor(message, paramFeedbackToUser, paramIsCritical) {
        super(message);
        this.feedbackToUser = paramFeedbackToUser;
        this.isCritical = paramIsCritical;
    }
}
class questionTemplate {
    constructor(paramText) {
        this._text = paramText;
    }
    get calculatedValue() {
        return this._text;
    }
    isCorrect(value) {
        if (value != null && value != undefined) {
            if (helpers.isNumeric(this.calculatedValue)) {
                return (helpers.isNumeric(value) &&
                    Math.abs(value - this.calculatedValue) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * this.calculatedValue));
            }
            return value.toLowerCase().replace("'", "\'") == this.calculatedValue.toLowerCase();
        }
        return false;
    }
    forceCalculate() {
        var dummy = this.calculatedValue;
    }
}
class Template extends questionTemplate {
    constructor(paramText, paramAllTemplates, paramRandom, paramIndexForRangeEvaluation, paramCustomFunctions) {
        super(paramText);
        this.allTemplateComments = paramAllTemplates;
        this.random = paramRandom;
        this.indexForListEvaluation = paramIndexForRangeEvaluation;
        this.customFunctions = paramCustomFunctions;
        this.overflowCounter = 0;
        this.OVERFLOW_LIMIT = 1000;
        this.variablesUsed = [];
        for (let i = 0; i < 26; i++) {
            this.variablesUsed.push(false);
        }
        this._calculatedValue = "null";
        this.errorMessages = [];
    }
    count() {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw new TemplateError("contains an infinite loop", true, true);
        }
    }
    get calculatedValue() {
        if (this.errorMessages.length == 0 && this._calculatedValue == "null") {
            let result = "null";
            try {
                let expr = toExpressionTree(this._text, 0);
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
    }
    removeExtraSigFigs(number) {
        var ret = (parseFloat(number).toPrecision(12));
        return parseFloat(ret);
    }
    isCorrect(value) {
        if (this.calculatedValue != null) {
            if (helpers.isNumeric(this.calculatedValue)) {
                let n = Number(this.calculatedValue);
                return (helpers.isNumeric(value) &&
                    Math.abs(value - n) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * n));
            }
            else {
                if (helpers.isNumeric(helpers.stripQuotes(this.calculatedValue))) {
                    let n = Number(helpers.stripQuotes(this.calculatedValue));
                    if (helpers.isNumeric(value) && value == n) {
                        return true;
                    }
                }
                return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
            }
        }
        return false;
    }
}
//# sourceMappingURL=assignment.js.map