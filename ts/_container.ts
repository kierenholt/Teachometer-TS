
class Container extends ICup {
    _childNodes:any[] = [];
    _element: HTMLElement = null;
    
    constructor(parent: Container, tagName: string, childNodes?: any[]) {
        super(parent, tagName); 
        if (childNodes) { this._childNodes = childNodes; };
    }

    get innerHTML() {
        let ret = "";
        for (var child of this._childNodes) {
            ret += (typeof(child) == "string") ? child : (child as ICup).outerHTML; 
        }
        return ret;
    }

    set childNodes(value) {
        this._childNodes = value;
    }

    get childrenElementsOnly(): ICup[] {
        return this._childNodes.filter(c => typeof(c) != "string");
    }

    appendChildren(nodes: any[]) {
        for (let child of nodes) {
            if (typeof(child) == "string") { this.appendChildString(child)}
            else { this.appendChildElement(child) }
        }
        return this;
    }

    appendChildElement(child:ICup, after?:ICup) {
        //remove child from its old parent
        helpers.removeFromArray(child._parent._childNodes, child)
        //if after is specified
        if (after && this._childNodes.indexOf(after) < this._childNodes.length-1) {
            if (this.getElement(false)) {
                let before = this._childNodes[this._childNodes.indexOf(after) + 1];
                this._element.insertBefore(child.getElement(true),before.getElement(true)); //auto refresh
            }
            helpers.insertAfter(this._childNodes,after,child);
        } 
        else { //just append
            if (this.getElement(false)) {
                this._element.appendChild(child.getElement(true)); //auto refresh
            }
            this._childNodes.push(child);
        }
        return this;
    }

    //debug only
    checkChildNodes() {
        if(this._element) {
            for (let child of this._childNodes) {
                if (!(this._element.contains(child.getElement(true)))) {
                    throw("child not found in parent!");
                }
            }
        }
    }

    appendChildString(child: string) {
        this._childNodes.push(child);
        this.refresh();
        return this;
    }

    shuffleChildren(random: Random) {
        for (var i = this._childNodes.length - 1; i > 0; i--) {
            this.appendChildElement(this._childNodes[random.next(i)]);
        }
    }

    detachChildElement(child: ICup) {
        helpers.removeFromArray(this._childNodes,child);
        this.refresh();
        return this;
    }

    detachChildString(child: string) {
        helpers.removeFromArray(this._childNodes,child);
        this.refresh();
        return this;
    }
    
    destroyChildAtIndex(index: number) {
        let child = this._childNodes[index];
        if (typeof(child) == "string") {
            this.detachChildString(child as string);
            this.refresh();
        }
        else {
            this.detachChildElement(child as ICup); //no need to remove HTML Element, it is done in destroy
        }
        return this;
    }

    detachAllChildren() {
        this._childNodes.forEach(c => typeof(c) == "string" ? this.detachChildString(c): this.detachChildElement(c));
        this._childNodes = [];
        this.refresh();
        return this;
    }
    
    refresh() {
        if (this.getElement(false)) { this._element.innerHTML = this.innerHTML; }
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

    
    stringToElements(markdown: string, replacer: Replacer) : any[]
    {
        let ret = [];
        for (let str of markdown.split(replacer.pattern)) {
            if (str != null && str.length > 0) {
                if (replacer.pattern.test(str)) {// && (confirmReplace == null || confirmReplace(n))) {
                    let newChild = replacer.nodeConstructorFromMatch(this, str);
                    if (newChild) { ret.push(...newChild); }
                }
                else {
                    ret.push(str)
                }
            }
        }
        return ret; //return an array of replacements
    }
    
    replace(replacer: Replacer) { //replace with new chunks
        let newChildren = [];
        for (let child of this._childNodes) {
            if (typeof(child) == "string") {
                newChildren.push(...this.stringToElements(child, replacer));
            }
            else if (child.replace) {
                child.replace(replacer); //child could be a container
                newChildren.push(child);
            }
            else { //child does not have a replace function
                newChildren.push(child);          
            }
        }
        this._childNodes = newChildren;
    }
}

interface Replacer {
    pattern: RegExp;
    nodeConstructorFromMatch(parent: Container, s: string): ICup[];
}

class FractionCup extends Container {
    constructor(parent: Container, topChildNodes,bottomChildNodes) { 
        super(parent, "table"); 
        this.attributes["class"] = "fraction";
        this.childNodes = ["<tr><td>",...topChildNodes,"</td></tr><tr><td>",...bottomChildNodes,"</td></tr>"];
    }  
}

class TableCup extends Container { // | 
    hasBorder: any;
    constructor(parent: Container, hasBorder, childNodes) {
        super(parent, "table", childNodes);
        this.attributes["class"] = "markdowntable"; 
        this.attributes["style"] = this.hasBorder ? "" : "border: none;";
    }

