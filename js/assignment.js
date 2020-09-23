class ICup {
    constructor(parent, tagName, innerHTML) {
        this._innerHTML = "";
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
            this._innerHTML = innerHTML;
        }
        ;
    }
    get outerHTML() {
        return `<${this.tagName} id="${this.UID}" ${this.joinedEvents} ${this.joinedAttributes} ${this.joinedClasses}>${this.innerHTML}</${this.tagName}>`;
    }
    get innerHTML() {
        if (this.getElement(false)) {
            return this._element.innerHTML;
        }
        return this._innerHTML;
    }
    set innerHTML(value) {
        if (this.getElement(false)) {
            this.getElement(false).innerHTML = value;
        }
        this._innerHTML = value;
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
            buffer += ` ${key}="window.cupsById['${this.UID}']._events['${key}'].forEach( e=> e(event) )" `;
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
                return (event) => { eventArray.forEach(e => e(event)); };
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
                this._element[key] = (event) => { this._events[key].forEach(e => e(event)); };
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
        this._innerHTML = text;
    }
}
class OptionCup extends ICup {
    constructor(parent, value, text, isSelected) {
        super(parent, "option", text);
        this.attributes["value"] = value;
        this.attributes["selected"] = isSelected;
    }
}
class CanvasCup extends ICup {
    constructor(parent) {
        super(parent, "canvas");
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
        helpers.removeFromArray(child._parent._childNodes, child);
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
    }
    static fromString(parent, hasBorder, str) {
        let ret = new TableCup(parent, hasBorder, []);
        ret._childNodes = str.split("\n").map(s => { return RowCup.fromString(ret, s); });
        return ret;
    }
}
class RowCup extends Container {
    constructor(parent, childNodes) {
        super(parent, "tr", childNodes);
    }
    static fromString(parent, str) {
        let ret = new RowCup(parent, []);
        ret._childNodes = str.split("|").slice(1).map(s => { return new CellCup(ret, [s]); });
        return ret;
    }
}
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
class UnderlineCup extends Container {
    constructor(parent, str) { super(parent, "span", [str]); this.addClass("underline"); }
}
class BoldCup extends Container {
    constructor(parent, str) { super(parent, "span", [str]); this.addClass("bold"); }
}
class SuperScriptCup extends Container {
    constructor(parent, str) { super(parent, "span", [str]); this.addClass("superscript"); }
}
class SubScriptCup extends Container {
    constructor(parent, str) { super(parent, "span", [str]); this.addClass("subscript"); }
}
class HeadingCup extends Container {
    constructor(parent, str) { super(parent, "p", [str]); this.addClass("heading"); }
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
        this._element = div;
        this.settings = settingsObj;
        this.settings.assignment = this;
        this._childNodes = [];
        if (this.settings.title && !Settings.instance.presentMode) {
            this._childNodes.push(new BreakCup(this));
            this._childNodes.push(new HeadingCup(this, this.settings.title));
            window.document.title = this.settings.title;
        }
        if (this.settings.studentPicker) {
            this._childNodes.push(this.settings.studentPicker.createDiv(this));
        }
        if (Settings.instance.allowCountdownTimer) {
            this._childNodes.push(Settings.instance.countdownTimerLogic.createDiv(this));
        }
        this._childNodes.push(Settings.instance.calculatorLogic.createDiv(this));
        this.questionsDiv = new Container(this, "div").addClass("questionsDiv");
        this._childNodes.push(this.questionsDiv);
        if (this.settings.presentMode) {
            this.questionsDiv.addClass("slides");
            this.getElement(true).classList.add("reveal");
        }
        else {
            if (!this.settings.instantChecking) {
                this.submitButtonDiv = new Container(this, "div");
                this._childNodes.push(this.submitButtonDiv);
            }
            if (this.settings.showSolutions) {
                this.solutionsDiv = new Container(this, "div").addClass("solutionsDiv");
                this._childNodes.push(new HeadingCup(this, "solutions"));
                this._childNodes.push(this.solutionsDiv);
            }
            if (this.settings.timerLogic) {
                this._childNodes.push(this.settings.timerLogic.createDiv(this));
            }
            QuestionNumberLogic.createCountdownDiv(this);
        }
        if (this.settings.questionJSON) {
            var rows = JSON.parse(this.settings.questionJSON);
            this.addRowsFromData(rows);
            if (this.settings.shuffleQuestions) {
                this.shuffle(false);
            }
            if (this.settings.truncateMarks > 0) {
                this.truncate(this.settings.truncateMarks);
            }
        }
        if (!this.settings.instantChecking) {
            this.submitButtonAndFinalScoreLogic = new SubmitButtonAndFinalScoreLogic(this.settings);
            this.submitButtonDiv._childNodes = [this.submitButtonAndFinalScoreLogic.createDiv(this)];
        }
        this.refresh();
        if (this.settings.presentMode)
            window["Reveal"].initialize({ transition: 'linear' });
    }
    addRowsFromData(rowData) {
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
    duplicateRow(QL) {
        let newQL = new QuestionLogic(QL.rowData, this.settings, QL);
        let newQD = newQL.createQuestionDiv(this.questionsDiv);
        this.questionsDiv.appendChildElement(newQD, QL.questionDiv);
        let newSD = newQL.createSolutionDiv(this.questionsDiv);
        if (this.solutionsDiv)
            this.solutionsDiv.appendChildElement(newSD, QL.solutionDiv);
    }
    shuffle(shuffleQuestionNumbers) {
        let seed = this.settings.random.next();
        this.questionsDiv.shuffleChildren(new Random(seed));
        if (this.solutionsDiv)
            this.solutionsDiv.shuffleChildren(new Random(seed));
        if (shuffleQuestionNumbers) {
            helpers.shuffleInPlace(QuestionNumberLogic.instances, new Random(seed));
            QuestionNumberLogic.instances.forEach(q => q.refreshSpans());
        }
    }
    resetQuestionOrder() {
        for (let ql of QuestionLogic.readOnlyInstances) {
            this.questionsDiv.appendChildElement(ql.questionDiv);
            if (this.solutionsDiv)
                this.solutionsDiv.appendChildElement(ql.solutionDiv);
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
            n = prompt("enter number of marks you want left over", "10");
        }
        let i = 0;
        while (QuestionLogic.readOnlyInstances[i] &&
            (QuestionLogic.readOnlyInstances[i].commentLogic == undefined || n >= helpers.lengthOfObject(QuestionLogic.readOnlyInstances[i].commentLogic.scoreLogicsWithCommentLetters))) {
            if (QuestionLogic.readOnlyInstances[i].commentLogic) {
                n -= helpers.lengthOfObject(QuestionLogic.readOnlyInstances[i].commentLogic.scoreLogicsWithCommentLetters);
            }
            i++;
        }
        let lastQn = QuestionLogic.readOnlyInstances[i];
        if (lastQn && lastQn.commentLogic) {
            let scoreLogics = helpers.getValuesFromObject(lastQn.commentLogic.scoreLogicsWithCommentLetters);
            if (n > 0) {
                lastQn.commentLogic.truncate(scoreLogics.length - n);
            }
        }
        if (n > 0) {
            i++;
        }
        QuestionLogic.readOnlyInstances.slice(i).forEach(ql => ql.destroy());
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
    get questionNumbers() {
        return QuestionNumberLogic.instances.reduce((a, b) => a.concat(b.columnHeaders), []);
    }
    get currentQuestionData() {
        return QuestionLogic.readOnlyInstances.map(ql => ql.rowData);
    }
}
class CalculatorBase {
    constructor() { }
    moveAfterQuestion(ql) {
        let index = ql.questionDiv._childNodes.indexOf(this.div);
        if (index != -1 && this.div.classes.indexOf("displayNone") == -1) {
            this.div.addClass("displayNone");
        }
        else {
            this.div.removeClass("displayNone");
            ql.questionDiv.appendChildElement(this.div);
            this.div._parent = ql.questionDiv;
        }
    }
}
class CalculatorLogic extends CalculatorBase {
    constructor() {
        super();
        this.helpText = `Type the calculation in. Press Enter to calculate. Supports: 
    operations + - * /
    E notation e.g. 5e-4 the same as 0.0005  
    functions sqrt() exp() ln() pow()
    trig functions sin() cos() tan() arcsin() arccos() arctan() in degrees
    variables e.g. x = 9.
    constants pi, e`;
        this.customFunctions = `
        var sqrt = Math.sqrt;
        var ln = Math.log;
        var exp = Math.exp;
        var sin = function(n) {return Math.sin(n/180*Math.PI)}
        var cos = function(n) {return Math.cos(n/180*Math.PI)}
        var tan = function(n) {return Math.tan(n/180*Math.PI)}
        var asin = arcsin = function(n) {return 180*Math.asin(n)/Math.PI}
        var acos = arccos = function(n) {return 180*Math.acos(n)/Math.PI}
        var atan = arctan = function(n) {return 180*Math.atan(n)/Math.PI}
        var pi = Math.PI;
        var e = Math.E;
        var pow = Math.pow;
        
    `;
        this.interpreter = new Interpreter(this.customFunctions);
    }
    createDiv(parent) {
        this.div = new Container(parent, "div").addClass("calculatorContainer").addClass("displayNone");
        this.maxHeightBlock = new Container(this.div, "div").addClass("calculatorOutput");
        this.output = new Span(this.div, "");
        this.maxHeightBlock.appendChildElement(this.output);
        this.errorSpan = new Span(this.div, "");
        this.image = new Icon(this.div, IconName.help).setAttribute("title", this.helpText);
        this.input = new InputCup(parent, 20, this.image, this.errorSpan).addClass("calculatorInput");
        this.input.setEvent("onkeyup", (e) => {
            this.checkEnterKey(e);
        });
        this.div._childNodes = [this.maxHeightBlock, this.input, this.image];
        return this.div;
    }
    checkEnterKey(event) {
        if (event.keyCode === 13 && this.input.getValue()) {
            event.preventDefault();
            var input = this.input.getValue();
            var result = "";
            var i;
            try {
                this.interpreter.appendCode(input);
                i = 100000;
                while (i-- && this.interpreter.step()) { }
                result = this.interpreter.value;
            }
            catch (e) {
                result = "Error:code did not execute completely";
                this.interpreter = new Interpreter(this.customFunctions);
            }
            if (i == -1) {
                result = "Error: Code contains an infinite loop";
                this.interpreter = new Interpreter(this.customFunctions);
            }
            this.output.innerHTML += (input + " => " + result + "\n");
            this.maxHeightBlock.getElement(true).scrollTo(0, 1000);
        }
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
            if (this.interpreter.value === undefined) {
                evaluated = undefined;
            }
            else {
                evaluated = JSON.stringify(this.interpreter.value);
            }
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
        this.dollarCupsAndImagesWithCommentLetters = {};
        this.checkBoxesWithCommentLetters = {};
        this.footbotsWithCommentLetters = {};
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
                let foobotMatches = c.match(/foobot/);
                let commentLetter = helpers.lowerCaseLetterFromIndex(i);
                if (codeMatches) {
                    this.jsFunctionNamesWithCommentLetters[commentLetter] = codeMatches[1].toLowerCase();
                }
                else if (foobotMatches) {
                    this.footbotsWithCommentLetters[commentLetter] = valueFields[i];
                    commentsWithLetters[commentLetter] = c;
                    if (!(valueFields[i] instanceof fooBotCanvas)) {
                        throw "foobot canvas not found";
                    }
                    ;
                }
                else if (variableMatches) {
                    variableNamesWithCommentLetters[commentLetter] = variableMatches[1];
                }
                else {
                    commentsWithLetters[commentLetter] = c;
                }
                this.engine = new ExpressionEngine(commentsWithLetters, this.jsFunctionNamesWithCommentLetters, variableNamesWithCommentLetters, this.footbotsWithCommentLetters, this);
            }
        }
        if (purpose == "sudoku") {
            let variablesToKeepAsDollars = (this.engine.variablesToKeepAsDollars(this.seed));
            for (let i = 0; i < variablesToKeepAsDollars.length; i++) {
                if (!variablesToKeepAsDollars[i]) {
                    if (valueFields[i] instanceof DollarSpan) {
                        valueFields[i] = valueFields[i].swapForInput();
                    }
                    if (valueFields[i] instanceof DollarImage) {
                        throw ("cannot exchange an image for an input element");
                    }
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
                if (commentLetter in this.jsFunctionNamesWithCommentLetters) {
                    this.questionLogic.questionNumberLogic.registerField(v);
                }
                else if (commentLetter in variableNamesWithCommentLetters) {
                }
                else {
                    this.questionLogic.questionNumberLogic.registerField(v);
                }
            }
            if (v instanceof CheckBoxCup || v instanceof fooBotCanvas) {
                this.checkBoxesWithCommentLetters[commentLetter] = v;
                this.questionLogic.questionNumberLogic.registerField(v);
            }
            if (v instanceof DollarSpan || v instanceof DollarImage) {
                this.dollarCupsAndImagesWithCommentLetters[commentLetter] = v;
            }
            if (v instanceof ComboCup ||
                v instanceof InputCup ||
                v instanceof TextAreaCup ||
                v instanceof CheckBoxCup ||
                v instanceof RadioSet ||
                v instanceof fooBotCanvas) {
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
        this.seed = Settings.instance.random.next();
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
    onResponseFieldClickAway(fooBotComplete) {
        let inputValues = this.getInputValues();
        let outputValues = this.calculate(inputValues, fooBotComplete);
        if (outputValues) {
            this.updateDollars(outputValues);
            this.sendToScoreLogics(inputValues, outputValues);
            if (Settings.instance.sendScoresToMarksheet) {
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
                this.questionLogic.questionNumberLogic.addFieldToSendBuffer(this.inputsWithCommentLetters[letter], this.scoreLogicsWithCommentLetters[letter]);
            }
        }
        for (let key in this.checkBoxesWithCommentLetters) {
            this.questionLogic.questionNumberLogic.addFieldToSendBuffer(this.checkBoxesWithCommentLetters[key], this.scoreLogicsWithCommentLetters[key]);
        }
        QuestionNumberLogic.attemptToSend();
    }
    updateDollars(outputValues) {
        for (let key in this.dollarCupsAndImagesWithCommentLetters) {
            if (key in outputValues) {
                if (this.dollarCupsAndImagesWithCommentLetters[key] instanceof DollarSpan) {
                    this.dollarCupsAndImagesWithCommentLetters[key].setValue(outputValues[key]);
                }
                if (this.dollarCupsAndImagesWithCommentLetters[key] instanceof DollarImage) {
                    this.dollarCupsAndImagesWithCommentLetters[key].setValue(outputValues[key]);
                }
            }
        }
    }
    getInputValues() {
        let ret = {};
        for (let key in this.inputsWithCommentLetters) {
            ret[key] = this.inputsWithCommentLetters[key].getValue();
            if (ret[key] == undefined)
                ret[key] = '""';
        }
        return ret;
    }
    calculate(inputValues, fooBotComplete) {
        let outputs = null;
        try {
            outputs = this.engine.calculate(inputValues, this.seed, fooBotComplete);
        }
        catch (e) {
            if (e instanceof ExpressionError) {
                if (e.isCritical) {
                    this.questionLogic.questionDiv.contentDiv.destroyAllChildren();
                    this.questionLogic.questionDiv.contentDiv.appendChildString(`There is an error in this question's comment cell which is preventing it from calculating the solutions.\n Error detail: ${e.message}`);
                    this.questionLogic.questionDiv.contentDiv.addClass("red");
                }
                return null;
            }
            else {
                throw (e);
            }
        }
        this.questionLogic.questionDiv.contentDiv.removeClass("red");
        for (let letter in this.inputsWithCommentLetters) {
            this.inputsWithCommentLetters[letter].resetError();
        }
        for (let letter in this.checkBoxesWithCommentLetters) {
            this.checkBoxesWithCommentLetters[letter].resetError();
        }
        for (let letter in this.dollarCupsAndImagesWithCommentLetters) {
            this.dollarCupsAndImagesWithCommentLetters[letter].resetError();
        }
        for (let letter in outputs) {
            if (letter in this.inputsWithCommentLetters &&
                outputs[letter] instanceof ExpressionError) {
                this.inputsWithCommentLetters[letter].setErrorText(outputs[letter].message);
                outputs[letter] = "";
                outputs = null;
            }
            if (letter in this.checkBoxesWithCommentLetters &&
                outputs[letter] instanceof ExpressionError) {
                this.checkBoxesWithCommentLetters[letter].setErrorText(outputs[letter].message);
                outputs[letter] = "";
                outputs = null;
            }
            if (letter in this.dollarCupsAndImagesWithCommentLetters &&
                outputs[letter] instanceof ExpressionError) {
                this.dollarCupsAndImagesWithCommentLetters[letter].setErrorText(outputs[letter].message);
                outputs[letter] = "";
                outputs = null;
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
            if (this.solutionLines[letter])
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
}
CommentLogic.instances = [];
class Connection {
    constructor(url, user, workbookSheetString) {
        Connection.instance = this;
        this.url = url;
        this.user = user;
        this.workbookSheetString = workbookSheetString;
    }
    getMarkbookSettings(onSuccess, onFail, userOverride) {
        var data = {
            action: "getMarkbookSettings",
            workbookSheetString: this.workbookSheetString,
            user: userOverride ? userOverride : this.user
        };
        this.sendRequestAndFail(this.url, data, onSuccess, onFail);
    }
    checkRequest(onSuccess, onRetry) {
        var object = {
            "action": "checkRequest",
            "workbookSheetString": this.workbookSheetString,
            "user": this.user,
            "startTimeAsNumber": Number(Settings.instance.startTime)
        };
        this.sendRequestAndRetry(this.url, object, onSuccess, onRetry);
    }
    pageRequest(onSuccess) {
        var object = {
            "action": "pageRequest",
            "workbookSheetString": this.workbookSheetString,
            "user": this.user,
            "startTimeAsNumber": Number(Settings.instance.startTime)
        };
        this.sendRequestAndFail(this.url, object, onSuccess, () => { });
    }
    writeToSheet(onSuccess, onRetry, scores) {
        var object = {
            "action": "writeToSheet",
            "workbookSheetString": this.workbookSheetString,
            "user": this.user,
            "startTimeAsNumber": Number(Settings.instance.startTime),
            "scores": JSON.stringify(scores)
        };
        this.sendRequestAndRetry(this.url, object, onSuccess, onRetry);
    }
    sendRequestAndFail(url, object, onSuccess, onFail) {
        var queryString = "?";
        for (var key in object) {
            queryString += key + "=" + encodeURIComponent(object[key]) + "&";
        }
        let scriptElement = document.createElement("script");
        scriptElement.type = 'text/javascript';
        scriptElement.onerror = function (scriptElement, onFail) {
            var onFail = onFail;
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
    }
    sendRequestAndRetry(url, object, onSuccess, onRetry) {
        var queryString = "?";
        for (var key in object) {
            queryString += key + "=" + encodeURIComponent(object[key]) + "&";
        }
        let scriptElement = document.createElement("script");
        scriptElement.type = 'text/javascript';
        scriptElement.onerror = function (connection, object, onSuccess, scriptElement, onRetry) {
            var connection = connection;
            var object = object;
            var onSuccess = onSuccess;
            var scriptElement = scriptElement;
            var onRetry = onRetry;
            return (data) => {
                if (onRetry)
                    onRetry(data);
                document.body.removeChild(scriptElement);
                setTimeout(() => connection.sendRequestAndRetry(url, object, onSuccess, onRetry), 1000);
            };
        }(this, object, onSuccess, scriptElement, onRetry);
        let random = Math.random().toString().substring(2);
        window["callback"] = function (scriptElement, onSuccess) {
            var scriptElement = scriptElement;
            var onSuccess = onSuccess;
            return (data) => {
                onSuccess(data);
                scriptElement.remove();
            };
        }(scriptElement, onSuccess);
        scriptElement.src = url + queryString + "prefix=callback";
        document.body.appendChild(scriptElement);
    }
}
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
                d instanceof DollarSpan ||
                d instanceof DollarImage ||
                d instanceof fooBotCanvas) {
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
            return [TableCup.fromString(parent, hasBorder, str)];
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
        "pattern": /((?:\n|^)#[^\n]+)/,
        "nodeConstructorFromMatch": (parent, str) => {
            str = helpers.trimChar(str, "#");
            return [new HeadingCup(parent, str)];
        },
    },
    {
        "pattern": /(\^[\S\$]+)/,
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
        "pattern": /(!\[[^\]]*\]\(\$\$\))/,
        "nodeConstructorFromMatch": (parent, str) => {
            let alt = "";
            let width = "";
            let dummy = "";
            [, alt, width] = str.match(/!\[([^\],]*),?([^\]]*)\]/);
            return [new DollarImage(parent, alt, width)];
        },
    },
    {
        "pattern": /(\$\$)/,
        "nodeConstructorFromMatch": (parent, str) => {
            return [new DollarSpan(parent)];
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
        "pattern": /(\[foobot\])/,
        "nodeConstructorFromMatch": (parent, str) => {
            return [new fooBotCanvas(parent)];
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
    }
];
class CountdownTimerLogic extends CalculatorBase {
    constructor() {
        super();
        this.helpText = "Enter time in secs or mins:secs. \n Press Enter to start countdown.";
    }
    createDiv(parent) {
        this.div = new Container(parent, "div");
        this.div.addClass("countdownTimerContainer").addClass("displayNone");
        let errorSpan = new Span(this.div, "");
        let image = new Icon(this.div, IconName.help).setAttribute("title", this.helpText);
        ;
        this.input = new InputCup(parent, 20, image, errorSpan).addClass("countdownTimerInput");
        this.input.setEvent("onkeyup", (e) => {
            this.onKeyUp(e);
        });
        this.input.setEvent("onfocus", () => {
            this.onFocus();
        });
        this.div._childNodes = [this.input, image];
        return this.div;
    }
    onFocus() {
        this.input.removeClass("red").removeClass("blink");
        if (this.lastEnteredValue) {
            this.input.setValue(this.lastEnteredValue);
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    onKeyUp(event) {
        if (event.keyCode === 13 && this.input.getValue()) {
            this.input.getElement(true).blur();
            event.preventDefault();
            var durationString = this.input.getValue();
            this.lastEnteredValue = durationString;
            var patt = /([0-9]*):?([0-9]*)/;
            var result = patt.exec(durationString);
            let seconds = null;
            if (result[2]) {
                seconds += Number(result[2]) + 60 * Number(result[1]);
            }
            else {
                seconds = Number(result[1]);
            }
            if (helpers.isNumeric(seconds)) {
                let endTime = new Date(Number(new Date()) + 1000 * seconds);
                if (endTime) {
                    this.startCounting(endTime);
                }
            }
        }
    }
    startCounting(endTime) {
        this.endTime = endTime;
        this.timerInterval = setInterval(function (timer) {
            var timer = timer;
            return function () {
                timer.input.setValue(timer.timerText);
                if (timer.isElapsed) {
                    timer.input.addClass("red").addClass("blink");
                    clearInterval(timer.timerInterval);
                }
            };
        }(this), 900);
    }
    get timerText() {
        if (this.isElapsed) {
            return "TIME UP";
        }
        var delta = Math.abs(Number(this.endTime) - Number(new Date())) / 1000;
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        var seconds = Math.floor(delta % 60);
        return minutes.toString() + ":" + ("0" + seconds.toString()).slice(-2);
    }
    get isElapsed() {
        return Number(this.endTime) < Number(new Date());
    }
}
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
                        buffer += JSON.stringify(val);
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
    if (str == "" || str == undefined || str == "undefined") {
        return "undefined";
    }
    let obj = undefined;
    try {
        obj = JSON.parse(str);
    }
    catch (e) {
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
                this.eval = function (injector) { return "true"; };
            }
            else if (this.functionName == "false") {
                this.eval = function (injector) { return "false"; };
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
        if (this.functionName == "mean" || this.functionName == "average") {
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
        if (this.functionName == "foobot") {
            let commentLetter = evaluatedParameters[0];
            if (!injector.foobotsWithCommentLetters[commentLetter])
                throw new ExpressionError("foobot with letter " + commentLetter + " not found", false, true);
            if (!evaluatedParameters[1])
                throw new ExpressionError("foobot map argument #2 not defined", false, true);
            if (!injector.fooBotComplete) {
                if (!injector.foobotsWithCommentLetters[commentLetter].initialised) {
                    injector.foobotsWithCommentLetters[commentLetter].initialise(evaluatedParameters[1]);
                    return "null";
                }
                else {
                    injector.foobotsWithCommentLetters[commentLetter].run(evaluatedParameters[2], function (injector) {
                        var injector = injector;
                        return () => injector.commentLogic.onResponseFieldClickAway(true);
                    }(injector));
                    throw new ExpressionError("running game...", true, false);
                }
            }
            else {
                return JSON.stringify(injector.foobotsWithCommentLetters[commentLetter].getCurrentMap());
            }
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
    calculate(inputs, seed, fooBotComplete) {
        return this.correctAnswers;
    }
}
class ExpressionEngine {
    constructor(commentsWithLetters, jsFunctionsWithLetters, variableNamesWithLetters, footbotsWithCommentLetters, commentLogic) {
        this.overflowCounter = 0;
        this.OVERFLOW_LIMIT = 1000;
        this.allVariablesAndFunctions = {};
        this.numVariables = 0;
        this.jsFunctionsWithLetters = jsFunctionsWithLetters;
        this.variableNamesWithLetters = variableNamesWithLetters;
        this.foobotsWithCommentLetters = footbotsWithCommentLetters;
        this.commentLogic = commentLogic;
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
    calculate(inputs, seed, fooBotComplete) {
        this.random = new Random(seed);
        this.indexForListEvaluation = this.random.next();
        this.overflowCounter = 0;
        for (let letter in this.allVariablesAndFunctions) {
            if (this.allVariablesAndFunctions[letter] instanceof IExpression) {
                this.allVariablesAndFunctions[letter]._value = undefined;
            }
        }
        this.fooBotComplete = fooBotComplete ? true : false;
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
                    else {
                        throw (e);
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
class Robot extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y, []);
        this.lookingIndex = 0;
        this.isScoopDown = true;
        this.carryingFruit = null;
        scene.add.existing(this);
        this.body = new Phaser.GameObjects.Sprite(scene, 0, 0, "body", "RightLowered");
        this.add(this.body);
        this.setDepth(10);
    }
    ahead(onComplete, repeats) {
        if (this.isLookingOutOfBounds) {
            if (onComplete)
                onComplete();
            return;
        }
        this.scene.tweens.add({
            targets: this,
            x: this.x + Robot.lookingX[this.lookingIndex] * TILE_SIZE,
            y: this.y + Robot.lookingY[this.lookingIndex] * TILE_SIZE,
            duration: Robot.duration, ease: Robot.ease, repeat: 0, yoyo: false, paused: false,
            onComplete: repeats > 1 ?
                this.ahead.bind(this, onComplete, repeats - 1) :
                onComplete
        });
    }
    back(onComplete, repeats) {
        if (this.isLookingOutOfBoundsBackwards) {
            if (onComplete)
                onComplete();
            return;
        }
        this.scene.tweens.add({
            targets: this,
            x: this.x - Robot.lookingX[this.lookingIndex] * TILE_SIZE,
            y: this.y - Robot.lookingY[this.lookingIndex] * TILE_SIZE,
            duration: Robot.duration, ease: Robot.ease, repeat: 0, yoyo: false, paused: false,
            onComplete: repeats > 1 ?
                this.back.bind(this, onComplete, repeats - 1) :
                onComplete
        });
    }
    right(onComplete, repeats) {
        this.lookingIndex = (this.lookingIndex + 1) % 4;
        this.refreshFrame();
        if (repeats > 1) {
            setTimeout(this.right.bind(this, onComplete, repeats - 1), Robot.duration / 2);
        }
        else {
            setTimeout(onComplete, Robot.duration / 2);
        }
    }
    left(onComplete, repeats) {
        this.lookingIndex = (this.lookingIndex + 3) % 4;
        this.refreshFrame();
        if (repeats > 1) {
            setTimeout(this.left.bind(this, onComplete, repeats - 1), Robot.duration / 2);
        }
        else {
            setTimeout(onComplete, Robot.duration / 2);
        }
    }
    peek(onComplete) {
        let fruit = this.getLookingFruit();
        setTimeout(onComplete, Robot.duration / 2);
        if (fruit)
            return this.scene.getFruitCode(fruit);
        return null;
    }
    raise(onComplete) {
        if (!this.isScoopDown) {
            if (onComplete)
                onComplete();
            return;
        }
        let moveTowardsTween = this.scene.tweens.create({
            targets: this,
            x: { from: this.x, to: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0) },
            y: { from: this.y, to: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance) },
            duration: Robot.duration / 2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });
        let liftScoopInjector = function (paramOnCompleteTween, robot, fruit) {
            var paramOnCompleteTween = paramOnCompleteTween;
            var robot = robot;
            return () => {
                robot.isScoopDown = false;
                robot.refreshFrame();
                if (fruit) {
                    robot.add(fruit);
                    robot.scene.food.remove(fruit);
                    fruit.setPosition(0, -Robot.carryingHeight);
                }
                if (paramOnCompleteTween)
                    paramOnCompleteTween.play();
            };
        };
        let moveAwayTween = this.scene.tweens.create({
            targets: this,
            x: { to: this.x, from: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0) },
            y: { to: this.y, from: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance) },
            duration: Robot.duration / 2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });
        let fruit = this.getLookingFruit();
        this.carryingFruit = fruit;
        if (onComplete)
            moveAwayTween.on("complete", onComplete);
        moveTowardsTween.on("complete", liftScoopInjector(moveAwayTween, this, fruit));
        moveTowardsTween.play();
    }
    lower(onComplete) {
        if (this.isScoopDown) {
            if (onComplete)
                onComplete();
            return;
        }
        let moveTowardsTween = this.scene.tweens.create({
            targets: this,
            x: { from: this.x, to: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0) },
            y: { from: this.y, to: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance) },
            duration: Robot.duration / 2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });
        let liftScoopInjector = function (paramOnCompleteTween, robot, fruit) {
            var paramOnCompleteTween = paramOnCompleteTween;
            var robot = robot;
            return () => {
                robot.isScoopDown = true;
                robot.refreshFrame();
                if (fruit) {
                    let endFruitX = Robot.lookingX[robot.lookingIndex] * (TILE_SIZE - Robot.raiseAndLowerDistance);
                    let endFruitY = Robot.lookingY[robot.lookingIndex] * (TILE_SIZE - Robot.raiseAndLowerDistance);
                    robot.remove(fruit);
                    fruit.setPosition(robot.x + endFruitX, robot.y + endFruitY);
                    robot.scene.add.existing(fruit);
                    robot.scene.food.add(fruit);
                }
                if (paramOnCompleteTween)
                    paramOnCompleteTween.play();
            };
        };
        let moveAwayTween = this.scene.tweens.create({
            targets: this,
            x: { to: this.x, from: this.x + (this.isSideView ? Robot.lookingX[this.lookingIndex] * Robot.raiseAndLowerDistance : 0) },
            y: { to: this.y, from: this.y + (this.isSideView ? 0 : Robot.lookingY[this.lookingIndex] * Robot.raiseAndLowerDistance) },
            duration: Robot.duration / 2, ease: Robot.ease, repeat: 0, yoyo: false, paused: false
        });
        let fruit = this.carryingFruit;
        this.carryingFruit = null;
        if (onComplete)
            moveAwayTween.on("complete", onComplete);
        moveTowardsTween.on("complete", liftScoopInjector(moveAwayTween, this, fruit));
        moveTowardsTween.play();
    }
    get mapCoords() { return this.scene.getMapCoords(this.x, this.y); }
    ;
    get lookingMapCoords() {
        let [i, j] = this.mapCoords;
        return [i + Robot.lookingX[this.lookingIndex], j + Robot.lookingY[this.lookingIndex]];
    }
    get lookingMapCoordsBehind() {
        let [i, j] = this.mapCoords;
        return [i + Robot.lookingX[(this.lookingIndex + 2) % 4], j + Robot.lookingY[(this.lookingIndex + 2) % 4]];
    }
    get lookingPosition() {
        return [this.x + Robot.lookingX[this.lookingIndex] * TILE_SIZE, this.y + Robot.lookingY[this.lookingIndex] * TILE_SIZE];
    }
    get isLookingRight() { return this.lookingIndex == 0; }
    get isSideView() { return this.lookingIndex == 0 || this.lookingIndex == 2; }
    get isLookingDown() { return this.lookingIndex == 1; }
    get isLookingOutOfBounds() {
        let [i, j] = this.lookingMapCoords;
        return i < 0 || i > this.scene.maxI || j < 0 || j > this.scene.maxJ;
    }
    get isLookingOutOfBoundsBackwards() {
        let [i, j] = this.lookingMapCoordsBehind;
        return i < 0 || i > this.scene.maxI || j < 0 || j > this.scene.maxJ;
    }
    getLookingFruit() {
        let lookingCoords = this.lookingPosition;
        for (let fruit of this.scene.food.getChildren()) {
            if (fruit.x == lookingCoords[0] && fruit.y == lookingCoords[1]) {
                return (fruit);
            }
        }
        ;
    }
    refreshFrame() {
        this.body.setFrame(Robot.lookingBodyFrames[this.isScoopDown ? 1 : 0][this.lookingIndex]);
    }
    runCode(myCode, onComplete) {
        var robot = this;
        var initFunc = (interpreter, globalObject) => {
            var aheadWrapper = function (repeats) {
                robot.moving = true;
                robot.ahead(() => { robot.moving = false; robot.nextStep(); }, repeats);
            };
            interpreter.setProperty(globalObject, 'ahead', interpreter.createNativeFunction(aheadWrapper));
            var backWrapper = function (repeats) {
                robot.moving = true;
                robot.back(() => { robot.moving = false; robot.nextStep(); }, repeats);
            };
            interpreter.setProperty(globalObject, 'back', interpreter.createNativeFunction(backWrapper));
            var rightWrapper = function (repeats) {
                robot.moving = true;
                robot.right(() => { robot.moving = false; robot.nextStep(); }, repeats);
            };
            interpreter.setProperty(globalObject, 'right', interpreter.createNativeFunction(rightWrapper));
            var leftWrapper = function (repeats) {
                robot.moving = true;
                robot.left(() => { robot.moving = false; robot.nextStep(); }, repeats);
            };
            interpreter.setProperty(globalObject, 'left', interpreter.createNativeFunction(leftWrapper));
            var raiseWrapper = function () {
                robot.moving = true;
                robot.raise(() => { robot.moving = false; robot.nextStep(); });
            };
            interpreter.setProperty(globalObject, 'raise', interpreter.createNativeFunction(raiseWrapper));
            var lowerWrapper = function () {
                robot.moving = true;
                robot.lower(() => { robot.moving = false; robot.nextStep(); });
            };
            interpreter.setProperty(globalObject, 'lower', interpreter.createNativeFunction(lowerWrapper));
            var peekWrapper = function () {
                robot.moving = true;
                return robot.peek(() => { robot.moving = false; robot.nextStep(); });
            };
            interpreter.setProperty(globalObject, 'peek', interpreter.createNativeFunction(peekWrapper));
            var logWrapper = function (str) {
                console.log(str);
            };
            interpreter.setProperty(globalObject, 'log', interpreter.createNativeFunction(logWrapper));
        };
        this.myInterpreter = newInterpreter(myCode, initFunc);
        this.onComplete = onComplete;
        setTimeout(this.nextStep.bind(this), Robot.duration / 2);
    }
    nextStep() {
        while (!this.moving && this.myInterpreter.step()) {
        }
        ;
        if (!this.moving && this.onComplete) {
            this.onComplete();
        }
    }
}
Robot.ease = 'Cubic.easeInOut';
Robot.duration = 1000;
Robot.lookingX = [1, 0, -1, 0];
Robot.lookingY = [0, 1, 0, -1];
Robot.lookingBodyFrames = [["RightRaised", "DownRaised", "LeftRaised", "UpRaised"],
    ["RightLowered", "DownLowered", "LeftLowered", "UpLowered"]];
Robot.raiseAndLowerDistance = 32;
Robot.carryingHeight = 32;
const MAP_ROW_DELIMITER = ":";
const MAP_COL_DELIMITER = ",";
const TILE_SIZE = 64;
const TILE_OFFSET = 64;
const FOOD_SCALE = 0.75;
const floorMapTextureCodes = {
    "_": ["sprite1", "sprite2", "sprite3", "sprite4"]
};
const foodMapTextureCodes = {
    "a": "apple",
    "b": "banana",
    "c": "cherry",
    "d": "dragonBallOrange"
};
class Scene1 extends Phaser.Scene {
    constructor(levelMap) {
        super({
            key: 'sceneA',
            active: true,
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                }
            },
        });
        Scene1.instance = this;
        this.levelMap = levelMap;
    }
    preload() {
        if (document.getElementById("base"))
            this.load.setBaseURL(document.getElementById("base").href);
        this.load.image("bg", "images/BG.png");
        this.load.atlas("body", "images/foobotSpriteSheet.png", "images/foobotSpriteSheet.json");
        this.load.atlas("food", "images/foodSpriteSheet64.png", "images/foodSpriteSheet64.json");
        this.load.atlas("floor", "images/floorSpriteSheet.png", "images/floorSpriteSheet.json");
    }
    create() {
        this.player = new Robot(this, 100, 100);
        this.floors = this.physics.add.staticGroup();
        this.food = this.physics.add.group();
        this.add.image(352, 352, "bg").setDepth(-200);
        this.resetMap();
    }
    resetMap() {
        this.floors.clear(true, true);
        this.food.clear(true, true);
        let map = this.levelMap.split(MAP_ROW_DELIMITER).map(s => s.split(MAP_COL_DELIMITER));
        for (let j = 0; j < map.length; j++) {
            let y = TILE_OFFSET + TILE_SIZE / 2 + j * TILE_SIZE;
            for (let i = 0; i < map[j].length; i++) {
                let x = TILE_OFFSET + TILE_SIZE / 2 + TILE_SIZE * i;
                let letters = map[j][i];
                for (let letter of letters) {
                    if (letter in floorMapTextureCodes) {
                        this.floors.create(x, y, 'floor', helpers.getRandomItem(floorMapTextureCodes[letter]));
                    }
                    if (letter in foodMapTextureCodes) {
                        let newFood = this.food.create(x, y, 'food', foodMapTextureCodes[letter]);
                        newFood.setScale(FOOD_SCALE);
                    }
                    if (letter == "r") {
                        this.player.x = x;
                        this.player.y = y;
                    }
                }
            }
        }
        this.game.scale.resize(this.maxX, this.maxY);
        console.log(this.food.getLength());
        this.floors.setDepth(-100);
        this.player.lookingIndex = 0;
        if (this.player.carryingFruit)
            this.player.carryingFruit.destroy();
        this.player.isScoopDown = true;
        this.player.refreshFrame();
    }
    get maxX() { return Math.max(...this.floors.children.entries.map(e => e.x + TILE_SIZE / 2)); }
    get maxY() { return Math.max(...this.floors.children.entries.map(e => e.y + TILE_SIZE / 2)); }
    get maxI() { return Math.round((this.maxX - TILE_OFFSET) / TILE_SIZE) - 1; }
    ;
    get maxJ() { return Math.round((this.maxY - TILE_OFFSET) / TILE_SIZE) - 1; }
    ;
    getMap() {
        let rows = Array(this.maxJ + 1).fill(1).map(e => Array(this.maxI + 1).fill(""));
        this.food.getChildren().forEach(fruit => {
            if (this.player.carryingFruit == null || fruit != this.player.carryingFruit) {
                let [i, j] = this.getMapCoords(fruit.x, fruit.y);
                rows[j][i] += this.getFruitCode(fruit);
            }
        });
        this.floors.getChildren().forEach(element => {
            let [i, j] = this.getMapCoords(element.x, element.y);
            let texture = element.frame.name;
            for (let key in floorMapTextureCodes) {
                if (floorMapTextureCodes[key].indexOf(texture) > -1) {
                    rows[j][i] += key;
                }
            }
        });
        var ret = rows.map(row => row.join(MAP_COL_DELIMITER)).join(MAP_ROW_DELIMITER);
        console.log(ret);
        return ret;
    }
    getFruitCode(fruit) {
        let texture = fruit.frame.name;
        return helpers.getKeyFromValue(foodMapTextureCodes, texture);
    }
    getMapCoords(x, y) {
        let i = Math.floor((x - TILE_OFFSET) / TILE_SIZE);
        let j = Math.floor((y - TILE_OFFSET) / TILE_SIZE);
        return [i, j];
    }
}
class fooBotGame extends Phaser.Game {
    constructor(levelMap, parentId) {
        let scene = new Scene1(levelMap);
        let config = {
            type: Phaser.AUTO,
            width: 200,
            height: 200,
            autoFocus: true,
            transparent: true,
            parent: parentId,
            url: '',
            title: 'foobot',
            version: '0.0.1',
            scene: [scene]
        };
        super(config);
        this.myScene = scene;
    }
    getCurrentMap() {
        return this.myScene.getMap();
    }
    run(myCode, onComplete) {
        this.myScene.resetMap();
        this.myScene.player.runCode(myCode, onComplete);
    }
}
class fooBotCanvas extends Container {
    constructor(parent) {
        super(parent, "div");
        this.initialised = false;
        this.canvasDiv = new Container(this, "div");
        this.icon = new Icon(this, IconName.none);
        this.errorText = new Span(this, "");
        this.appendChildren([this.canvasDiv, this.icon, this.errorText]);
    }
    initialise(levelMap) {
        this.initialised = true;
        setTimeout(function (container, levelMap) {
            var container = container;
            var levelMap = levelMap;
            return () => { container.game = new fooBotGame(levelMap, container.canvasDiv.UID); };
        }(this, levelMap), 1000);
    }
    run(code, onComplete) {
        if (!this.game)
            return undefined;
        return this.game.run(code, onComplete);
    }
    getCurrentMap() { return this.game.getCurrentMap(); }
    setDecisionImage(value) { this.icon.setIconName(value); }
    setValue(value) { }
    getValue() { return ""; }
    setErrorText(value) {
        this.errorText.innerHTML = value;
        if (value.length > 0)
            this.setDecisionImage(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this.icon.getIconName() == IconName.error) {
            this.setDecisionImage(IconName.none);
        }
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
        return (str == undefined || str == null || typeof (str) != "string" || str.length === 0 || !str.trim());
    };
    var IsStringNullOrWhiteSpace = function (str) {
        return str == undefined || str == null || typeof (str) != "string" || str == "" || str.trim().length == 0;
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
    var getItemImmediatelyBefore = function (arr, after) {
        let index = arr.indexOf(after);
        return index == -1 ? undefined : arr[index - 1];
    };
    var getItemImmediatelyAfter = function (arr, after) {
        let index = arr.indexOf(after);
        return index == -1 ? undefined : arr[index + 1];
    };
    var getRandomItem = function (arr) {
        let index = Math.floor(Math.random() * arr.length);
        return arr[index];
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
    var getKeyFromValue = function (obj, value) {
        for (let key in obj) {
            if (obj[key] == value)
                return key;
        }
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
        getItemImmediatelyBefore: getItemImmediatelyBefore,
        getItemImmediatelyAfter: getItemImmediatelyAfter,
        getRandomItem: getRandomItem,
        removeFromArray: removeFromArray,
        removeCrazySigFigs: removeCrazySigFigs,
        lowerCaseLetterFromIndex: lowerCaseLetterFromIndex,
        toShuffled: toShuffled,
        lengthOfObject: lengthOfObject,
        getValuesFromObject: getValuesFromObject,
        getKeysFromObject: getKeysFromObject,
        getKeyFromValue: getKeyFromValue,
        mergeObjects: mergeObjects
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
    IconName[IconName["calculator"] = 10] = "calculator";
    IconName[IconName["clock"] = 11] = "clock";
    IconName[IconName["help"] = 12] = "help";
    IconName[IconName["rightArrow"] = 13] = "rightArrow";
    IconName[IconName["none"] = 14] = "none";
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
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA6UlEQVQ4y2NgIBL8L2aUA+LrQOzGQCoAamIC4sNA/BeIv5NsCFBDFVSzHxCvhhriQqxmCyD+DcQ1QMwFxFuB+D8QfwViB2wa1IC4EYgXAvFUIL4PxNuBWASIj0I1w/BjdM0FUNtgCs4C8XMgvgvEV9E0XwRiPXQDjID4LVRBGBCzAPF0NI0gCzqBmA2Xn2GG3ATizWiaQS6xIibgkF2CjOcSo1kM6kQTLIasJybB7IYq7sfikl5CBjRDFZ4GYgU074ASkhE+zV5QRVPRQxhqSCOhjPIQiKPIyShs0FSnxUAOAMUrEPMwkAkABQjt40jPAagAAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGxSURBVDjLpVM9a8JQFL0vUUGFfowFpw4dxM2vf9G5newv6OIvEDoVOnUQf0G7CEYQHVzUVZQoaKFugoW20EUaTd5L+u6NSQORdvDC5dyEd+499ySPOY4Dh0TEK8rl8n0mk7lOJBIpVVWBMUaJAzCFEMA5B8MwPpfL5VOlUrklonegWq3qEr+c/2Nbq9VWHs9XkEwm0xLUy/Lzn5KbD1exaDR6FlpBURSq4/E4HJ2c4jMwmYpcw6vf31be2bAHQTPVHYEFyAr7VeEACzfAQKPuSmlCy7LINBcteifSx3ROWutzlCAZ3Z9Op9ButyEWi8F8Poder0drXTQ1SNUeqalt22EFQrgvC4UC5HI5mow1EjA/SjdEjEQiYAd+HV8BF5xwNBpBo9EgBZPJBDqdDimYzWbQ7XapmeA8rIDLiRjFYpEm4zTEfD7v19lslhSgJ2EFXBAOh0Oo1+vk/ng8Bk3TyBtd16HVarkrCRFWYFqmrwAzqMDzBhMVWNaeFSzT5P3BQJXI3G+9P14XC8c0t5tQg/V6/dLv9c+l3ATDFrvL5HZyCBxpv5Rvboxv3eOxQ6/zD+IbEqvBQWgxAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAMESURBVDjLXZNrSFNxGMYPgQQRfYv6EgR9kCgKohtFgRAVQUHQh24GQReqhViWlVYbZJlZmZmombfVpJXTdHa3reM8uszmWpqnmQuX5drmLsdjenR7ev9DR3Xgd3h43+d5/pw/HA4AN9zITSPUhJ14R0xn87+h2ZzJvZVInJpzAQOXQOQMt+/5rvhMCLXv9Vjrt1rSXitmwj+Jua1+Ox+2HfGNdGf6yW8l5sUKPNVcRsiaPDA22Ahv6/7Ae/0aKdviQ0G7B/c6f8Zg+gbfh079Mjno0MhS58lflOsgEjh3BXc+bM/0DzbvDwj314znt/bjof0HdPw3FBq6kP+oCxVNfdDZvqPsrQmf6zdFRtyPJgbrFoqUTeS+FnPrekpmiC2lS+QcUx+qrf0wmFzodYfgC0nwhoYh9oegfdmLsmYXHj7JhV23erS7ZNYHyibGLiLtXsO19BoHSiwu6Ok09gwFg/gy8BO/STOkKFBk7EWh2YkLeh5Hy4Ws2B2w157iDvOpxw4UPRPRTSfL41FIsow7ZeXwUFF4dBQ1L96A/xLEFf1HMC/LxAt25PH+VN0HXH1gh2dEwdBoBGO0OKvW4L7hCdIvavBSsMIRVHCi0ArmZZl4wbYrz/yHSq1Ql9vQLylUEoE7GMal3OuxMG/7CO848N6n4HheK5iXZeIFmy88Nu+8aYJG24G3ziB+0Ee7wwqemlvQ5w9hcAJwyUDtpwBOFLeBeVkmXpB0qlK9RV2HlLsCsvUivHRhQwoQjhCkA1TgJX1OK0JVzIN5WSZesPZ44XKia+P5BqSS4aq+BzZXABLdhyQrsJPOqv4MVcEbMA/zsky8gLHyYO7hI9laecOZWuzLfYXU2zzSblmQerMZqjwTknOeY9dlIw5kVcrMG/8XpoQgCEkOhwNNJn5i7bFSrFDpsCrFEIPpLacr0WxpibYIQpS86/8pMBqNswnJ6XSivqHBv3R3pmbxzgwz4Z+EaTXtwqIogrzjxIJ4QVVV1UyihxgjFv3/K09Bu/lEkBgg5rLZH+fT5dvfn7iFAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAKkSURBVDjLpZPdT5JhGMb9W+BPaK3matVqndXWOOigA6fmJ9DUcrUMlrN0mNMsKTUznQpq6pyKAm8CIogmypcg8GIiX8rHRHjhVbPt6o01nMvZWge/k3vP9duuZ/edAyDnf/hjoCMP2Vr3gUDj3CdV6zT1xZ6iFDaKnLEkBFOmPfaZArWT5sw60iFP+BAbOzTcQSqDZzsNRyCNkcVoaGghzDlVQKylOHJrMrUZ2Yf52y6kc36IxpyoH1lHF7EBgyMKV4jCJ5U/1UVscU4IZOYEa3I1HtwI01hwxlDLhDoJD/wxGr5YGmOLAdRIrVCuhmD3JdA6SQabx12srGB0KSpc86ew4olDOGjH4x4z0gdHDD9+c4TaQQtq+k2Yt0egXYugTmoVZgV9cyHSxXTtJjZR3WNCVfcK/NE0ppYDUNu2QTMCtS0IbrsOrVMOWL27eNJtJLOCDoWXdgeTEEosqPxoBK/TwDzWY9rowy51gJ1dGr2zLpS2aVH5QQ+Hbw88sZ7OClrGXbQrkMTTAQu4HXqUv9eh7J0OSfo7tiIU+GItilpUuM/AF2tg98eR36Q+FryQ2kjbVhximQu8dgPKxPMoeTuH4tfqDIWvCBQ2KlDQKEe9dBlGTwR36+THFZg+QoUxAL0jgsoOQzYYS+wjskcjTzSToVAkA7Hqg4Spc6tm4vgT+eIFVvmb+eCSMwLlih/cNg0KmpRoGzdl+BXOb5jAsMYNjSWAm9VjwesPR1knFilPNMu510CkdPZtqK1BvJQsoaRZjqLGaTzv1UNp9EJl9uNqxefU5QdDnFNX+Y5Qxrn9bDLUR6zjqzsMizeWYdG5gy6ZDbk8aehiuYRz5jHdeDTKvlY1IrhSMUxe4g9SuVwpdaFsgDxf2i84V9zH/us1/is/AdevBaK9Tb3EAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADvSURBVDjLY/z//z8DJYCJgUIwxAwImOWx22uSExvZBvz68cvm5/dfV5HFGEGxUHoiExwVf//8Zfjz+w/D719/GH79/A3UAMK/GH4CMYiWFJJk+PXrN8PN27cunWq/oA/SwwIzyUrYluHvP6AB//7A8e+/f4H4N8Pvf0D8Fyb2h+HLl696WllqJ69Nu2XOArMZpBCuGajoN1jxbwT9FyH36/dvkCt/w10Acvb+h3uxOhvoZzCbi4OLQVJSiuH1q9cMt2/cvXB7zj0beBgQAwwKtS2AFuwH2vwIqFmd5Fi40H/1BFDzQaBrdTFiYYTnBQAI58A33Wys0AAAAABJRU5ErkJggg=="
];
class MarginDiv extends Container {
    constructor(parent, questionNumberLogic, questionLogic) {
        super(parent, "div");
        this.classes.push("margin");
        if (Settings.instance.presentMode) {
        }
        else {
            this.classes.push("greyBackground");
        }
        if (questionNumberLogic) {
            let questionNumberDiv = new Container(this, "div", [questionNumberLogic.createSpan(this)]);
            questionNumberDiv.addClass("questionNumber");
            this.appendChildElement(questionNumberDiv);
        }
        if (this.settings.allowRowDelete) {
            let deleteButton = new Icon(this, IconName.trash);
            deleteButton.setEvent("onclick", questionLogic.destroy.bind(questionLogic));
            deleteButton.addClass("deleteButton").addClass("hideOnPrint")
                .setAttribute("title", "delete this question");
            this.appendChildElement(deleteButton);
        }
        if (this.settings.allowRowDuplicate) {
            let duplicateButton = new Icon(this, IconName.duplicate);
            duplicateButton.setEvent("onclick", function (ql, assignment) {
                var ql = ql;
                var assignment = assignment;
                return () => { assignment.duplicateRow(ql); };
            }(questionLogic, this.settings.assignment));
            duplicateButton.addClass("duplicateButton").addClass("hideOnPrint")
                .setAttribute("title", "duplicate this question");
            this.appendChildElement(duplicateButton);
        }
        if (Settings.instance.allowRefresh &&
            (questionLogic.rowData.purpose == "template" || questionLogic.rowData.purpose == "sudoku")) {
            let refreshButton = new Icon(this, IconName.refresh);
            refreshButton.setEvent("onclick", function (ql) {
                var ql = ql;
                return () => { questionLogic.commentLogic.generateNewDollars(); };
            }(questionLogic));
            refreshButton.addClass("refreshButton").addClass("hideOnPrint")
                .setAttribute("title", "randomise this question");
            this.appendChildElement(refreshButton);
        }
        if (parent.contentDiv.gridlines.length > 0) {
            let gridlinesButton = new Icon(this, IconName.grid);
            gridlinesButton.setEvent("onclick", function (contentDiv) {
                var contentDiv = contentDiv;
                return () => { contentDiv.toggleGridlines(); };
            }(parent.contentDiv));
            gridlinesButton.addClass("gridlinesButton").addClass("hideOnPrint")
                .setAttribute("title", "show gridlines");
            this.appendChildElement(gridlinesButton);
        }
        if (Settings.instance.allowPin) {
            let spotlightButton = new Icon(this, IconName.pin);
            spotlightButton.setEvent("onclick", function (ql) {
                var ql = ql;
                return () => { QuestionLogic.toggleHideAllQuestionsButOne(ql); };
            }(questionLogic));
            spotlightButton.addClass("refreshButton").addClass("hideOnPrint")
                .setAttribute("title", "pin this question");
            this.appendChildElement(spotlightButton);
        }
        let calculatorButton = new Icon(this, IconName.calculator);
        calculatorButton.setEvent("onclick", function (ql) {
            var ql = ql;
            return () => {
                Settings.instance.calculatorLogic.moveAfterQuestion(ql);
            };
        }(questionLogic));
        calculatorButton.addClass("calculatorButton").addClass("hideOnPrint")
            .setAttribute("title", "show inline calculator");
        this.appendChildElement(calculatorButton);
        if (Settings.instance.allowCountdownTimer) {
            let countdownButton = new Icon(this, IconName.clock);
            countdownButton.setEvent("onclick", function (ql) {
                var ql = ql;
                return () => {
                    Settings.instance.countdownTimerLogic.moveAfterQuestion(ql);
                };
            }(questionLogic));
            countdownButton.addClass("countdownButton").addClass("hideOnPrint")
                .setAttribute("title", "show countdown timer");
            this.appendChildElement(countdownButton);
        }
        if (Settings.instance.pageMode) {
            let pageButton = new Icon(this, IconName.rightArrow);
            pageButton.setEvent("onclick", function (ql) {
                var ql = ql;
                return () => {
                    ql.hideThisAndShowNextQuestion();
                };
            }(questionLogic));
            pageButton.addClass("pageButton").addClass("hideOnPrint")
                .setAttribute("title", "go to next question");
            this.appendChildElement(pageButton);
        }
    }
}
class QuestionLogic {
    constructor(rowData, settings, after) {
        this.rowData = rowData;
        this.settings = settings;
        this.questionNumberLogic = new QuestionNumberLogic(this.settings, !this.isQuestionOrTemplateOrSudoku, this, after ? after.questionNumberLogic : null);
        this.questionTitleLogic = new QuestionTitleLogic(this.rowData.title, this.settings, after ? after.questionTitleLogic : null);
    }
    static get readOnlyInstances() {
        return QuestionNumberLogic.instances.map(qnl => qnl.questionLogic);
    }
    ;
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
        if (Settings.instance.pageMode) {
            if (QuestionLogic.readOnlyInstances.indexOf(this) + 1 != Settings.instance.pageNumber) {
                this.questionDiv.removeClass("displayBlock");
                this.questionDiv.addClass("displayNone");
            }
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
    }
    hideThisAndShowNextQuestion() {
        var onSuccess = (pageNumber) => {
            this.questionDiv.removeClass("displayBlock");
            this.questionDiv.addClass("displayNone");
            let next = QuestionLogic.readOnlyInstances[pageNumber - 1];
            if (next)
                next.questionDiv.addClass("displayBlock");
        };
        Connection.instance.pageRequest(onSuccess.bind(this));
    }
    static toggleHideAllQuestionsButOne(questionLogic) {
        if (questionLogic.questionDiv.classes.indexOf("displayBlock") != -1) {
            QuestionLogic.readOnlyInstances.forEach(ql => {
                ql.questionDiv.removeClass("displayNone");
                ql.questionDiv.removeClass("displayBlock");
            });
        }
        else {
            QuestionLogic.readOnlyInstances.filter(ql => ql != questionLogic).forEach(ql2 => {
                ql2.questionDiv.addClass("displayNone");
                ql2.questionDiv.removeClass("displayBlock");
            });
            questionLogic.questionDiv.addClass("displayBlock");
            questionLogic.questionDiv.removeClass("displayNone");
        }
    }
}
QuestionLogic.purposesWithQuestionNumber = ["question", "sudoku", "template"];
class IQuestionOrSectionDiv extends Container {
}
class QuestionDiv extends IQuestionOrSectionDiv {
    constructor(parent, questionTitleLogic, questionNumberLogic, leftRightMarkdown, questionLogic) {
        super(parent, "div");
        this.classes.push("question");
        this.classes.push("greyBorder");
        this.contentDiv = new ContentDiv(this, questionTitleLogic, leftRightMarkdown);
        this._childNodes = [this.contentDiv];
        if (questionLogic.isQuestionOrTemplateOrSudoku || Settings.instance.mode == Mode.builder ||
            Settings.instance.pageMode) {
            this.classes.push("withMargin");
            this.marginDiv = new MarginDiv(this, questionNumberLogic, questionLogic);
            this._childNodes.push(this.marginDiv);
        }
    }
}
class SectionDiv extends IQuestionOrSectionDiv {
    constructor(parent, questionTitleLogic, questionNumberLogic, leftRightMarkdown, questionLogic) {
        super(parent, "section");
        this.contentDiv = new ContentDiv(this, questionTitleLogic, leftRightMarkdown);
        this._childNodes = [this.contentDiv];
        if (questionLogic.isQuestionOrTemplateOrSudoku) {
            this.marginDiv = new MarginDiv(this, questionNumberLogic, questionLogic);
            this._childNodes.push(this.marginDiv);
        }
    }
}
class QuestionNumberLogic {
    constructor(settings, isBlank, questionLogic, after) {
        this.spans = [];
        this.fieldArraysWithQuestionNumbers = [];
        this.settings = settings;
        this.isBlank = isBlank;
        this.questionLogic = questionLogic;
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
        if (this.isBlank)
            throw "blank question number being called!";
        let index = QuestionNumberLogic.instances.indexOf(this);
        let numBlanks = QuestionNumberLogic.instances.slice(0, index).filter(ql => ql.isBlank).length;
        return index + 1 - numBlanks;
    }
    get prev() {
        let index = QuestionNumberLogic.instances.indexOf(this);
        return QuestionNumberLogic.instances[index - 1];
    }
    createSpan(parent) {
        var span = new Span(parent, this.isBlank ? "" : "Q" + this.number.toString());
        this.spans.push(span);
        return span;
    }
    refreshSpans() {
        this.spans.forEach(span => span.innerHTML = this.isBlank ? "" : "Q" + this.number.toString());
    }
    destroy() {
        helpers.removeFromArray(QuestionNumberLogic.instances, this);
        QuestionNumberLogic.instances.forEach(qn => qn.refreshSpans());
    }
    getFullColumnHeader(valueField) {
        let index = this.fieldArraysWithQuestionNumbers.indexOf(valueField);
        if (index == 0) {
            return this.number + "." + this.questionLogic.rowData.title;
        }
        else {
            return this.number + helpers.lowerCaseLetterFromIndex(index);
        }
    }
    get columnHeaders() {
        return this.fieldArraysWithQuestionNumbers.map(f => this.getFullColumnHeader(f));
    }
    registerField(valueField) {
        this.fieldArraysWithQuestionNumbers.push(valueField);
        let columnHeader = this.getFullColumnHeader(valueField);
        if (Settings.instance.responses && columnHeader in Settings.instance.responses) {
            valueField.setValue(Settings.instance.responses[columnHeader]);
        }
    }
    addFieldToSendBuffer(field, scoreLogic) {
        let columnHeader = this.getFullColumnHeader(field);
        if (columnHeader) {
            if (scoreLogic) {
                if (field instanceof CheckBoxCup) {
                    QuestionNumberLogic.scoresToSendBuffer[columnHeader] = {
                        value: scoreLogic.iconAsString,
                        color: scoreLogic.color,
                        append: Settings.instance.appendMode
                    };
                }
                else {
                    QuestionNumberLogic.scoresToSendBuffer[columnHeader] = {
                        value: field.getValue(),
                        color: scoreLogic.color,
                        append: Settings.instance.appendMode
                    };
                }
            }
            else {
                QuestionNumberLogic.scoresToSendBuffer[columnHeader] = {
                    value: field.getValue(),
                    color: "white",
                    append: Settings.instance.appendMode
                };
            }
        }
    }
    static addScoresToBuffer(scores) {
        QuestionNumberLogic.scoresToSendBuffer = helpers.mergeObjects(QuestionNumberLogic.scoresToSendBuffer, scores);
    }
    static attemptToSend() {
        let merged = helpers.mergeObjects(Settings.instance.totalScores, QuestionNumberLogic.scoresToSendBuffer);
        let onSuccess = (data) => {
            QuestionNumberLogic.scoresToSendBuffer = {};
            QuestionNumberLogic.span.innerHTML = "";
        };
        let onRetry = (data) => {
            QuestionNumberLogic.span.innerHTML = "connection error....retrying";
        };
        Connection.instance.writeToSheet(onSuccess.bind(this), onRetry.bind(this), merged);
    }
    static createCountdownDiv(parent) {
        QuestionNumberLogic.div = new Container(parent, "div");
        QuestionNumberLogic.div.addClass("sheetManagerCountdown");
        QuestionNumberLogic.span = new Span(QuestionNumberLogic.div, "");
        QuestionNumberLogic.div.appendChildElement(QuestionNumberLogic.span);
        return QuestionNumberLogic.div;
    }
}
QuestionNumberLogic.instances = [];
QuestionNumberLogic.scoresToSendBuffer = {};
QuestionNumberLogic.timerInterval = null;
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
class QuizTimerLogic {
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
        var delta = Math.abs(Number(this.endTime) - Number(new Date())) / 1000;
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
        return Number(this.endTime) < Number(new Date());
    }
}
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
    setValue(value) {
        this.setAttribute("value", value);
        let found = this._childNodes.filter(ch => ch._innerText == value);
        if (found.length > 0) {
            found[0].setAttribute("selected", true);
        }
    }
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
        return [new OptionCup(parent, str, str, false)];
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
    setValue(value) { this.setAttribute("value", value); this.innerHTML = value; }
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
class DollarImage extends ImageCup {
    constructor(parent, alt, width) {
        super(parent, "", alt, width);
    }
    setValue(value) { this.setAttribute("src", value); }
    getValue() { return this.getAttribute("src"); }
    setErrorText(value) { }
    resetError() { }
}
class DollarSpan extends Span {
    constructor(parent) {
        super(parent, "");
        this.classes.push("dollarCup");
    }
    setValue(value) { this.innerHTML = value; }
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
    setErrorText(value) { }
    resetError() { }
}
class ScoreLogic {
    constructor(setImageField, settings, questionDiv) {
        this.pending = false;
        ScoreLogic.instances.push(this);
        this.settings = settings;
        this.setImageField = setImageField;
        if (questionDiv instanceof QuestionDiv)
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
        if ((this.attempted == 0 && this.settings.initialChecksRemaining < 0)
            || this.settings.instantChecking) {
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
var Mode;
(function (Mode) {
    Mode[Mode["builder"] = 0] = "builder";
    Mode[Mode["lessonStudent"] = 1] = "lessonStudent";
    Mode[Mode["lessonTeacher"] = 2] = "lessonTeacher";
    Mode[Mode["presentTeacher"] = 3] = "presentTeacher";
    Mode[Mode["previewTeacher"] = 4] = "previewTeacher";
})(Mode || (Mode = {}));
class Settings {
    constructor(settingsObj, mode) {
        this.appendMode = false;
        this.endTime = null;
        this.initialChecksRemaining = -1;
        this.questionJSON = "";
        this.removeHyperlinks = false;
        this.responses = [];
        this.shuffleQuestions = false;
        this.startTime = null;
        this.seed = 1;
        this.title = "";
        this.truncateMarks = -1;
        this.pageMode = false;
        this.pageNumber = 1;
        if (Settings.instance) {
            throw "only one of instance of Settings is allowed";
        }
        Settings.instance = this;
        window["cupsById"] = {};
        for (var key in settingsObj) {
            this[key] = settingsObj[key];
        }
        ;
        this.mode = mode;
        this.setDefaults(mode);
        this.calculatorLogic = new CalculatorLogic();
        this.countdownTimerLogic = new CountdownTimerLogic();
        if (this.startTime)
            this.startTime = new Date(this.startTime);
        if (this.endTime)
            this.endTime = new Date(this.endTime);
        if (this.endTime) {
            this.timerLogic = new QuizTimerLogic(this.endTime, this);
        }
        if (settingsObj.studentNames) {
            this.mode = (this.mode == Mode.lessonStudent) ? Mode.lessonTeacher : Mode.presentTeacher;
            this.setDefaults(this.mode);
            this.studentPicker = new StudentPickerLogic(this, settingsObj.studentNames);
            this.responses = settingsObj.responses;
            this.random = new Random(Number(settingsObj.responses.Seed));
        }
        else {
            this.random = settingsObj.seed ? new Random(Number(settingsObj.seed)) : new Random();
        }
    }
    setDefaults(mode) {
        this.allowCountdownTimer = [false, false, true, true, true][mode];
        this.allowRowDelete = [true, false, false, false, true][mode];
        this.allowRowDuplicate = [true, false, false, false, true][mode];
        this.allowRefresh = [true, false, true, true, true][mode];
        this.allowGridlines = [false, false, false, false, true][mode];
        this.allowPin = [false, true, true, false, true][mode];
        this.instantChecking = [true, false, true, true, true][mode];
        this.presentMode = [false, false, false, true, false][mode];
        this.sendScoresToMarksheet = [false, true, false, false, false][mode];
        this.showSolutions = [true, false, true, false, true][mode];
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
class SolutionDiv extends Container {
    constructor(parent, questionNumberLogic, commentLogic) {
        super(parent, "div");
        this.classes.push("solution");
        if (commentLogic) {
            commentLogic.createAndAppendSolutions(this, questionNumberLogic);
        }
    }
}
class StudentPickerLogic {
    constructor(settings, studentNames) {
        this.NUMBER_CHARACTERS_VISIBLE = 10;
        this.settings = settings;
        this.studentNames = studentNames;
    }
    createDiv(parent) {
        this.div = new Container(parent, "div");
        let teachermodeNotice = new Span(this.div, "teacher mode enabled. Pick a student to view their questions.").addClass("red");
        this.combo = new ComboCup(this.div, [], new Icon(parent, IconName.none), new Span(parent, "")).addClass("studentPicker");
        this.combo._childNodes = this.studentNames.map(s => {
            let text = (s.length > this.NUMBER_CHARACTERS_VISIBLE) ? s.substr(0, this.NUMBER_CHARACTERS_VISIBLE) + "..." : s;
            return new OptionCup(this.combo, s, text, false);
        });
        this.combo.setOnClickAway(this.comboClick.bind(this));
        this.div._childNodes = [teachermodeNotice, this.combo];
        return this.div;
    }
    comboClick() {
        this.combo.errorText.innerHTML = "";
        let student = this.combo.getValue();
        let onRetry = (data) => {
            this.combo.errorText.innerHTML = "connection error...please try again";
        };
        Connection.instance.getMarkbookSettings(this.updateUser.bind(this), onRetry, student);
    }
    updateUser(markbookSettings) {
        this.combo.errorText.innerHTML = "";
        if (markbookSettings && markbookSettings.responses && markbookSettings.responses.Seed) {
            let seed = markbookSettings.responses.Seed;
            Settings.instance.random = new Random(seed);
            Settings.instance.assignment.resetQuestionOrder();
            if (Settings.instance.shuffleQuestions)
                Settings.instance.assignment.shuffle(true);
            Settings.instance.assignment.regenerateAllQuestions();
        }
        else {
            throw "seed not found";
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
        if (this.settings.initialChecksRemaining >= 0) {
            this.button.setAttribute("disabled", true);
            let onRetry = (data) => {
                this.button.innerHTML = "connection error....retrying";
            };
            Connection.instance.checkRequest(this.checkCallback.bind(this), onRetry.bind(this));
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
//# sourceMappingURL=assignment.js.map