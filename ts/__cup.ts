
abstract class ICup {
    _parent: Container;
    _innerHTML = "";
    _element : HTMLElement;
    _events: any = {};
    UID:string = null;
    attributes = {};
    tagName: string;
    classes: string[] = [];

    static propertiesToSet = ["checked","selected","value","disabled","src"];
    static propertiesNoValue = ["checked","selected","disabled"];
    static cupsById: any = {};
    settings: Settings;

    constructor(parent: Container, tagName: string, innerHTML?: string) {
        this._parent = parent;
        this.tagName = tagName; 
        this.UID = helpers.createUID();
        
        if (parent) {
            if (!(parent instanceof ICup)) {throw "bad parent"};
            this.settings = parent.settings;
            window["cupsById"][this.UID] = this;
        }
        if (innerHTML) {this._innerHTML = innerHTML};
        //console.log(this, this.UID);
    }

    //to be rendered, create onload which later connects to this object
    get outerHTML() { 
        //this.elementHasBeenCreated = true;
        return `<${this.tagName} id="${this.UID}" ${this.joinedEvents} ${this.joinedAttributes} ${this.joinedClasses}>${this.innerHTML}</${this.tagName}>`;
    }

    get innerHTML() { 
        if (this.getElement(false)) { return this._element.innerHTML; }
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
        for (var key in this.attributes) { //does not support Object.entries(obj)
            if (ICup.propertiesNoValue.indexOf(key) != -1) {
                if (this.attributes[key]) {
                    buffer += key + " "; //for selected and checked attributes do not use equals
                }
            }
            else {
                buffer += key + "=\"" + this.attributes[key] + "\" "
            }
        }
        return buffer
    }

    get joinedEvents() {
        let buffer = "";
        for (var key in this._events) { //does not support Object.entries(obj)
            buffer += ` ${key}="window.cupsById['${this.UID}']._events['${key}'].forEach( e=> e(event) )" `;
        }
        return buffer
    }

    get joinedClasses() {
        return this.classes.length > 0 ? `class="${this.classes.join(" ")}" ` : "";
    }

    getAttribute(attName) {
        if (this.getElement(false)) {
            return this._element[attName]; //for checked and selected, just use property
        }
        return this.attributes[attName];
    }

    setAttribute(attName, value) {
        if (this.getElement(false)) {
            if (ICup.propertiesToSet.indexOf(attName) != -1) {
                this._element[attName] = value; //for checked and selected, just use property
            }
            else {
                this._element.setAttribute(attName, value);
            }
        }
        this.attributes[attName] = value;
        return this;
    }

    addClass(className: string) {
        if (this.getElement(false)) {
            this._element.classList.add(className);
        }
        if (this.classes.indexOf(className) == -1) {
            this.classes.push(className);
        }
        return this;
    }

    removeClass(className: string) {
        if (this.getElement(false)) {
            this._element.classList.remove(className);
        }
        helpers.removeFromArray(this.classes,className);
        return this;
    }

    setEvent(eventName, func) {
        if (!(eventName in this._events)) { this._events[eventName] = []};
        if (this.getElement(false)) {
            this._element[eventName] = function(eventArray) {
                var eventArray = eventArray;
                return (event) => { eventArray.forEach( e => e(event) )}
            }(this._events[eventName]);
        }
        this._events[eventName].push(func);
    }

    getElement(forceCreate): HTMLElement {
        if (this._element != null) { return this._element; }
        else {
            this._element = document.getElementById(this.UID);
        }
        if (this._element == null && forceCreate) {
            //force create, manually assign attributes
            //console.log("manual create" + this.UID);
            this._element = document.createElement(this.tagName);
            for (let key in this.attributes) {
                this._element.setAttribute(key, this.attributes[key]);
            }
            for (let c of this.classes) {this._element.classList.add(c)}
            for (let key in this._events) {
                this._element[key] = (event) => { this._events[key].forEach( e => e(event) )};
            }
            this._element.innerHTML = this.innerHTML; 
        }
        return this._element;
    }

    /*
    moveAfterSibling(sibling) {
        if (this._parent != sibling._parent) {
            throw "wrong parent";
        }
        this._parent.moveAfter(this, sibling);
    }
    */


    detachFromParent() {
        this._parent.detachChildElement(this);
    }

    destroy() {
        if (this.getElement(false)) {this._element.remove();}
        this._parent.detachChildElement(this);
        if ("destroy" in this._events) { this._events["destroy"].forEach(f => f(this)); }
    }

    onThisAndChildren(action) { action(this); }
}



class Span extends ICup {
    constructor(parent: Container, innerText) { super(parent, "span", innerText); }
}

class AnchorCup extends ICup {
    constructor(parent: Container, url,innerText) {
      super(parent, "a",innerText);
      this.attributes["href"] = url;
      this.attributes["target"] = "_blank";
    }
}

class BreakCup extends ICup {
    constructor(parent: Container) { super(parent, "br"); }
}


class ImageCup extends ICup {
    domain: any;
    constructor(parent: Container, src: string, alt?: string, width?: number) {
        super(parent, "img");
        if (width == undefined || isNaN(width)) { width = 100 }
        this.attributes["style"] = `position: relative; left:${(50 - width / 2)}%; width:${width}%`;
        this.attributes["src"] = src;
        if (alt) { this.attributes["alt"] = alt; }
        this.domain = helpers.getDomainFromUrl(src);
    }

    //https://www.easybib.com/guides/forums/topic/q-cite-image-found-online-search-engine-google-images/
    //overloads HTML getter in order to insert image citation
    get HTML() { 
        var cite = this.domain == "i.imgur.com"  ? "" : `<cite>Digital image taken from <a href=${this.attributes["src"]}>${this.domain}</a></cite>`;
        return `<${this.tagName} ${this.joinedAttributes} >${this.innerHTML}</${this.tagName}>${cite}`;
    } 
}

class ButtonCup extends ICup {
    constructor(parent: Container, text) {
        super(parent, "button");
        this._innerHTML = text;
    }
}

class OptionCup extends ICup  { //does not implement responseField
    constructor(parent: Container, value, text, isSelected) { 
        super(parent, "option", text); 
        this.attributes["value"] = value;
        this.attributes["selected"] = isSelected;
    }
}


class CanvasCup extends ICup {
    constructor(parent: Container) {
        super(parent, "canvas");
    }
}
