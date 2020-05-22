class ICup {
    constructor(parent, tagName, innerHTML) {
        this._innerText = "";
        this._events = {};
        this.UID = null;
        this.attributes = {};
        this.classes = [];
        this._parent = parent;
        this.tagName = tagName;
        this.UID = helpers.createUID();
        if (parent) {
            if (!(parent instanceof ICup)) {
                throw "bad parent";
            }
            ;
            this.settings = parent.settings;
            window["cupsById"][this.UID] = this;
        }
        if (innerHTML) {
            this._innerText = innerHTML;
        }
        ;
    }
    get outerHTML() {
        return `<${this.tagName} id="${this.UID}" ${this.joinedEvents} ${this.joinedAttributes} ${this.joinedClasses}>${this.innerHTML}</${this.tagName}>`;
    }
    get innerHTML() {
        return this._innerText;
    }
    set innerHTML(value) {
        if (this.getElement(false)) {
            this.getElement(false).innerText = value;
        }
        this._innerText = value;
    }
    get joinedAttributes() {
        let buffer = "";
        for (var key in this.attributes) {
            if (ICup.propertiesNoValue.indexOf(key) != -1) {
                if (this.attributes[key]) {
                    buffer += key + " ";
                }
            }
            else {
                buffer += key + "=\"" + this.attributes[key] + "\" ";
            }
        }
        return buffer;
    }
    get joinedEvents() {
        let buffer = "";
        for (var key in this._events) {
            buffer += ` ${key}="window.cupsById['${this.UID}']._events['${key}'].forEach( e=> e() )" `;
        }
        return buffer;
    }
    get joinedClasses() {
        return this.classes.length > 0 ? `class="${this.classes.join(" ")}" ` : "";
    }
    getAttribute(attName) {
        if (this.getElement(false)) {
            return this._element[attName];
        }
        return this.attributes[attName];
    }
    setAttribute(attName, value) {
        if (this.getElement(false)) {
            if (ICup.propertiesToSet.indexOf(attName) != -1) {
                this._element[attName] = value;
            }
            else {
                this._element.setAttribute(attName, value);
            }
        }
        this.attributes[attName] = value;
        return this;
    }
    addClass(className) {
        if (this.getElement(false)) {
            this._element.classList.add(className);
        }
        if (this.classes.indexOf(className) == -1) {
            this.classes.push(className);
        }
        return this;
    }
    removeClass(className) {
        if (this.getElement(false)) {
            this._element.classList.remove(className);
        }
        helpers.removeFromArray(this.classes, className);
        return this;
    }
    setEvent(eventName, func) {
        if (!(eventName in this._events)) {
            this._events[eventName] = [];
        }
        ;
        if (this.getElement(false)) {
            this._element[eventName] = function (eventArray) {
                var eventArray = eventArray;
                return () => { eventArray.forEach(e => e()); };
            }(this._events[eventName]);
        }
        this._events[eventName].push(func);
    }
    getElement(forceCreate) {
        if (this._element != null) {
            return this._element;
        }
        else {
            this._element = document.getElementById(this.UID);
        }
        if (this._element == null && forceCreate) {
            this._element = document.createElement(this.tagName);
            for (let key in this.attributes) {
                this._element.setAttribute(key, this.attributes[key]);
            }
            for (let c of this.classes) {
                this._element.classList.add(c);
            }
            for (let key in this._events) {
                this._element[key] = () => { this._events[key].forEach(e => e()); };
            }
            this._element.innerHTML = this.innerHTML;
        }
        return this._element;
    }
    detachFromParent() {
        this._parent.detachChildElement(this);
    }
    destroy() {
        if (this.getElement(false)) {
            this._element.remove();
        }
        this._parent.detachChildElement(this);
        if ("destroy" in this._events) {
            this._events["destroy"].forEach(f => f(this));
        }
    }
    onThisAndChildren(action) { action(this); }
}
ICup.propertiesToSet = ["checked", "selected", "value", "disabled", "src"];
ICup.propertiesNoValue = ["checked", "selected", "disabled"];
ICup.cupsById = {};
class Span extends ICup {
    constructor(parent, innerText) { super(parent, "span", innerText); }
}
class AnchorCup extends ICup {
    constructor(parent, url, innerText) {
        super(parent, "a", innerText);
        this.attributes["href"] = url;
        this.attributes["target"] = "_blank";
    }
}
class BreakCup extends ICup {
    constructor(parent) { super(parent, "br"); }
}
class UnderlineCup extends ICup {
    constructor(parent, str) { super(parent, "u", str); }
}
class BoldCup extends ICup {
    constructor(parent, str) { super(parent, "b", str); }
}
class SuperScriptCup extends ICup {
    constructor(parent, str) { super(parent, "sup", str); }
}
class SubScriptCup extends ICup {
    constructor(parent, str) { super(parent, "sub", str); }
}
class HeadingCup extends ICup {
    constructor(parent, str) { super(parent, "h1", str); }
}
class ImageCup extends ICup {
    constructor(parent, src, alt, width) {
        super(parent, "img");
        if (width == undefined || isNaN(width)) {
            width = 100;
        }
        this.attributes["style"] = `position: relative; left:${(50 - width / 2)}%; width:${width}%`;
        this.attributes["src"] = src;
        if (alt) {
            this.attributes["alt"] = alt;
        }
        this.domain = helpers.getDomainFromUrl(src);
    }
    get HTML() {
        var cite = this.domain == "i.imgur.com" ? "" : `<cite>Digital image taken from <a href=${this.attributes["src"]}>${this.domain}</a></cite>`;
        return `<${this.tagName} ${this.joinedAttributes} >${this.innerHTML}</${this.tagName}>${cite}`;
    }
}
class ButtonCup extends ICup {
    constructor(parent, text) {
        super(parent, "button");
        this._innerText = text;
    }
}
class OptionCup extends ICup {
    constructor(parent, value, isSelected) {
        super(parent, "option", value);
        this.attributes["value"] = value;
        this.attributes["selected"] = isSelected;
    }
}
class Container extends ICup {
    constructor(parent, tagName, childNodes) {
        super(parent, tagName);
        this._childNodes = [];
        this._element = null;
        if (childNodes) {
            this._childNodes = childNodes;
        }
        ;
    }
    get innerHTML() {
        let ret = "";
        for (var child of this._childNodes) {
            ret += (typeof (child) == "string") ? child : child.outerHTML;
        }
        return ret;
    }
    set childNodes(value) {
        this._childNodes = value;
    }
    get childrenElementsOnly() {
        return this._childNodes.filter(c => typeof (c) != "string");
    }
    appendChildren(nodes) {
        for (let child of nodes) {
            if (typeof (child) == "string") {
                this.appendChildString(child);
            }
            else {
                this.appendChildElement(child);
            }
        }
        return this;
    }
    appendChildElement(child, after) {
        if (this._childNodes.indexOf(child) != -1) {
            helpers.removeFromArray(this._childNodes, child);
        }
        ;
        if (after && this._childNodes.indexOf(after) < this._childNodes.length - 1) {
            if (this.getElement(false)) {
                let before = this._childNodes[this._childNodes.indexOf(after) + 1];
                this._element.insertBefore(child.getElement(true), before.getElement(true));
            }
            helpers.insertAfter(this._childNodes, after, child);
        }
        else {
            if (this.getElement(false)) {
                this._element.appendChild(child.getElement(true));
            }
            this._childNodes.push(child);
        }
        return this;
    }
    checkChildNodes() {
        if (this._element) {
            for (let child of this._childNodes) {
                if (!(this._element.contains(child.getElement(true)))) {
                    throw ("child not found in parent!");
                }
            }
        }
    }
    appendChildString(child) {
        this._childNodes.push(child);
        this.refresh();
        return this;
    }
    shuffleChildren(random) {
        for (var i = this._childNodes.length - 1; i > 0; i--) {
            this.appendChildElement(this._childNodes[random.next(i)]);
        }
    }
    detachChildElement(child) {
        helpers.removeFromArray(this._childNodes, child);
        this.refresh();
        return this;
    }
    detachChildString(child) {
        helpers.removeFromArray(this._childNodes, child);
        this.refresh();
        return this;
    }
    destroyChildAtIndex(index) {
        let child = this._childNodes[index];
        if (typeof (child) == "string") {
            this.detachChildString(child);
            this.refresh();
        }
        else {
            this.detachChildElement(child);
        }
        return this;
    }
    detachAllChildren() {
        this._childNodes.forEach(c => typeof (c) == "string" ? this.detachChildString(c) : this.detachChildElement(c));
        this._childNodes = [];
        this.refresh();
        return this;
    }
    refresh() {
        if (this.getElement(false)) {
            this._element.innerHTML = this.innerHTML;
        }
        return this;
    }
    destroy() {
        this.childrenElementsOnly.forEach(c => c.destroy());
        super.destroy();
    }
    destroyAllChildren() {
        this.childrenElementsOnly.forEach(c => c.destroy());
        this._childNodes = [];
        this.refresh();
    }
    onThisAndChildren(action) {
        action(this);
        this.childrenElementsOnly.forEach(s => s.onThisAndChildren(action));
    }
    stringToElements(markdown, replacer) {
        let ret = [];
        for (let str of markdown.split(replacer.pattern)) {
            if (str != null && str.length > 0) {
                if (replacer.pattern.test(str)) {
                    let newChild = replacer.nodeConstructorFromMatch(this, str);
                    if (newChild) {
                        ret.push(...newChild);
                    }
                }
                else {
                    ret.push(str);
                }
            }
        }
        return ret;
    }
    replace(replacer) {
        let newChildren = [];
        for (let child of this._childNodes) {
            if (typeof (child) == "string") {
                newChildren.push(...this.stringToElements(child, replacer));
            }
            else if (child.replace) {
                child.replace(replacer);
                newChildren.push(child);
            }
            else {
                newChildren.push(child);
            }
        }
        this._childNodes = newChildren;
    }
}
class FractionCup extends Container {
    constructor(parent, topChildNodes, bottomChildNodes) {
        super(parent, "table");
        this.attributes["class"] = "fraction";
        this.childNodes = ["<tr><td>", ...topChildNodes, "</td></tr><tr><td>", ...bottomChildNodes, "</td></tr>"];
    }
}
class TableCup extends Container {
    constructor(parent, hasBorder, childNodes) {
        super(parent, "table", childNodes);
        this.attributes["class"] = "markdowntable";
        this.attributes["style"] = this.hasBorder ? "" : "border: none;";
        this.replace(TableCup.rowReplacer);
    }
}
TableCup.rowReplacer = {
    "pattern": /(?:^|\n)([^\n]*)/,
    "nodeConstructorFromMatch": (parent, str) => {
        return [new RowCup(parent, [str])];
    }
};
class RowCup extends Container {
    constructor(parent, childNodes) {
        super(parent, "tr", childNodes);
        this.replace(RowCup.cellReplacer);
    }
}
RowCup.cellReplacer = {
    "pattern": /(?:^|[\|¦])([^\|¦]*)/,
    "nodeConstructorFromMatch": (parent, str) => {
        str = helpers.trimChar(str, "|");
        return [new CellCup(parent, [str])];
    }
};
class CellCup extends Container {
    constructor(parent, childNodes) { super(parent, "td", childNodes); }
}
class RolloverCup extends Container {
    constructor(parent, childNodes) { super(parent, "div", childNodes); this.attributes["class"] = "rollover"; }
}
class List extends ICup {
    constructor(parent, childNodes) { super(parent, "li", childNodes); }
}
class CodeCup extends Container {
    constructor(parent, str) {
        let lines = str.split("\n");
        let ret = "";
        for (let i = 0; i < lines.length; i++) {
            if (i == 1) {
                ret += `<span class="tr first-row"><span class="th"></span><code>${lines[i]}</code></span>`;
            }
            else {
                ret += `<span class="tr"><span class="th"></span><code>${lines[i]}</code></span>`;
            }
        }
        super(parent, "pre", [ret]);
        this.attributes["class"] = "code";
        this.replace = null;
    }
}
class RelativePositionCup extends Container {
    constructor(parent, xPos, yPos, childNodes) {
        super(parent, "div", childNodes);
        this.attributes["style"] = `position:absolute;left:${xPos}%;top:${yPos}%`;
        this._parent.addClass("relative");
    }
}
class GridLines extends Container {
    constructor(parent) {
        let childNodes = `
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
        super(parent, "div", [childNodes]);
        this.classes.push("gridlinecontainer");
    }
    toggleVisible() {
        if (this.getElement(false)) {
            let isVisible = this._element.style.display == "block";
            this._element.style.display = isVisible ? "none" : "block";
        }
    }
}
class Assignment extends Container {
    constructor(div, settingsObj) {
        super(null, "div");
        this.questionLogics = [];
        this._element = div;
        this.settings = settingsObj;
        this.settings.assignment = this;
        if (this.settings.title)
            window.document.title = this.settings.title;
        this.questionsDiv = new Container(this, "div").addClass("questionsDiv");
        if (!this.settings.presentMode) {
            this.solutionsDiv = new Container(this, "div").addClass("solutionsDiv");
        }
        if (this.settings.questionJSON) {
            var rows = JSON.parse(this.settings.questionJSON);
            this.addRowsFromData(rows);
        }
        if (this.settings.shuffleQuestions) {
            this.shuffle(false);
        }
        if (this.settings.truncateMarks > 0) {
            this.truncate(this.settings.truncateMarks);
        }
        if (this.settings.presentMode) {
            this._childNodes = [this.questionsDiv];
            this.questionsDiv.addClass("slides");
            this.getElement(true).classList.add("reveal");
            this.refresh();
            window["Reveal"].initialize({ transition: 'linear' });
        }
        else {
            this.submitButtonAndFinalScoreLogic = new SubmitButtonAndFinalScoreLogic(this.settings);
            this.submitButtonDiv = this.submitButtonAndFinalScoreLogic.createDiv(this);
            this._childNodes = [];
            if (this.settings.title)
                this._childNodes.push(new HeadingCup(this, this.settings.title));
            this._childNodes.push(this.questionsDiv, this.submitButtonDiv);
            if (this.solutionsDiv) {
                this._childNodes.push(new HeadingCup(this, "solutions"));
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
    addRowsFromData(rowData) {
        for (var row of rowData) {
            let QL = new QuestionLogic(row, this.settings);
            let QD = QL.createQuestionDiv(this.questionsDiv);
            this.questionsDiv.appendChildElement(QD);
            let SD = QL.createSolutionDiv(this.solutionsDiv);
            this.solutionsDiv.appendChildElement(SD);
            this.questionLogics.push(QL);
        }
    }
    duplicateRow(QL) {
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
            helpers.shuffleInPlace(QuestionNumberLogic.instances, new Random(seed));
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
            n = prompt("enter number of marks you want left over", "10");
        }
        let i = 0;
        while (this.questionLogics[i] && n >= helpers.lengthOfObject(this.questionLogics[i].commentLogic.scoreLogicsWithCommentLetters)) {
            n -= helpers.lengthOfObject(this.questionLogics[i].commentLogic.scoreLogicsWithCommentLetters);
            i++;
        }
        let lastQn = this.questionLogics[i];
        if (lastQn) {
            let scoreLogics = helpers.getValuesFromObject(lastQn.commentLogic.scoreLogicsWithCommentLetters);
            if (n > 0) {
                lastQn.commentLogic.truncate(scoreLogics.length - n);
            }
            if (n > 0) {
                i++;
            }
            this.questionLogics.slice(i).forEach(ql => ql.destroy());
        }
    }
    regenerateAllQuestions() {
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
    get questionNumbers() {
        return this.questionLogics.reduce((a, b) => a.concat(b.questionNumbers), []);
    }
    get currentQuestionData() {
        return this.questionLogics.map(ql => ql.rowData);
    }
}
class JSFunction {
    constructor(code, JSName) {
        try {
            this.interpreter = new Interpreter(code);
        }
        catch (e) {
            throw new ExpressionError("Error: Bad code. \n Detail:  " + e.message, true, false);
        }
        this.code = code;
        this.JSName = JSName;
        this.cache = {};
    }
    execute(parameters) {
        let joinedParameters = parameters.map(a => JSON.stringify(a)).join();
        if (joinedParameters in this.cache) {
            return this.cache[joinedParameters];
        }
        if (this.JSName != "console") {
            this.interpreter.appendCode(`
              ${this.JSName}(${joinedParameters});`);
        }
        var i = 100000;
        try {
            while (i-- && this.interpreter.step()) {
            }
        }
        catch (e) {
            throw new ExpressionError("Error:code did not execute completely\n Detail:  " + e.message, true, false);
        }
        if (i == -1) {
            throw new ExpressionError("Error: Code contains an infinite loop", true, false);
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
    static generateDefaultCode(functionName) {
        if (functionName == "console") {
            return "";
        }
        return `function ${functionName}() {

//your code goes here
        
}`;
    }
}
function trimAfterDoubleSlash(comment) {
    let indexOfDoubleSlash = comment.indexOf("//");
    if (indexOfDoubleSlash != -1) {
        comment = comment.substr(0, indexOfDoubleSlash);
    }
    return comment;
}
const ALLOWABLE_ERROR_FOR_CORRECT_ANSWER = 0.05;
class CommentLogic {
    constructor(comment, valueFields, purpose, questionLogic) {
        this.solutionLines = {};
        this.solutionValueSpans = {};
        this.inputsWithCommentLetters = {};
        this.dollarCupsWithCommentLetters = {};
        this.checkBoxesWithCommentLetters = {};
        this.scoreLogicsWithCommentLetters = {};
        this.jsFunctionNamesWithCommentLetters = {};
        this.pastInputValuesWithLetters = {};
        this.questionLogic = questionLogic;
        this.settings = questionLogic.settings;
        CommentLogic.instances.push(this);
        this.seed = this.settings.random.next();
        let commentsWithLetters = {};
        let variableNamesWithCommentLetters = {};
        if (purpose != "template" && purpose != "sudoku") {
            this.engine = new SimpleEngine(comment);
        }
        else {
            let splitComments = comment.split("\n");
            for (let i = 0; i < splitComments.length; i++) {
                let c = splitComments[i];
                let codeMatches = c.match(/code\(\"([\S]+)\"\)/);
                let variableMatches = c.match(/variable\(\"([\S]+)\"\)/);
                let commentLetter = helpers.lowerCaseLetterFromIndex(i);
                if (codeMatches) {
                    this.jsFunctionNamesWithCommentLetters[commentLetter] = codeMatches[1].toLowerCase();
                }
                else if (variableMatches) {
                    variableNamesWithCommentLetters[commentLetter] = variableMatches[1];
                }
                else {
                    commentsWithLetters[commentLetter] = c;
                }
                this.engine = new ExpressionEngine(commentsWithLetters, this.jsFunctionNamesWithCommentLetters, variableNamesWithCommentLetters);
            }
        }
        if (purpose == "sudoku") {
            let variablesToKeepAsDollars = (this.engine.variablesToKeepAsDollars(this.seed));
            for (let i = 0; i < variablesToKeepAsDollars.length; i++) {
                if (!variablesToKeepAsDollars[i]) {
                    valueFields[i] = valueFields[i].swapForInput();
                }
            }
        }
        for (let i = 0; i < valueFields.length; i++) {
            let v = valueFields[i];
            let commentLetter = helpers.lowerCaseLetterFromIndex(i);
            if (v instanceof ComboCup ||
                v instanceof InputCup ||
                v instanceof TextAreaCup ||
                v instanceof RadioSet) {
                this.inputsWithCommentLetters[commentLetter] = v;
                if (this.settings.sheetManager) {
                    if (commentLetter in this.jsFunctionNamesWithCommentLetters) {
                        this.settings.sheetManager.registerField(v, this.questionLogic.rowData.title, this.jsFunctionNamesWithCommentLetters[commentLetter]);
                    }
                    else if (commentLetter in variableNamesWithCommentLetters) {
                    }
                    else {
                        let columnHeaderFirstPart = helpers.IsStringNullOrWhiteSpace(this.questionLogic.rowData.title) ? this.questionLogic.questionNumberLogic.number.toString() : this.questionLogic.rowData.title;
                        this.settings.sheetManager.registerField(v, columnHeaderFirstPart);
                    }
                }
            }
            if (v instanceof CheckBoxCup) {
                this.checkBoxesWithCommentLetters[commentLetter] = v;
                if (this.settings.sheetManager) {
                    this.settings.sheetManager.registerField(v, this.questionLogic.rowData.title);
                }
            }
            if (v instanceof DollarCup) {
                this.dollarCupsWithCommentLetters[commentLetter] = v;
            }
            if (v instanceof ComboCup ||
                v instanceof InputCup ||
                v instanceof TextAreaCup ||
                v instanceof CheckBoxCup ||
                v instanceof RadioSet) {
                if (commentLetter in this.jsFunctionNamesWithCommentLetters) {
                    v.setValue(JSFunction.generateDefaultCode(this.jsFunctionNamesWithCommentLetters[commentLetter]));
                }
                else if (commentLetter in variableNamesWithCommentLetters) {
                }
                else {
                    this.scoreLogicsWithCommentLetters[commentLetter] = new ScoreLogic(v, this.settings, questionLogic.questionDiv);
                }
            }
        }
        for (let d of valueFields) {
            if (d instanceof ComboCup ||
                d instanceof InputCup ||
                d instanceof TextAreaCup ||
                d instanceof RadioSet) {
                d.setOnClickAway(function (commentLogic, field) {
                    var commentLogic = commentLogic;
                    var field = field;
                    var prevValue = field.getValue();
                    return () => {
                        if (field.getValue() && prevValue != field.getValue()) {
                            prevValue = field.getValue();
                            commentLogic.onResponseFieldClickAway();
                        }
                    };
                }(this, d));
            }
        }
        let inputValues = this.getInputValues();
        let outputValues = this.calculate(inputValues);
        if (outputValues) {
            this.updateDollars(outputValues);
            this.sendToScoreLogics(inputValues, outputValues);
            this.pastInputValuesWithLetters = inputValues;
        }
    }
    generateNewDollars() {
        this.seed = new Random(this.seed).next();
        let outputValues = this.calculate(this.getInputValues());
        if (outputValues) {
            this.updateDollars(outputValues);
            for (let key in this.solutionValueSpans) {
                if (key in outputValues && outputValues[key]) {
                    this.solutionValueSpans[key].innerHTML = outputValues[key];
                }
            }
        }
    }
    fieldHasChanged(letter) {
        return this.pastInputValuesWithLetters[letter] != this.getInputValues()[letter];
    }
    onResponseFieldClickAway() {
        let inputValues = this.getInputValues();
        let outputValues = this.calculate(inputValues);
        if (outputValues) {
            this.updateDollars(outputValues);
            this.sendToScoreLogics(inputValues, outputValues);
            if (this.settings.sheetManager) {
                this.sendToSheetManager(inputValues);
            }
            this.pastInputValuesWithLetters = inputValues;
        }
    }
    sendToScoreLogics(inputValues, outputValues) {
        for (let letter in this.inputsWithCommentLetters) {
            if (!helpers.IsStringNullOrWhiteSpace(inputValues[letter]) && this.fieldHasChanged(letter)) {
                if (letter in this.scoreLogicsWithCommentLetters && letter in outputValues) {
                    let isCorrect = this.internalIsCorrect(inputValues[letter], outputValues[letter]);
                    this.scoreLogicsWithCommentLetters[letter].setCorrect(isCorrect);
                }
            }
        }
        for (let key in this.checkBoxesWithCommentLetters) {
            if (key in outputValues) {
                this.scoreLogicsWithCommentLetters[key].setCorrect(outputValues[key] == "true");
            }
        }
    }
    sendToSheetManager(inputValues) {
        for (let letter in inputValues) {
            if (!helpers.IsStringNullOrWhiteSpace(inputValues[letter]) && this.fieldHasChanged(letter)) {
                if (this.settings.sheetManager) {
                    this.settings.sheetManager.addFieldToSendBuffer(this.inputsWithCommentLetters[letter], this.scoreLogicsWithCommentLetters[letter]);
                }
            }
        }
        for (let key in this.checkBoxesWithCommentLetters) {
            if (this.settings.sheetManager) {
                this.settings.sheetManager.addFieldToSendBuffer(this.checkBoxesWithCommentLetters[key], this.scoreLogicsWithCommentLetters[key]);
            }
        }
        this.settings.sheetManager.attemptToSend();
    }
    updateDollars(outputValues) {
        for (let key in this.dollarCupsWithCommentLetters) {
            if (key in outputValues) {
                this.dollarCupsWithCommentLetters[key].setValue(outputValues[key]);
            }
        }
    }
    getInputValues() {
        let ret = {};
        for (let key in this.inputsWithCommentLetters) {
            ret[key] = this.inputsWithCommentLetters[key].getValue();
        }
        return ret;
    }
    calculate(inputValues) {
        let outputs = null;
        try {
            outputs = this.engine.calculate(inputValues, this.seed);
        }
        catch (e) {
            if (e instanceof ExpressionError && e.isCritical) {
                this.questionLogic.questionDiv.contentDiv.destroyAllChildren();
                this.questionLogic.questionDiv.contentDiv.appendChildString(`There is an error in this question's comment cell which is preventing it from calculating the solutions.\n Error detail: ${e.message}`);
                this.questionLogic.questionDiv.contentDiv.addClass("red");
                return null;
            }
        }
        this.questionLogic.questionDiv.contentDiv.removeClass("red");
        for (let letter in this.inputsWithCommentLetters) {
            this.inputsWithCommentLetters[letter].resetError();
        }
        for (let letter in this.checkBoxesWithCommentLetters) {
            this.checkBoxesWithCommentLetters[letter].resetError();
        }
        for (let letter in this.dollarCupsWithCommentLetters) {
            this.dollarCupsWithCommentLetters[letter].resetError();
        }
        for (let letter in outputs) {
            if (letter in this.inputsWithCommentLetters &&
                outputs[letter] instanceof ExpressionError) {
                this.inputsWithCommentLetters[letter].setErrorText(outputs[letter].message);
                outputs[letter] = "";
            }
            if (letter in this.checkBoxesWithCommentLetters &&
                outputs[letter] instanceof ExpressionError) {
                this.checkBoxesWithCommentLetters[letter].setErrorText(outputs[letter].message);
                outputs[letter] = "";
            }
            if (letter in this.dollarCupsWithCommentLetters &&
                outputs[letter] instanceof ExpressionError) {
                this.dollarCupsWithCommentLetters[letter].setErrorText(outputs[letter].message);
                outputs[letter] = "";
            }
        }
        return outputs;
    }
    createAndAppendSolutions(parent, questionNumberLogic) {
        let outputValues = this.calculate(this.getInputValues());
        if (outputValues) {
            let ret = [];
            let i = 0;
            for (var letter in this.scoreLogicsWithCommentLetters) {
                if (letter in outputValues) {
                    let solutionLine = new Container(parent, "div");
                    solutionLine.appendChildElement(questionNumberLogic.createSpan(solutionLine));
                    solutionLine.appendChildString(helpers.lowerCaseLetterFromIndex(i) + ". ");
                    let solutionValue = new Span(solutionLine, outputValues[letter]);
                    solutionLine.appendChildElement(solutionValue);
                    parent.appendChildElement(solutionLine);
                    i++;
                    this.solutionLines[letter] = solutionLine;
                    this.solutionValueSpans[letter] = solutionValue;
                }
            }
        }
    }
    truncate(n) {
        let letters = helpers.getKeysFromObject(this.scoreLogicsWithCommentLetters);
        let i = letters.length - 1;
        while (n > 0) {
            let letter = letters[i];
            this.scoreLogicsWithCommentLetters[letter].setImageField.destroy();
            this.scoreLogicsWithCommentLetters[letter].destroy();
            this.solutionLines[letter].destroy();
            n--;
            i--;
        }
    }
    disable() {
        helpers.getValuesFromObject(this.inputsWithCommentLetters).forEach(i => i.setAttribute("disabled", true));
    }
    internalIsCorrect(value, correctAnswer) {
        if (helpers.isNumeric(correctAnswer)) {
            if (correctAnswer % 1 == 0) {
                return this.isCorrectExact(value, correctAnswer);
            }
            else {
                return this.isCorrectWithin5Percent(value, correctAnswer);
            }
        }
        else {
            return this.isCorrectString(value, correctAnswer);
        }
    }
    isCorrectWithin5Percent(value, correctAnswer) {
        return Math.abs(value - correctAnswer) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * correctAnswer);
    }
    isCorrectString(value, correctAnswer) {
        return value.toLowerCase().replace("'", "\'") == correctAnswer.toLowerCase();
    }
    isCorrectExact(value, correctAnswer) {
        return value == correctAnswer;
    }
    destroy() {
        for (let key in this.scoreLogicsWithCommentLetters) {
            this.scoreLogicsWithCommentLetters[key].destroy();
        }
        helpers.removeFromArray(CommentLogic.instances, this);
    }
    get numAbleScoreLogics() {
        return helpers.getValuesFromObject(this.scoreLogicsWithCommentLetters).length;
    }
}
CommentLogic.instances = [];
class ContentDiv extends Container {
    constructor(parent, questionTitleLogic, leftRightMarkdown) {
        super(parent, "div");
        this.gridlines = [];
        this.classes.push("content");
        this.questionTitle = questionTitleLogic.createTitle(this);
        this.appendChildElement(this.questionTitle);
        let leftRightContents = [];
        for (let c of leftRightMarkdown) {
            if (!helpers.IsStringNullOrWhiteSpace(c)) {
                let div = new Container(this, "div", [c]);
                this.appendChildElement(div);
                leftRightContents.push(div);
            }
        }
        if (leftRightContents.length == 1) {
            leftRightContents[0].addClass("fullWidth");
        }
        if (leftRightContents.length == 2) {
            leftRightContents[0].addClass("leftHalfWidth");
            leftRightContents[1].addClass("rightHalfWidth");
        }
        for (let replacer of ContentDiv.replacers) {
            this.replace(replacer);
        }
        if (this.settings.allowGridlines) {
            for (let c of this._childNodes) {
                if (c._childNodes.some(d => d instanceof RelativePositionCup)) {
                    let gridLineDiv = new GridLines(c);
                    c.addClass("relative");
                    c.appendChildElement(gridLineDiv);
                    this.gridlines.push(gridLineDiv);
                }
            }
        }
        let descendants = helpers.getDescendants(this);
        var currentRadioSet = null;
        this.setValueFields = [];
        for (let d of descendants) {
            if (d instanceof ComboCup ||
                d instanceof InputCup ||
                d instanceof TextAreaCup ||
                d instanceof CheckBoxCup ||
                d instanceof DollarCup) {
                this.setValueFields.push(d);
            }
            else if (d instanceof RadioCup) {
                if (currentRadioSet) {
                    if (!currentRadioSet.letterComesAfterLastInSet(d.letter)) {
                        currentRadioSet = new RadioSet();
                    }
                    currentRadioSet.addRadioCup(d);
                }
                else {
                    currentRadioSet = new RadioSet();
                    this.setValueFields.push(currentRadioSet);
                    currentRadioSet.addRadioCup(d);
                }
            }
        }
    }
    toggleGridlines() { this.gridlines.forEach(g => g.toggleVisible()); }
}
ContentDiv.replacers = [
    {
        "pattern": /(\?{3,}[^\?]*\?{3,})/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "?");
            return [new RolloverCup(parent, [str])];
        }
    },
    {
        "pattern": /(\`{3,}[^\?]*\`{3,})/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "`");
            return [new CodeCup(parent, str)];
        }
    },
    {
        "pattern": /((?:^|\n)[\|¦](?:[^\n]|\n\|)*)/,
        "nodeConstructorFromMatch": (parent, str) => {
            let hasBorder = str.startsWith("|");
            return [new TableCup(parent, hasBorder, [str])];
        },
    },
    {
        "pattern": /(?:^|\n)(@\[[0-9]+,[0-9]+\]\([^)]*\))/,
        "nodeConstructorFromMatch": (parent, str) => {
            let xPosAsString = "";
            let yPosAsString = "";
            let childrenAsString = "";
            [, xPosAsString, yPosAsString, childrenAsString] = str.split(/@\[([\-0-9]+),([\-0-9]+)\]\(([^)]*)\)/);
            return [new RelativePositionCup(parent, xPosAsString, yPosAsString, [childrenAsString])];
        },
    },
    {
        "pattern": /(?:^|\n)(\*[^\n]*)/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "*");
            return [new List(parent, [str])];
        },
    },
    {
        "pattern": /(\n)/,
        "nodeConstructorFromMatch": (parent, str) => {
            return [new BreakCup(parent)];
        },
    },
    {
        "pattern": /(~\[[^\]]*\]\((?:\\\)|[^)])*\))/,
        "nodeConstructorFromMatch": (parent, str) => {
            let top = "";
            let bottom = "";
            [, top, bottom] = str.split(/~\[([^\]]*)\]\(((?:\\\)|[^)])*)\)/);
            return [new FractionCup(parent, [top], [bottom])];
        },
    },
    {
        "pattern": /(\$\$)/,
        "nodeConstructorFromMatch": (parent, str) => {
            let span = new Span(parent, "");
            return [new DollarCup(parent, span), span];
        },
    },
    {
        "pattern": /(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/,
        "nodeConstructorFromMatch": (parent, str) => {
            let text = "";
            let url = "";
            [, text, url,] = str.split(/\[([^\]]*)]\(([^\)]*)\)/);
            if (!(url.startsWith("http://") || url.startsWith("https://"))) {
                url = "https://" + url;
            }
            return parent.settings.removeHyperlinks ? null : [new AnchorCup(parent, url, text)];
        },
    },
    {
        "pattern": /(!\[[^\]]*]\([^\)]*\))/,
        "nodeConstructorFromMatch": (parent, str) => {
            let comment = "";
            let source = "";
            [, comment, source,] = str.split(/!\[([^\]]*)]\(([^\)]*)\)/g);
            let commaIndex = comment.indexOf(",");
            let width = (commaIndex != -1) ? Number(comment.substr(commaIndex + 1)) : undefined;
            return [new ImageCup(parent, source, comment, width)];
        },
    },
    {
        "pattern": /(_{10,})/,
        "nodeConstructorFromMatch": (parent, str) => {
            let decisionImage = new Icon(parent, IconName.none);
            let span = new Span(parent, "");
            return [new TextAreaCup(parent, decisionImage, span), new BreakCup(parent), decisionImage, span];
        },
    },
    {
        "pattern": /(_{2,9})/,
        "nodeConstructorFromMatch": (parent, str) => {
            let decisionImage = new Icon(parent, IconName.none);
            let size = str.length;
            let span = new Span(parent, "");
            return [new InputCup(parent, size, decisionImage, span), decisionImage, span];
        },
    },
    {
        "pattern": /(?:[^\!]|^)(\[\])/,
        "nodeConstructorFromMatch": (parent, str) => {
            let span = new Span(parent, "");
            return [new CheckBoxCup(parent, IconName.hourglass, span), span];
        },
    },
    {
        "pattern": /(?:^|\s)([A-Z]\.)/,
        "nodeConstructorFromMatch": (parent, str) => {
            let decisionImage = new Icon(parent, IconName.none);
            let span = new Span(parent, "");
            return [new RadioCup(parent, str[0], decisionImage, span), decisionImage, span];
        },
    },
    {
        "pattern": /({[^}]+})/,
        "nodeConstructorFromMatch": (parent, str) => {
            let decisionImage = new Icon(parent, IconName.none);
            str = helpers.trimChar(str, "{");
            str = helpers.trimChar(str, "}");
            let span = new Span(parent, "");
            return [new ComboCup(parent, [" ", str], decisionImage, span), decisionImage, span];
        },
    },
    {
        "pattern": /((?:\n|^)#[^\n]+)/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "#");
            return [new HeadingCup(parent, str)];
        },
    },
    {
        "pattern": /(\^[\S]+)/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "^");
            return [new SuperScriptCup(parent, str)];
        },
    },
    {
        "pattern": /(\~[\S]+)/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "~");
            return [new SubScriptCup(parent, str)];
        },
    },
    {
        "pattern": /(\*[^*]+\*)/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "*");
            return [new BoldCup(parent, str)];
        },
    },
    {
        "pattern": /(_[^_]+_)/,
        "nodeConstructorFromMatch": (parent, str) => {
            return [new UnderlineCup(parent, str)];
        }
    }
];
class ExpressionError extends Error {
    constructor(message, paramFeedbackToUser, paramIsCritical) {
        super(message);
        this.feedbackToUser = paramFeedbackToUser;
        this.isCritical = paramIsCritical;
    }
}
class IExpression {
    constructor(i) {
        this.variablesUsed = {};
        this.i = i;
        for (let j = 0; j < 26; j++) {
            this.variablesUsed[helpers.lowerCaseLetterFromIndex(j)] = false;
        }
    }
    getValue(injector) {
        if (this._value == undefined) {
            this._value = this.eval(injector);
        }
        return this._value;
    }
    replaceVariables(s, injector) {
        let buffer = "";
        for (let i = 0; i < s.length; i++) {
            if (isAlpha(s[i]) &&
                (s.length == 1 || s[i].toLowerCase() != "e" || i == 0 || !helpers.isNumeric(s[i - 1]))) {
                if (s[i] in injector.allVariablesAndFunctions) {
                    this.variablesUsed[s[i]] = true;
                    let val = injector.allVariablesAndFunctions[s[i]];
                    if (val instanceof IExpression) {
                        buffer += JSONtoEval(val.getValue(injector));
                    }
                    else if (typeof (val) == "string") {
                        buffer += JSONtoEval(val);
                    }
                    else if (val == undefined) {
                        throw new ExpressionError(`variable "${s[i]}" is undefined`, true, false);
                    }
                    else {
                        throw new ExpressionError(`variable "${s[i]}" not found`, true, true);
                    }
                }
                else {
                    throw new ExpressionError(`variable "${s[i]}" not found`, true, true);
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
function JSONtoViewable(ret) {
    if (ret == undefined) {
        return "undefined";
    }
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
            return helpers.removeCrazySigFigs(ret);
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
function JSONtoEval(str) {
    if (str == "" || str == undefined) {
        return "null";
    }
    let obj = undefined;
    try {
        obj = JSON.parse(str);
    }
    catch (e) {
        throw new ExpressionError("unable to parse JSON: " + str, true, false);
    }
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
                throw new ExpressionError("Range expression missing something before ..", true, true);
            }
            children.push(buffer);
            return new RangeExpression(new SimpleExpression(children, i), s, i);
        }
        else if (s[i] == ",") {
            if (buffer.length + children.length == 0) {
                throw new ExpressionError("List expression missing something before ,", true, true);
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
class SimpleExpression extends IExpression {
    constructor(children, i) {
        super(i);
        this.children = children;
    }
    eval(injector) {
        injector.count();
        if (this.children.length == 1 && typeof (this.children[0]) != "string") {
            return this.children[0].eval(injector);
        }
        let buffer = "";
        for (let i = 0, expr; expr = this.children[i]; i++) {
            if (typeof (expr) == "string") {
                buffer += this.replaceVariables(expr, injector);
            }
            else {
                buffer += JSONtoEval(expr.eval(injector));
            }
        }
        ;
        if (helpers.IsStringNullOrWhiteSpace(buffer)) {
            return "";
        }
        buffer = helpers.replaceAll(buffer, "\t", "");
        buffer = helpers.replaceAll(buffer, "--", "+");
        var evaluated = eval(buffer);
        return JSON.stringify(evaluated);
    }
}
class QuoteExpression extends IExpression {
    constructor(s, i) {
        super(i);
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
class RangeExpression extends IExpression {
    constructor(firstBuffer, s, i) {
        super(i);
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
class ListExpression extends IExpression {
    constructor(firstBuffer, s, i) {
        super(i);
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
                throw new ExpressionError("bad list", true, true);
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
class ArrayExpression extends IExpression {
    constructor(s, i) {
        super(i);
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
                throw new ExpressionError("bad array", true, true);
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
class FunctionExpression extends IExpression {
    constructor(s, i) {
        super(i);
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
                throw new ExpressionError("string without following bracket", true, true);
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
                throw new ExpressionError("no smaller coprime number exists for " + denom, true, true);
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
        }
        if (this.functionName == "lcm") {
            let ret = lcm(evaluatedParameters);
            return JSON.stringify(ret);
        }
        if (this.functionName == "compareobjects") {
            let ret = compareobjects(evaluatedParameters[0], evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        if (injector.allVariablesAndFunctions[this.functionName] instanceof JSFunction) {
            return injector.allVariablesAndFunctions[this.functionName].execute(evaluatedParameters);
        }
        if (typeof (Math[this.functionName]) == "function") {
            let ret = Math[this.functionName](evaluatedParameters[0], evaluatedParameters[1], evaluatedParameters[2]);
            return JSON.stringify(ret);
        }
        throw new ExpressionError(`custom function with name "${this.functionNamePreserveCase}" not defined`, false, false);
    }
}
class SimpleEngine {
    constructor(comment) {
        this.correctAnswers = {};
        this.comment = comment;
        let split = comment.split("\n");
        for (let i = 0; i < split.length; i++) {
            this.correctAnswers[helpers.lowerCaseLetterFromIndex(i)] = split[i];
        }
    }
    calculate(inputs, seed) {
        return this.correctAnswers;
    }
}
class ExpressionEngine {
    constructor(commentsWithLetters, jsFunctionsWithLetters, variableNamesWithLetters) {
        this.overflowCounter = 0;
        this.OVERFLOW_LIMIT = 1000;
        this.allVariablesAndFunctions = {};
        this.numVariables = 0;
        this.jsFunctionsWithLetters = jsFunctionsWithLetters;
        this.variableNamesWithLetters = variableNamesWithLetters;
        for (let key in commentsWithLetters) {
            this.allVariablesAndFunctions[key] = toExpressionTree(commentsWithLetters[key], 0);
            this.numVariables++;
        }
    }
    count() {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw new ExpressionError("contains an infinite loop", true, true);
        }
    }
    calculate(inputs, seed) {
        this.random = new Random(seed);
        this.indexForListEvaluation = this.random.next();
        this.overflowCounter = 0;
        for (let letter in this.allVariablesAndFunctions) {
            if (this.allVariablesAndFunctions[letter] instanceof IExpression) {
                this.allVariablesAndFunctions[letter]._value = undefined;
            }
        }
        let outputs = {};
        for (let letter in this.jsFunctionsWithLetters) {
            if (inputs[letter] && inputs[letter].length > 0) {
                try {
                    let obj = new JSFunction(inputs[letter], this.jsFunctionsWithLetters[letter]);
                    this.allVariablesAndFunctions[this.jsFunctionsWithLetters[letter]] = obj;
                }
                catch (e) {
                    if (e instanceof ExpressionError) {
                        if (!e.isCritical) {
                            outputs[letter] = e;
                        }
                        else {
                            throw (e);
                        }
                    }
                }
            }
        }
        for (let letter in this.variableNamesWithLetters) {
            this.allVariablesAndFunctions[this.variableNamesWithLetters[letter]] = inputs[letter];
        }
        for (let key in this.allVariablesAndFunctions) {
            if (this.allVariablesAndFunctions[key] instanceof IExpression) {
                try {
                    outputs[key] = JSONtoViewable(this.allVariablesAndFunctions[key].getValue(this));
                }
                catch (e) {
                    if (e instanceof ExpressionError) {
                        if (!e.isCritical) {
                            outputs[key] = e;
                        }
                        else {
                            throw (e);
                        }
                    }
                }
            }
        }
        return outputs;
    }
    variablesToKeepAsDollars(seed) {
        this.calculate({}, 0);
        let matrix = [];
        let i = 0;
        for (let key in this.allVariablesAndFunctions) {
            let row = helpers.getValuesFromObject(this.allVariablesAndFunctions[key].variablesUsed);
            row[i] = true;
            matrix.push(row.slice(0, this.numVariables));
            i++;
        }
        return this.showVariables(matrix, this.numVariables, new Random(seed));
    }
    showVariables(arr, numDollars, paramRandom) {
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
            for (var col = numDollars; col < arr[0].length; col++) {
                var hasATrue = false;
                for (var row = 0; row < arr.length; row++) {
                    hasATrue = hasATrue || arr[row][col];
                }
                if (hasATrue) {
                    colsWithATrue.push(col);
                }
            }
            if (colsWithATrue.length == 0) {
                for (let col = 0; col < numDollars; col++) {
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
}
var helpersMaker = function () {
    var objToHash = function (obj, hash) {
        if (hash == undefined) {
            hash = 34898410941;
        }
        return stringToHash(JSON.stringify(obj), hash);
    };
    var stringToHash = function (str, hash) {
        if (hash == undefined) {
            hash = 34898410941;
        }
        ;
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
    var createUID = function () {
        return 'ID' + Math.random().toString(36).substr(2, 16);
    };
    var shuffleInPlace = function (a, random) {
        for (var i = a.length - 1; i > 0; i--) {
            let index = random.next(i);
            a.push(a.splice(index, 1)[0]);
        }
        return a;
    };
    var toShuffled = function (a, random) {
        let ret = [];
        for (let item of a) {
            let index = random.next(a.length);
            while (ret[index]) {
                index++;
                index %= a.length;
            }
            ret[index] = item;
        }
        return ret;
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
    var IsStringNullOrEmpty = function (str) {
        return (str == undefined || str == null || str.length === 0 || !str.trim());
    };
    var IsStringNullOrWhiteSpace = function (str) {
        return str == undefined || str == null || str == "" || str.trim().length == 0;
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
    var removeCrazySigFigs = function (n) {
        return parseFloat(n).toPrecision(12);
    };
    var isNumeric = function (str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    };
    var getDescendants = function (div) {
        let ret = [div];
        if (div instanceof Container) {
            for (let child of div._childNodes) {
                ret = ret.concat(getDescendants(child));
            }
        }
        return ret;
    };
    var getDomainFromUrl = function (url) {
        var a = document.createElement('a');
        a.setAttribute('href', url);
        return a.hostname;
    };
    var insertAfter = function (arr, ref, item) {
        let index = arr.indexOf(ref);
        arr = arr.splice(index + 1, 0, item);
    };
    var insertBefore = function (arr, ref, item) {
        let index = arr.indexOf(ref);
        arr = arr.splice(index, 0, item);
    };
    var getItemImmediatelyAfter = function (arr, after) {
        let index = arr.indexOf(after);
        return index == -1 ? undefined : arr[index + 1];
    };
    var removeFromArray = function (array, item) {
        for (let i = array.length; i >= 0; i--) {
            if (array[i] == item) {
                array.splice(i, 1);
            }
        }
    };
    var lowerCaseLetterFromIndex = function (i) { return String.fromCharCode(97 + i); };
    var lengthOfObject = function (obj) {
        let ret = 0;
        for (let key in obj) {
            ret++;
        }
        return ret;
    };
    var getValuesFromObject = function (obj) {
        let ret = [];
        for (let key in obj) {
            ret.push(obj[key]);
        }
        return ret;
    };
    var getKeysFromObject = function (obj) {
        let ret = [];
        for (let key in obj) {
            ret.push(key);
        }
        return ret;
    };
    var mergeObjects = function (obj1, obj2) {
        let ret = {};
        for (let key in obj1) {
            ret[key] = obj1[key];
        }
        for (let key in obj2) {
            ret[key] = obj2[key];
        }
        return ret;
    };
    var sendRequestAndFail = function (url, object, onSuccess, onFail) {
        var queryString = "?";
        for (var key in object) {
            queryString += key + "=" + encodeURIComponent(object[key]) + "&";
        }
        let scriptElement = document.createElement("script");
        scriptElement.type = 'text/javascript';
        scriptElement.onerror = function (scriptElement, onFail) {
            var scriptElement = scriptElement;
            return (data) => {
                if (onFail)
                    onFail(data);
                document.body.removeChild(scriptElement);
            };
        }(scriptElement, onFail);
        let random = Math.random().toString().substring(2);
        window["callback"] = function (scriptElement, onSuccess) {
            var scriptElement = scriptElement;
            var onSuccess = onSuccess;
            return (data) => {
                onSuccess(data);
                document.body.removeChild(scriptElement);
            };
        }(scriptElement, onSuccess);
        scriptElement.src = url + queryString + "prefix=callback";
        document.body.appendChild(scriptElement);
    };
    var sendRequestAndRetry = function (url, object, onSuccess, onRetry) {
        var queryString = "?";
        for (var key in object) {
            queryString += key + "=" + encodeURIComponent(object[key]) + "&";
        }
        let scriptElement = document.createElement("script");
        scriptElement.type = 'text/javascript';
        scriptElement.onerror = function (url, object, onSuccess, scriptElement, onRetry) {
            var url = url;
            var object = object;
            var onSuccess = onSuccess;
            var scriptElement = scriptElement;
            var onRetry = onRetry;
            return (data) => {
                if (onRetry)
                    onRetry(data);
                document.body.removeChild(scriptElement);
                setTimeout(() => helpers.sendRequestAndRetry(url, object, onSuccess, onRetry), 1000);
            };
        }(url, object, onSuccess, scriptElement, onRetry);
        let random = Math.random().toString().substring(2);
        window["callback"] = function (scriptElement, onSuccess) {
            var scriptElement = scriptElement;
            var onSuccess = onSuccess;
            return (data) => {
                onSuccess(data);
                document.body.removeChild(scriptElement);
            };
        }(scriptElement, onSuccess);
        scriptElement.src = url + queryString + "prefix=callback";
        document.body.appendChild(scriptElement);
    };
    return {
        objToHash: objToHash,
        IsStringNullOrEmpty: IsStringNullOrEmpty,
        IsStringNullOrWhiteSpace: IsStringNullOrWhiteSpace,
        createUID: createUID,
        shuffleInPlace: shuffleInPlace,
        replaceAll: replaceAll,
        startsWith: startsWith,
        stripQuotes: stripQuotes,
        trimChar: trimChar,
        isNumeric: isNumeric,
        getDescendants: getDescendants,
        getDomainFromUrl: getDomainFromUrl,
        insertAfter: insertAfter,
        insertBefore: insertBefore,
        getItemImmediatelyAfter: getItemImmediatelyAfter,
        removeFromArray: removeFromArray,
        removeCrazySigFigs: removeCrazySigFigs,
        lowerCaseLetterFromIndex: lowerCaseLetterFromIndex,
        toShuffled: toShuffled,
        lengthOfObject: lengthOfObject,
        getValuesFromObject: getValuesFromObject,
        getKeysFromObject: getKeysFromObject,
        mergeObjects: mergeObjects,
        sendRequestAndRetry: sendRequestAndRetry,
        sendRequestAndFail: sendRequestAndFail
    };
};
var helpers = helpersMaker();
class Random {
    constructor(seed) {
        if (!seed) {
            this._seed = Random.generateSeed();
        }
        else {
            this._seed = seed;
        }
        this._seed = this._seed % 2147483647;
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
    static generateSeed() {
        let now = new Date();
        let seed = now.getTime();
        seed = seed % 2147483647;
        if (seed <= 0)
            seed += 2147483646;
        return seed;
    }
}
var IconName;
(function (IconName) {
    IconName[IconName["cross"] = 0] = "cross";
    IconName[IconName["tick"] = 1] = "tick";
    IconName[IconName["star"] = 2] = "star";
    IconName[IconName["trash"] = 3] = "trash";
    IconName[IconName["duplicate"] = 4] = "duplicate";
    IconName[IconName["hourglass"] = 5] = "hourglass";
    IconName[IconName["error"] = 6] = "error";
    IconName[IconName["refresh"] = 7] = "refresh";
    IconName[IconName["grid"] = 8] = "grid";
    IconName[IconName["pin"] = 9] = "pin";
    IconName[IconName["none"] = 10] = "none";
})(IconName || (IconName = {}));
;
class Icon extends ICup {
    constructor(parent, iconName) {
        super(parent, "img");
        this.setIconName(iconName);
    }
    getIconName() {
        return this.iconName;
    }
    setIconName(value) {
        this.iconName = value;
        if (value == IconName.none) {
            this.setAttribute("src", "");
            this.addClass("displayNone");
            this.removeClass("displayInlineBlock");
        }
        else {
            this.setAttribute("src", Icon.imageData[value]);
            this.removeClass("displayNone");
            this.addClass("displayInlineBlock");
        }
    }
}
Icon.imageData = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIhSURBVDjLlZPrThNRFIWJicmJz6BWiYbIkYDEG0JbBiitDQgm0PuFXqSAtKXtpE2hNuoPTXwSnwtExd6w0pl2OtPlrphKLSXhx07OZM769qy19wwAGLhM1ddC184+d18QMzoq3lfsD3LZ7Y3XbE5DL6Atzuyilc5Ciyd7IHVfgNcDYTQ2tvDr5crn6uLSvX+Av2Lk36FFpSVENDe3OxDZu8apO5rROJDLo30+Nlvj5RnTlVNAKs1aCVFr7b4BPn6Cls21AWgEQlz2+Dl1h7IdA+i97A/geP65WhbmrnZZ0GIJpr6OqZqYAd5/gJpKox4Mg7pD2YoC2b0/54rJQuJZdm6Izcgma4TW1WZ0h+y8BfbyJMwBmSxkjw+VObNanp5h/adwGhaTXF4NWbLj9gEONyCmUZmd10pGgf1/vwcgOT3tUQE0DdicwIod2EmSbwsKE1P8QoDkcHPJ5YESjgBJkYQpIEZ2KEB51Y6y3ojvY+P8XEDN7uKS0w0ltA7QGCWHCxSWWpwyaCeLy0BkA7UXyyg8fIzDoWHeBaDN4tQdSvAVdU1Aok+nsNTipIEVnkywo/FHatVkBoIhnFisOBoZxcGtQd4B0GYJNZsDSiAEadUBCkstPtN3Avs2Msa+Dt9XfxoFSNYF/Bh9gP0bOqHLAm2WUF1YQskwrVFYPWkf3h1iXwbvqGfFPSGW9Eah8HSS9fuZDnS32f71m8KFY7xs/QZyu6TH2+2+FAAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLvZPZLkNhFIV75zjvYm7VGFNCqoZUJ+roKUUpjRuqp61Wq0NKDMelGGqOxBSUIBKXWtWGZxAvobr8lWjChRgSF//dv9be+9trCwAI/vIE/26gXmviW5bqnb8yUK028qZjPfoPWEj4Ku5HBspgAz941IXZeze8N1bottSo8BTZviVWrEh546EO03EXpuJOdG63otJbjBKHkEp/Ml6yNYYzpuezWL4s5VMtT8acCMQcb5XL3eJE8VgBlR7BeMGW9Z4yT9y1CeyucuhdTGDxfftaBO7G4L+zg91UocxVmCiy51NpiP3n2treUPujL8xhOjYOzZYsQWANyRYlU4Y9Br6oHd5bDh0bCpSOixJiWx71YY09J5pM/WEbzFcDmHvwwBu2wnikg+lEj4mwBe5bC5h1OUqcwpdC60dxegRmR06TyjCF9G9z+qM2uCJmuMJmaNZaUrCSIi6X+jJIBBYtW5Cge7cd7sgoHDfDaAvKQGAlRZYc6ltJlMxX03UzlaRlBdQrzSCwksLRbOpHUSb7pcsnxCCwngvM2Rm/ugUCi84fycr4l2t8Bb6iqTxSCgNIAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLlZLNS5RRFMafe9/3vjPOjI1jaKKEVH40tGgRBWEibfoPQoKkVdtoEQQF4T/QqkVtWrSTFrVsF1FgJbWpIAh1k2PNh+PrfL4f95zTQk0HHKkDD/cc7vP8uHCuEhF0q/KnmXNgGR248PZFN4/GISXMC8L89DBPV0Dp4/SsazJjrtfb9/vdxfn/BgjzY5M8Aq8nBya+V3h93vtnQHFxat4kszntJAAAxus1YvnZQV5V/jyTEZarwnwFLGeFZdT0ZFOJdD84qoCDOpQ7grZfRNj020JSEOKvwvxGiF+q0tL0N5PuO+Mk0nC0B0BDsYCCImyzAIktBBloMwKJLSgKYcMAcdhC2KpVlIig+H5qxcv0n0xmj4Gbq+BwC2wtJLbgHUlMEFJwUpMIGpto16u+kJzSACAk+WCzvNbe+AVljkOYIcQQou3TbvdOJo+g4aNdqzaF+PT43HJVA8DQpcVIiPPtaqlEUQzlDELsTpgYwgTAQIjQqlUCtpQfn1spdmxh+PJSQyw9CrbKgM7tvcISQAxlBhC3GuCYXk3cWP25m3M7dk88qbWBRDVApaATOSjPBdXXwYEP5QyCgvjE/kwHgInHtHYBnYA2owhrPiiuw0sOw3EZFEagIB7qChDiYaUcNIoFtP1KxCTPhWiDw7WbXk9vKpnOgsI4exjg6Mbq96YQPxm79uPOvqvbXx4O3KrF6w8osv2df17kr5YXJq7vnw/S0v3k7Ie7xtud/wAaRnP+Cw8iKQAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAFuSURBVBgZBcG/S1RxAADwz3teyp3XFUUWNVSoRGQR3dLQIESBbUZt9gekm9XW2lRbNDv0gxbJWoJoCcT+ABskTgcDDwLpOD19d+/73rfPJ4kAANaejUx03t5eBZIIgKe34r3JB7OTVVvZuzf9lderiKIoip7MLba+xY24H4v4N36PC635uSgFIJ2/Pz7ppH19w66aHk/nqQCfk8LU1BWJAyMyo3Y1bV2nwpeh8nxxthg+Vm+ZUFVKHDjhK1UqlJeK52E61LOkasOhRDAic8EWKp/qxaupmdOO6Fi3bVyiEAQdA6Th7tjMGYcyDTcdtWlUoqYtypHmjy/atadrX6JpU5QaMhDlSPNTFX9kMj0H6rr+gYFCjnSw3XNZ2y9dPfT1lUq5UkA6+Phb3TU3NJArHFeKhtTkSBc+rC//0NBQVbNmwphzGu5oCztUGDz8udydbSrlVmI9eSkIirzYKZokESw+yl+EdtgL75eWAID/yIWfXhcZhKEAAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAy0lEQVQ4T63TMWoCQRQG4G9rzyCBgCGNR0ifJiCinSmCgVS2sfAWaQzYJRcQJNhbW5rWVpTUaZJCBrZYltnd6GbKmXkf/3vMJGqupGa9LLDCZQm4Rid/ngW+8IOPCNLFAddVwByPESDsh+LawAz9NGkP+3wLVQle8IwLtLE5FQgt3OOtCFjgITKDsN9KZzDAexHQwGcOCClD3G0VMEWz5B0EeIzCBNnaCW5xEwH/BLziCUt855DQzlVsBtl7IwxL2vnFHXb/+pnO+phHa64xEbM+Qh0AAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ6SURBVDjLjZO7T1NhGMY7Mji6uJgYt8bElTjof6CDg4sMSqIxJsRGB5F4TwQSIg1QKC0KWmkZEEsKtEcSxF5ohV5pKSicXqX3aqGn957z+PUEGopiGJ583/A+v3znvPkJAAjWR0VNJG0kGhKahCFhXcN3YBFfx8Kry6ym4xIzce88/fbWGY2k5WRb77UTTbWuYA9gDGg7EVmSIOF4g5T7HZKuMcSW5djWDyL0uRf0dCc8inYYxTcw9fAiCMBYB3gVj1z7gLhNTjKCqHkYP79KENC9Bq3uxrrqORzy+9D3tPAAccspVx1gWg0KbaZFbGllWFM+xrKkFQudV0CeDfJsjN4+C2nracjunoPq5VXIBrowMK4V1gG1LGyWdbZwCalsBYUyh2KFQzpXxVqkAGswD3+qBDpZwow9iYE5v26/VwfUQnnznyhvjguQYabIIpKpYD1ahI8UTT92MUSFuP5Z/9TBTgOgFrVjp3nakaG/0VmEfpX58pwzjUEquNk362s+PP8XYD/KpYTBHmRg9Wch0QX1R80dCZhYipudYQY2Auib8RmODVCa4hfUK4ngaiiLNFNFdKeCWWscXZMbWy9Unv9/gsIQU09a4pwvUeA3Uapy2C2wCKXL0DqTePLexbWPOv79E8f0UWrencZ2poxciUWZlKssB4bcHeE83NsFuMgpo2iIpMuNa1TNu4XjhggWvb+R2K3wZdLlAZl8Fd9jRb5sD+Xx0RJBx5gdom6VsMEFDyWF0WyCeSOFcDKPnRxZYTQL5Rc/nn1w4oFsBaIhC3r6FRh5erPRhYMyHdeFw4C6zkRhmijM7CnMu0AUZonCDCnRJBqSus5/ABD6Ba5CkQS8AAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIsSURBVDjLpVNLSJQBEP7+h6uu62vLVAJDW1KQTMrINQ1vPQzq1GOpa9EppGOHLh0kCEKL7JBEhVCHihAsESyJiE4FWShGRmauu7KYiv6Pma+DGoFrBQ7MzGFmPr5vmDFIYj1mr1WYfrHPovA9VVOqbC7e/1rS9ZlrAVDYHig5WB0oPtBI0TNrUiC5yhP9jeF4X8NPcWfopoY48XT39PjjXeF0vWkZqOjd7LJYrmGasHPCCJbHwhS9/F8M4s8baid764Xi0Ilfp5voorpJfn2wwx/r3l77TwZUvR+qajXVn8PnvocYfXYH6k2ioOaCpaIdf11ivDcayyiMVudsOYqFb60gARJYHG9DbqQFmSVNjaO3K2NpAeK90ZCqtgcrjkP9aUCXp0moetDFEeRXnYCKXhm+uTW0CkBFu4JlxzZkFlbASz4CQGQVBFeEwZm8geyiMuRVntzsL3oXV+YMkvjRsydC1U+lhwZsWXgHb+oWVAEzIwvzyVlk5igsi7DymmHlHsFQR50rjl+981Jy1Fw6Gu0ObTtnU+cgs28AKgDiy+Awpj5OACBAhZ/qh2HOo6i+NeA73jUAML4/qWux8mt6NjW1w599CS9xb0mSEqQBEDAtwqALUmBaG5FV3oYPnTHMjAwetlWksyByaukxQg2wQ9FlccaK/OXA3/uAEUDp3rNIDQ1ctSk6kHh1/jRFoaL4M4snEMeD73gQx4M4PsT1IZ5AfYH68tZY7zv/ApRMY9mnuVMvAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI/SURBVDjLjZPbS9NhHMYH+zNidtCSQrqwQtY5y2QtT2QGrTZf13TkoYFlzsWa/tzcoR3cSc2xYUlGJfzAaIRltY0N12H5I+jaOxG8De+evhtdOP1hu3hv3sPzPO/z4SsBIPnfuvG8cbBlWiEVO5OUItA0VS8oxi9EdhXo+6yV3V3UGHRvVXHNfNv6zRfNuBZVoiFcB/3LdnQ8U+Gk+bhPVKB3qUOuf6/muaQR/qwDkZ9BRFdCmMr5EPz6BN7lMYylLGgNNaKqt3K0SKDnQ7us690t3rNsxeyvaUz+8OJpzo/QNzd8WTtcaQ7WlBmPvxhx1V2Pg7oDziIBimwwf3qAGWESkVwQ7owNujk1ztvk+cg4NnAUTT4FrrjqUKHdF9jxBfXr1rgjaSk4OlMcLrnOrJ7latxbL1V2lgvlbG9MtMTrMw1r1PImtfyn1n5q47TlBLf90n5NmalMtUdKZoyQMkLKlIGLjMyYhFpmlz3nGEVmFJlRZNaf7pIaEndM24XIjCOzjX9mm2S2JsqdkMYIqbB1j5C6yWzVk7YRFTsGFu7l+4nveExIA9aMCcOJh6DIoMigyOh+o4UryRWQOtIjaJtoziM1FD0mpE4uZcTc72gBaUyYKEI6khgqINXO3saR7kM8IZUVCRDS0Ucf+xFbCReQhr97MZ51wpWxYnhpCD3zOrT4lTisr+AJqVx0Fiiyr4/vhP4VyyMFIUWNqRrV96vWKXKckBoIqWzXYcoPDrUslDJoopuEVEpIB0sR+AuErIiZ6OqMKAAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAApklEQVQ4jb3SQQqBURTF8R99E0aSMrEFC7AGpvYmG1A2YgG2YCIDJSlRTF65fS4lcut1T+f/Ou/d1+O5ZkFPysoYqJKAbtCtNww0k4CP6uuABuboBG+EVdGD0jcJg30Wugx6WlbG8IMRKozRDt4gnDqq7Y8MThVOOAfz4jHbsfR9wuCa3eq/b9DAAr3gDbEuul/6NmGwy0L/O8JP/kG9DkGfcXvBwB3GoiAx97DmjwAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA6UlEQVQ4y2NgIBL8L2aUA+LrQOzGQCoAamIC4sNA/BeIv5NsCFBDFVSzHxCvhhriQqxmCyD+DcQ1QMwFxFuB+D8QfwViB2wa1IC4EYgXAvFUIL4PxNuBWASIj0I1w/BjdM0FUNtgCs4C8XMgvgvEV9E0XwRiPXQDjID4LVRBGBCzAPF0NI0gCzqBmA2Xn2GG3ATizWiaQS6xIibgkF2CjOcSo1kM6kQTLIasJybB7IYq7sfikl5CBjRDFZ4GYgU074ASkhE+zV5QRVPRQxhqSCOhjPIQiKPIyShs0FSnxUAOAMUrEPMwkAkABQjt40jPAagAAAAASUVORK5CYII="
];
class MarginDiv extends Container {
    constructor(parent, questionNumberLogic, questionLogic) {
        super(parent, "div");
        this.classes.push("margin");
        this.classes.push("greyBackground");
        if (questionNumberLogic) {
            let questionNumberDiv = new Container(this, "div", ["Q", questionNumberLogic.createSpan(this)]);
            questionNumberDiv.addClass("questionNumber");
            this.appendChildElement(questionNumberDiv);
        }
        if (this.settings.allowRowDelete) {
            let deleteButton = new Icon(this, IconName.trash);
            deleteButton.setEvent("onclick", questionLogic.destroy.bind(questionLogic));
            deleteButton.addClass("deleteButton").addClass("hideOnPrint");
            this.appendChildElement(deleteButton);
        }
        if (this.settings.allowRowDuplicate) {
            let duplicateButton = new Icon(this, IconName.duplicate);
            duplicateButton.setEvent("onclick", function (ql, assignment) {
                var ql = ql;
                var assignment = assignment;
                return () => { assignment.duplicateRow(ql); };
            }(questionLogic, this.settings.assignment));
            duplicateButton.addClass("duplicateButton").addClass("hideOnPrint");
            this.appendChildElement(duplicateButton);
        }
        let refreshButton = new Icon(this, IconName.refresh);
        refreshButton.setEvent("onclick", function (ql) {
            var ql = ql;
            return () => { questionLogic.commentLogic.generateNewDollars(); };
        }(questionLogic));
        refreshButton.addClass("refreshButton").addClass("hideOnPrint");
        this.appendChildElement(refreshButton);
        if (parent.contentDiv.gridlines.length > 0) {
            let gridlinesButton = new Icon(this, IconName.grid);
            gridlinesButton.setEvent("onclick", function (contentDiv) {
                var contentDiv = contentDiv;
                return () => { contentDiv.toggleGridlines(); };
            }(parent.contentDiv));
            gridlinesButton.addClass("gridlinesButton").addClass("hideOnPrint");
            this.appendChildElement(gridlinesButton);
        }
        let spotlightButton = new Icon(this, IconName.pin);
        spotlightButton.setEvent("onclick", function (ql) {
            var ql = ql;
            return () => { QuestionLogic.toggleHideAllQuestionsButOne(ql); };
        }(questionLogic));
        spotlightButton.addClass("refreshButton").addClass("hideOnPrint");
        this.appendChildElement(spotlightButton);
    }
}
class QuestionLogic {
    constructor(rowData, settings, after) {
        this.rowData = rowData;
        this.settings = settings;
        QuestionLogic.unorderedInstances.push(this);
        this.questionNumberLogic = new QuestionNumberLogic(this.settings, after ? after.questionNumberLogic : null);
        this.questionTitleLogic = new QuestionTitleLogic(this.rowData.title, this.settings, after ? after.questionTitleLogic : null);
    }
    createQuestionDiv(parent) {
        if (this.settings.presentMode) {
            this.questionDiv = new SectionDiv(parent, this.questionTitleLogic, this.questionNumberLogic, this.rowData.leftRight, this);
        }
        else {
            this.questionDiv = new QuestionDiv(parent, this.questionTitleLogic, this.questionNumberLogic, this.rowData.leftRight, this);
        }
        if (this.isQuestionOrTemplateOrSudoku) {
            this.commentLogic = new CommentLogic(this.rowData.comment, this.questionDiv.contentDiv.setValueFields, this.rowData.purpose, this);
        }
        return this.questionDiv;
    }
    createSolutionDiv(parent) {
        this.solutionDiv = new SolutionDiv(parent, this.questionNumberLogic, this.commentLogic);
        return this.solutionDiv;
    }
    get isQuestionOrTemplateOrSudoku() { return QuestionLogic.purposesWithQuestionNumber.indexOf(this.rowData.purpose) != -1; }
    destroy() {
        this.questionTitleLogic.delete();
        if (this.questionNumberLogic) {
            this.questionNumberLogic.destroy();
        }
        if (this.commentLogic) {
            this.commentLogic.destroy();
        }
        this.questionDiv.destroy();
        if (this.solutionDiv) {
            this.solutionDiv.destroy();
        }
        helpers.removeFromArray(QuestionLogic.unorderedInstances, this);
    }
    get questionNumbers() {
        let ret = [];
        for (let i = 0; i < this.commentLogic.numAbleScoreLogics; i++) {
            ret.push(this.questionNumberLogic.number + helpers.lowerCaseLetterFromIndex(i));
        }
        return ret;
    }
    static toggleHideAllQuestionsButOne(questionLogic) {
        if (questionLogic.questionDiv.classes.indexOf("displayBlock") != -1) {
            QuestionLogic.unorderedInstances.forEach(ql => {
                ql.questionDiv.removeClass("displayNone");
                ql.questionDiv.removeClass("displayBlock");
            });
        }
        else {
            QuestionLogic.unorderedInstances.filter(ql => ql != questionLogic).forEach(ql2 => {
                ql2.questionDiv.addClass("displayNone");
                ql2.questionDiv.removeClass("displayBlock");
            });
            questionLogic.questionDiv.addClass("displayBlock");
            questionLogic.questionDiv.removeClass("displayNone");
        }
    }
}
QuestionLogic.purposesWithQuestionNumber = ["question", "sudoku", "template"];
QuestionLogic.unorderedInstances = [];
class IQuestionOrSectionDiv extends Container {
}
class QuestionDiv extends IQuestionOrSectionDiv {
    constructor(parent, questionTitleLogic, questionNumberLogic, leftRightMarkdown, questionLogic) {
        super(parent, "div");
        this.classes.push("question");
        this.classes.push("greyBorder");
        this.contentDiv = new ContentDiv(this, questionTitleLogic, leftRightMarkdown);
        this.marginDiv = new MarginDiv(this, questionNumberLogic, questionLogic);
        this._childNodes = [this.contentDiv, this.marginDiv];
    }
}
class SectionDiv extends IQuestionOrSectionDiv {
    constructor(parent, questionTitleLogic, questionNumberLogic, leftRightMarkdown, questionLogic) {
        super(parent, "section");
        this.contentDiv = new ContentDiv(this, questionTitleLogic, leftRightMarkdown);
        this._childNodes = [this.contentDiv];
    }
}
class QuestionNumberLogic {
    constructor(settings, after) {
        this.spans = [];
        this.settings = settings;
        if (after) {
            helpers.insertAfter(QuestionNumberLogic.instances, after, this);
            QuestionNumberLogic.instances.forEach(qn => qn.refreshSpans());
        }
        else {
            QuestionNumberLogic.instances.push(this);
        }
    }
    get next() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return QuestionNumberLogic.instances[index + 1];
    }
    get number() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return index + 1;
    }
    get prev() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return QuestionNumberLogic.instances[index - 1];
    }
    createSpan(parent) {
        var span = new Span(parent, this.number.toString());
        this.spans.push(span);
        return span;
    }
    refreshSpans() {
        this.spans.forEach(span => span.innerHTML = this.number.toString());
    }
    destroy() {
        helpers.removeFromArray(QuestionNumberLogic.instances, this);
        QuestionNumberLogic.instances.forEach(qn => qn.refreshSpans());
    }
}
QuestionNumberLogic.instances = [];
class QuestionTitleLogic {
    constructor(title, settings, after) {
        this.value = title;
        this.settings = settings;
        if (after) {
            helpers.insertAfter(QuestionTitleLogic.instances, after, this);
            QuestionTitleLogic.instances.forEach(qn => qn.refresh());
        }
        else {
            QuestionTitleLogic.instances.push(this);
        }
    }
    createTitle(parent) {
        if (this.div) {
            throw "title already created";
        }
        this.div = new Container(parent, "div");
        let span = new Span(this.div, this.value);
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
    refresh() {
        let hidden = this.prev ? (this.prev.value == this.value) : false;
        if (this.div) {
            if (hidden) {
                this.div.addClass("displayNone");
                this.div.removeClass("displayBlock");
            }
            else {
                this.div.addClass("displayBlock");
                this.div.removeClass("displayNone");
            }
        }
    }
    delete() {
        helpers.removeFromArray(QuestionTitleLogic.instances, this);
        QuestionTitleLogic.instances.forEach(qn => qn.refresh());
    }
}
QuestionTitleLogic.instances = [];
class ComboCup extends Container {
    constructor(parent, childNodes, decisionImage, span) {
        super(parent, "select", childNodes);
        this.replace(ComboCup.optionReplacer);
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
        this.attributes["value"] = "";
    }
    setOnClickAway(func) { this.setEvent("onchange", func); }
    getValue() { return this.getAttribute("value"); }
    setValue(value) { this.setAttribute("value", value); }
    setDecisionImage(value) { this._decisionImage.setIconName(value); }
    setErrorText(value) {
        this.errorText.innerHTML = value;
        if (value.length > 0)
            this._decisionImage.setIconName(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this._decisionImage.getIconName() == IconName.error) {
            this.setDecisionImage(IconName.none);
        }
    }
}
ComboCup.optionReplacer = {
    "pattern": /(?:^|\/)([^\/]+)/,
    "nodeConstructorFromMatch": (parent, str) => {
        return [new OptionCup(parent, str, false)];
    }
};
class InputCup extends ICup {
    constructor(parent, size, decisionImage, span) {
        super(parent, "input");
        this.attributes["type"] = "text";
        this.attributes["size"] = size.toString();
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
        this.attributes["value"] = "";
    }
    setOnClickAway(func) { this.setEvent("onblur", func); }
    getValue() { return this.getAttribute("value"); }
    setValue(value) { this.setAttribute("value", value); }
    setDecisionImage(value) { this._decisionImage.setIconName(value); }
    setErrorText(value) {
        this.errorText.innerHTML = value;
        if (value.length > 0)
            this._decisionImage.setIconName(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this._decisionImage.getIconName() == IconName.error) {
            this.setDecisionImage(IconName.none);
        }
    }
}
class TextAreaCup extends ICup {
    constructor(parent, decisionImage, span) {
        super(parent, "textarea");
        this.attributes["rows"] = "10";
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
    }
    setOnClickAway(func) { this.setEvent("onblur", func); }
    getValue() { return this.getAttribute("value"); }
    setValue(value) { this.innerHTML = value; }
    setDecisionImage(value) { this._decisionImage.setIconName(value); }
    setErrorText(value) {
        this.errorText.innerHTML = value;
        if (value.length > 0)
            this._decisionImage.setIconName(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this._decisionImage.getIconName() == IconName.error) {
            this.setDecisionImage(IconName.none);
        }
    }
}
class RadioSet {
    constructor() {
        this.radioCups = [];
        this._UID = helpers.createUID();
        this.onClickAway = () => { };
    }
    letterComesAfterLastInSet(value) {
        return value > this.radioCups[this.radioCups.length - 1].letter;
    }
    addRadioCup(rc) {
        this.radioCups.push(rc);
        rc.setEvent("onclick", function (radioSet) {
            var rs = radioSet;
            return () => { rs.onClickAway(); };
        }(this));
        rc.setAttribute("name", this._UID);
    }
    setOnClickAway(func) { this.onClickAway = func; }
    get checkedRadio() { return this.radioCups.find(rc => rc.getAttribute("checked")); }
    getValue() {
        let found = this.checkedRadio;
        return (found == undefined) ? "" : found.letter;
    }
    setValue(value) {
        this.radioCups.forEach(rc => { rc.setAttribute("checked", (rc.letter == value)); });
    }
    get UID() { return this._UID; }
    destroy() {
        this.radioCups.forEach((c) => { c.destroy(); });
    }
    setDecisionImage(value) {
        this.radioCups.forEach(r => {
            if (r.getAttribute("checked")) {
                r._decisionImage.setIconName(value);
            }
            else {
                r._decisionImage.setIconName(IconName.none);
            }
        });
    }
    setErrorText(value) {
        this.radioCups.forEach(r => {
            if (r.getAttribute("checked")) {
                r.errorText.innerHTML = value;
                if (value.length > 0)
                    r._decisionImage.setIconName(IconName.error);
            }
        });
    }
    resetError() {
        this.radioCups.forEach(r => {
            r.errorText.innerHTML = "";
            if (r._decisionImage.getIconName() == IconName.error) {
                r._decisionImage.setIconName(IconName.none);
            }
        });
    }
    setAttribute(name, value) { this.radioCups.forEach(r => r.setAttribute(name, value)); }
}
class RadioCup extends ICup {
    constructor(parent, letter, decisionImage, span) {
        super(parent, "input");
        this.setAttribute("type", "radio");
        this.letter = letter;
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
    }
    get outerHTML() {
        return this.letter + ". " + super.outerHTML;
    }
}
class CheckBoxCup extends Icon {
    constructor(parent, iconName, span) {
        super(parent, iconName);
        this.errorText = span;
        this.errorText.addClass("errorText");
    }
    setDecisionImage(value) { this.setIconName(value); }
    setValue(value) { }
    getValue() { return ""; }
    setErrorText(value) {
        this.errorText.innerHTML = value;
        if (value.length > 0)
            this.setDecisionImage(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this.getIconName() == IconName.error) {
            this.setDecisionImage(IconName.none);
        }
    }
}
class DollarCup extends Container {
    constructor(parent, span) {
        super(parent, "div");
        this.classes.push("dollarCup");
        this.errorText = span;
        this.errorText.addClass("errorText");
    }
    setValue(value) {
        this.destroyAllChildren();
        this.appendChildString(value);
        for (let replacer of ContentDiv.replacers) {
            this.replace(replacer);
        }
        if (this.getElement(false)) {
            this._element.innerHTML = this.innerHTML;
        }
    }
    getValue() { return this.innerHTML; }
    swapForInput() {
        let parent = this._parent;
        let decisionImage = new Icon(parent, IconName.none);
        let span = new Span(parent, "");
        let input = new InputCup(parent, 3, decisionImage, span);
        let index = parent._childNodes.indexOf(this);
        parent._childNodes.splice(index, 2, input, decisionImage, span);
        return input;
    }
    setErrorText(value) {
        this.errorText.innerHTML = value;
    }
    resetError() {
        this.errorText.innerHTML = "";
    }
}
class ScoreLogic {
    constructor(setImageField, settings, questionDiv) {
        this.pending = false;
        ScoreLogic.instances.push(this);
        this.settings = settings;
        this.setImageField = setImageField;
        if (this.questionDiv instanceof QuestionDiv)
            this.questionDiv = questionDiv;
        this._score = 0;
        this.hasBeenWrong = false;
        this.hasBeenCorrect = false;
    }
    get stars() {
        return (this.hasBeenCorrect && !this.hasBeenWrong) ? 1 : 0;
    }
    get attempted() {
        return (this.hasBeenCorrect || this.hasBeenWrong) ? 1 : 0;
    }
    get outOf() {
        return 1;
    }
    get score() {
        return this._score;
    }
    setCorrect(isCorrect) {
        this._score = isCorrect ? 1 : 0;
        if ((this.attempted == 0 || this.settings.presentMode) &&
            this.settings.initialChecksRemaining < 0) {
            this.setImage();
        }
        else {
            this.setImageField.setDecisionImage(IconName.hourglass);
            this.pending = true;
            if (this.settings.initialChecksRemaining < 0 && ScoreLogic.showHourGlassNotification) {
                alert("To check an answer after the first attempt, you must use the 'check answers button' at the bottom of the page.");
                ScoreLogic.showHourGlassNotification = false;
            }
        }
        if (isCorrect) {
            this.hasBeenCorrect = true;
        }
        else {
            this.hasBeenWrong = true;
        }
    }
    setImage() {
        this.setImageField.setDecisionImage(this.iconName);
        this.pending = false;
        if (this.questionDiv) {
            let sameQuestionSLs = ScoreLogic.instances.filter(sl => sl.questionDiv == this.questionDiv);
            let wrongOnes = sameQuestionSLs.filter(sl => sl.score == 0);
            if (wrongOnes.length == 0) {
                this.questionDiv.marginDiv.addClass("greenBackground");
                this.questionDiv.marginDiv.removeClass("greyBackground");
                this.questionDiv.addClass("greenBorder");
                this.questionDiv.removeClass("greyBorder");
            }
            else {
                this.questionDiv.marginDiv.addClass("greyBackground");
                this.questionDiv.marginDiv.removeClass("greenBackground");
                this.questionDiv.addClass("greyBorder");
                this.questionDiv.removeClass("greenBorder");
            }
        }
    }
    get iconName() {
        if (this._score == 1) {
            return this.hasBeenWrong ? IconName.tick : IconName.star;
        }
        if (this._score == 0) {
            return IconName.cross;
        }
    }
    get color() {
        if (this._score == 1) {
            return this.hasBeenWrong ? "LimeGreen" : "LightGreen";
        }
        if (this._score == 0) {
            return (this.hasBeenCorrect || this.hasBeenWrong) ? "LightSalmon" : "White";
        }
    }
    get iconAsString() {
        if (this._score == 1) {
            return this.hasBeenWrong ? "✓" : "★";
        }
        if (this._score == 0) {
            return (this.hasBeenCorrect || this.hasBeenWrong) ? "✗" : "White";
        }
    }
    destroy() {
        helpers.removeFromArray(ScoreLogic.instances, this);
    }
}
ScoreLogic.showHourGlassNotification = true;
ScoreLogic.instances = [];
class Settings {
    constructor(settingsObj) {
        window["cupsById"] = {};
        for (var key in settingsObj) {
            this[key] = settingsObj[key];
        }
        ;
        if (this.writeToSheet) {
            this.sheetManager = new SheetManager(this);
        }
        this.random = new Random();
        if (this.endTime) {
            this.timerLogic = new TimerLogic(this.endTime, this);
        }
    }
    static getSettingsFromMarkbook(url, workbookSheetString, user, onSuccess, onFail) {
        var addStuffToSettings = function (markbookSettings) {
            if ("error" in markbookSettings) {
                onFail(markbookSettings["error"]);
                return;
            }
            var settings = new Settings(markbookSettings);
            settings.checkRequest = (onSuccess, onRetry) => {
                var object = {
                    "action": "echo",
                    "workbookSheetString": workbookSheetString,
                    "user": user,
                    "startTime": settings.startTime,
                    "returnValue": 1
                };
                helpers.sendRequestAndRetry(url, object, onSuccess, onRetry);
            };
            settings.writeToSheet = (onSuccess, onRetry, scores) => {
                var object = {
                    "action": "writeToSheet",
                    "workbookSheetString": workbookSheetString,
                    "user": user,
                    "startTime": settings.startTime,
                    "scores": JSON.stringify(scores)
                };
                helpers.sendRequestAndRetry(url, object, onSuccess, onRetry);
            };
            settings.allowRowDelete = false;
            settings.allowRowDuplicate = false;
            settings.allowRefresh = false;
            settings.allowGridlines = false;
            settings.user = user;
            settings.random = new Random(helpers.objToHash([user, markbookSettings.startTime]));
            onSuccess(settings);
        };
        var data = {
            action: "getMarkbookSettings",
            workbookSheetString: workbookSheetString,
            user: user
        };
        helpers.sendRequestAndFail(url, data, addStuffToSettings, onFail);
        return;
    }
    get totalStars() {
        return ScoreLogic.instances.reduce((a, b) => a + b.stars, 0);
    }
    get totalAttempted() {
        return ScoreLogic.instances.reduce((a, b) => a + b.attempted, 0);
    }
    get totalOutOf() {
        return ScoreLogic.instances.reduce((a, b) => a + b.outOf, 0);
    }
    get totalCorrect() {
        return ScoreLogic.instances.reduce((a, b) => a + b.score, 0);
    }
    get totalScores() {
        return {
            "Correct": { "value": this.totalCorrect },
            "Attempted": { "value": this.totalAttempted },
            "Stars": { "value": this.totalStars },
            "Out of": { "value": this.totalOutOf }
        };
    }
    disableAllInputs() {
        CommentLogic.instances.forEach(c => c.disable());
    }
}
class SheetManager {
    constructor(settings) {
        this.numberOfFieldsWithQuestionTitles = {};
        this.columnHeadersWithFieldUIDs = {};
        this.scoresToSendBuffer = {};
        this.timerInterval = null;
        this.settings = settings;
    }
    registerField(valueField, columnHeaderFirstPart, jsFunctionName) {
        if (!(columnHeaderFirstPart in this.numberOfFieldsWithQuestionTitles)) {
            this.numberOfFieldsWithQuestionTitles[columnHeaderFirstPart] = 0;
        }
        let letter = jsFunctionName ? jsFunctionName : helpers.lowerCaseLetterFromIndex(this.numberOfFieldsWithQuestionTitles[columnHeaderFirstPart]++);
        let columnHeader = columnHeaderFirstPart + "." + letter;
        this.columnHeadersWithFieldUIDs[valueField.UID] = columnHeader;
        if (this.settings.responses && columnHeader in this.settings.responses) {
            valueField.setValue(this.settings.responses[columnHeader]);
        }
    }
    addFieldToSendBuffer(field, scoreLogic) {
        let columnHeader = this.columnHeadersWithFieldUIDs[field.UID];
        if (columnHeader) {
            if (scoreLogic) {
                if (field instanceof CheckBoxCup) {
                    this.scoresToSendBuffer[columnHeader] = {
                        value: scoreLogic.iconAsString,
                        color: scoreLogic.color,
                        append: this.settings.appendMode
                    };
                }
                else {
                    this.scoresToSendBuffer[columnHeader] = {
                        value: field.getValue(),
                        color: scoreLogic.color,
                        append: this.settings.appendMode
                    };
                }
            }
            else {
                this.scoresToSendBuffer[columnHeader] = {
                    value: field.getValue(),
                    color: "white",
                    append: this.settings.appendMode
                };
            }
        }
    }
    addScoresToBuffer(scores) {
        this.scoresToSendBuffer = helpers.mergeObjects(this.scoresToSendBuffer, scores);
    }
    attemptToSend() {
        let merged = helpers.mergeObjects(this.settings.totalScores, this.scoresToSendBuffer);
        let success = this.settings.writeToSheet(merged);
        if (success) {
            this.scoresToSendBuffer = {};
            this.span.innerHTML = "";
        }
        else {
            if (this.timerInterval == null) {
                this.startCountDown();
            }
        }
    }
    createCountdownDiv(parent) {
        this.div = new Container(parent, "div");
        this.div.addClass("sheetManagerCountdown");
        this.span = new Span(this.div, "");
        this.div.appendChildElement(this.span);
        return this.div;
    }
    startCountDown() {
        let d = new Date();
        this.endTime = new Date(d.valueOf() + 10000);
        this.timerInterval = setInterval(function (sheetManager) {
            var sheetManager = sheetManager;
            return function () {
                sheetManager.span.innerHTML = sheetManager.timerText;
                if (sheetManager.isElapsed) {
                    sheetManager.span.innerHTML = "retrying...";
                    clearInterval(sheetManager.timerInterval);
                    sheetManager.timerInterval = null;
                    sheetManager.attemptToSend();
                }
            };
        }(this), 900);
    }
    get timerText() {
        var secondsLeft = Math.floor((this.endTime.valueOf() - new Date().valueOf()) / 1000);
        return `Connection error: retrying in ${secondsLeft} seconds `;
    }
    get isElapsed() {
        return this.endTime.valueOf() < new Date().valueOf();
    }
}
class SolutionDiv extends Container {
    constructor(parent, questionNumberLogic, commentLogic) {
        super(parent, "div");
        this.classes.push("solution");
        if (commentLogic) {
            commentLogic.createAndAppendSolutions(this, questionNumberLogic);
        }
    }
}
class SubmitButtonAndFinalScoreLogic {
    constructor(settings) {
        this.settings = settings;
    }
    createDiv(parent) {
        this.div = new Container(parent, "div");
        if (this.settings.initialChecksRemaining == 0) {
            this.div.appendChildElement(this.createFinalScore(this.div));
            ScoreLogic.instances.forEach(sc => sc.setImage());
            this.settings.disableAllInputs();
        }
        else {
            this.div.appendChildElement(this.createButton(this.div, this.settings.initialChecksRemaining));
        }
        return this.div;
    }
    createButton(parent, numChecks) {
        this.button = new ButtonCup(parent, this.buttonText(numChecks));
        this.button.addClass("submitButton");
        this.button.setEvent("onclick", this.onCheckButton.bind(this));
        return this.button;
    }
    createFinalScore(parent) {
        this.finalScore = new HeadingCup(this.div, `FINAL SCORE: ${this.settings.totalCorrect} out of ${this.settings.totalOutOf}</h1>`);
        this.finalScore.addClass("finalScore");
        return this.finalScore;
    }
    buttonText(numChecks) {
        return numChecks < 1 ? "check my answers" :
            numChecks < 1 ? "no checks remaining" :
                numChecks == 1 ? "I am finished. Check my answers then freeze the quiz" :
                    numChecks + " checks remaining";
    }
    onCheckButton() {
        if (this.settings.checkRequest) {
            this.button.setAttribute("disabled", true);
            let onRetry = (data) => {
                this.button.innerHTML = "connection error....retrying";
            };
            this.settings.checkRequest(this.checkCallback.bind(this), onRetry.bind(this));
        }
        else {
            ScoreLogic.instances.forEach(s => { if (s.pending)
                s.setImage(); });
        }
    }
    checkCallback(checksRemaining) {
        this.button.innerHTML = this.buttonText(checksRemaining);
        this.button.setAttribute("disabled", false);
        if (this.button) {
            this.button.setAttribute("value", this.buttonText);
            if (checksRemaining == 0) {
                this.button.destroy();
                this.div.appendChildElement(this.createFinalScore(this.div));
                ScoreLogic.instances.forEach(sc => sc.setImage());
                this.settings.disableAllInputs();
            }
        }
    }
}
class TimerLogic {
    constructor(endTime, settings) {
        this.endTime = endTime;
        this.settings = settings;
    }
    createDiv(parent) {
        this.div = new Container(parent, "div");
        this.div.addClass("timer");
        this.span = new Span(this.div, "");
        this.div.appendChildElement(this.span);
        this.timerInterval = setInterval(function (timer) {
            var timer = timer;
            return function () {
                timer.span.innerHTML = timer.timerText;
                if (timer.isElapsed) {
                    timer.div.addClass("red");
                    clearInterval(timer.timerInterval);
                    timer.settings.disableAllInputs();
                }
            };
        }(this), 900);
        return this.div;
    }
    get timerText() {
        if (this.isElapsed) {
            return "TIME EXPIRED";
        }
        var delta = Math.abs(this.endTime.valueOf() - new Date().valueOf()) / 1000;
        var days = Math.floor(delta / 86400);
        var daysString = days == 0 ? "" : days.toString() + " d ";
        delta -= days * 86400;
        var hours = Math.floor(delta / 3600) % 24;
        var hoursString = hours == 0 ? "" : hours.toString() + " h ";
        delta -= hours * 3600;
        var minutes = Math.floor(delta / 60) % 60;
        var minutesString = minutes.toString() + " m ";
        delta -= minutes * 60;
        var seconds = Math.floor(delta % 60);
        var secondsString = seconds.toString() + " s";
        return daysString + hoursString + minutesString + secondsString;
    }
    get isElapsed() {
        return this.endTime.valueOf() < new Date().valueOf();
    }
}
//# sourceMappingURL=assignment.js.map