    static fromString(parent, hasBorder, str): TableCup {
        let ret = new TableCup(parent, hasBorder, []);
        ret._childNodes = str.split("\n").map(s => {return RowCup.fromString(ret, s)});
        return ret;
    }
}


class RowCup extends Container {
    constructor(parent: Container, childNodes) { 
        super(parent, "tr", childNodes); 
    }

    static fromString(parent, str): RowCup {
        let ret = new RowCup(parent, []);
        ret._childNodes = str.split("|").slice(1).map(s => {return new CellCup(ret, [s])});
        return ret;
    }
}
  
class CellCup extends Container {
    constructor(parent: Container, childNodes) { super(parent, "td", childNodes); }
}

class RolloverCup extends Container { 
    constructor(parent: Container, childNodes) { super(parent, "div", childNodes); this.attributes["class"] = "rollover"; }
}

class List extends ICup {
    constructor(parent: Container, childNodes) { super(parent, "li", childNodes); }
}


///does not replace chunks or dollars
class CodeCup extends Container {
  constructor(parent: Container, str: string) {
    //each line is wrapped in td etc.
    let lines = str.split("\n");
    let ret = "";
    for (let i = 0; i < lines.length; i++) {
        if (i == 1) {ret += `<span class="tr first-row"><span class="th"></span><code>${lines[i]}</code></span>`}
        else { ret += `<span class="tr"><span class="th"></span><code>${lines[i]}</code></span>`}
    }

    super(parent, "pre", [ret]);
    this.attributes["class"] = "code";
    this.replace = null;
  }
 
  /*
<span class="tr first-row"><span class="th"></span><code>   indented line</code></span>
<span class="tr"><span class="th"></span><code>unindented line</code></span>
<span class="tr"><span class="th"></span><code>&#9;line starting and ending with tab&#9;</code></span>
<span class="tr"><span class="th"></span><code></code></span>
  */
}


class UnderlineCup extends Container {
    constructor(parent: Container, str) { super(parent, "span", [str]); this.addClass("underline"); }
}

class BoldCup extends Container {
    constructor(parent: Container, str) { super(parent, "span", [str]); this.addClass("bold"); }
}

class SuperScriptCup extends Container {
    constructor(parent: Container, str) { super(parent, "span", [str]); this.addClass("superscript"); }
}

class SubScriptCup extends Container { 
    constructor(parent: Container, str) { super(parent, "span", [str]); this.addClass("subscript"); }
}

class HeadingCup extends Container {
    constructor(parent: Container, str) { super(parent, "p", [str]); this.addClass("heading"); }
}

class RelativePositionCup extends Container {
    xPos: string;
    yPos: string;
    constructor(parent: Container, xPos, yPos, childNodes) {
      super(parent, "div", childNodes);
      this.attributes["style"] = `position:absolute;left:${xPos}%;top:${yPos}%`;
      this._parent.addClass("relative");
    }
  }

class GridLines extends Container {
    constructor(parent: Container) {
        let childNodes =
        `
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
`  
        super(parent,"div", [childNodes]);
        this.classes.push("gridlinecontainer");
    }

    toggleVisible() {
        if (this.getElement(false)) {
            let isVisible = this._element.style.display == "block";
            this._element.style.display = isVisible ? "none" : "block";
        }
    }
}