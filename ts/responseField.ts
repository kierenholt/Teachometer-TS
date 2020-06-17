
//FIELDS THAT CLICK AWAY AND SEND INPUT TO COMMENTS - excludes pound, checkbox
interface ClickAwayField {
    setOnClickAway(func);
}

//SCORELOGIC OUTPUTS TO FIELD WITH IMAGE - excludes pound, includes checkbox
interface SetImageField {
    setDecisionImage(value: IconName);
    destroy(); //only needs to be written for radio since the others have it from ICup
}

//COMMENTS MATCH TO SETVALUEFIELD: pound, checkbox + others
//SCORELOGIC OUTPUTS TO SETVALUEFIELD
//FIELDS THAT CAN HAVE VALUE - includes pound, checkbox and scorelogic + others
interface ValueField {
    setValue(value:string);
    getValue(): string;
    setErrorText(value: string);
    resetError();
    UID: string;
}


class ComboCup extends Container implements ClickAwayField, ValueField, SetImageField { 
    _decisionImage: Icon;
    errorText: Span;
    constructor(parent: Container, childNodes, decisionImage: Icon, span: Span) { 
        super(parent, "select",childNodes); 
        this.replace(ComboCup.optionReplacer); //pass a slash delimited string 
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
        this.attributes["value"] = "";
    }

    static optionReplacer: Replacer = { 
        "pattern": /(?:^|\/)([^\/]+)/,
        "nodeConstructorFromMatch": (parent: Container, str: string) => {
            return [new OptionCup(parent, str, false)];
        }
    }

    setOnClickAway(func: any) { this.setEvent("onchange",func); }
    getValue() { return this.getAttribute("value"); }
    setValue(value: string) { 
        this.setAttribute("value",value);
        let found = this._childNodes.filter(ch => ch._innerText == value);
        if (found.length > 0) {
            found[0].setAttribute("selected",true);
        } 
    }
    setDecisionImage(value: IconName) { this._decisionImage.setIconName(value); }
    setErrorText(value) { 
        this.errorText.innerHTML = value;
        if (value.length > 0) this._decisionImage.setIconName(IconName.error); 
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this._decisionImage.getIconName() == IconName.error) { this.setDecisionImage(IconName.none); }
    }
}


class InputCup extends ICup implements ClickAwayField, ValueField, SetImageField { //no innerHTML
    _decisionImage: Icon;
    errorText: Span;
    constructor(parent: Container, size: number, decisionImage: Icon, span: Span) {
        super(parent, "input");
        this.attributes["type"] = "text";
        this.attributes["size"] = size.toString();
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
        this.attributes["value"] = "";
    }

    setOnClickAway(func) { this.setEvent("onblur",func);   }
    getValue() { return this.getAttribute("value"); }
    setValue(value: string) { this.setAttribute("value",value); }
    setDecisionImage(value: IconName) { this._decisionImage.setIconName(value);     }
    setErrorText(value) { 
        this.errorText.innerHTML = value;
        if (value.length > 0) this._decisionImage.setIconName(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this._decisionImage.getIconName() == IconName.error) { this.setDecisionImage(IconName.none); }
    }
}

class TextAreaCup extends ICup implements ClickAwayField, ValueField, SetImageField {
    _decisionImage: Icon;
    errorText: Span;
    constructor(parent: Container, decisionImage: Icon, span: Span) {
        super(parent, "textarea");
        this.attributes["rows"] = "10";
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
    }

    setOnClickAway(func) { this.setEvent("onblur",func); }
    getValue() { return this.getAttribute("value"); }
    setValue(value: string) { this.innerHTML = value; }
    setDecisionImage(value: IconName) { this._decisionImage.setIconName(value); }
    setErrorText(value) { 
        this.errorText.innerHTML = value; 
        if (value.length > 0) this._decisionImage.setIconName(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this._decisionImage.getIconName() == IconName.error) { this.setDecisionImage(IconName.none); }
    }
}

class RadioSet implements ClickAwayField, ValueField, SetImageField {
    radioCups: RadioCup[] = [];
    onClickAway: any;
    _UID: string; //for name
    constructor() {
        this._UID = helpers.createUID();
        this.onClickAway = () => {}; //dummy function for radios which do not have scorelogic
    }

    letterComesAfterLastInSet(value) {
        return value > this.radioCups[this.radioCups.length-1].letter;
    }

    addRadioCup(rc: RadioCup) {
        this.radioCups.push(rc);
        rc.setEvent("onclick",function(radioSet) {
            var rs = radioSet;
            return () => { rs.onClickAway(); };
        }(this));
        rc.setAttribute("name",this._UID);
    }

    setOnClickAway(func) { this.onClickAway = func; }
    get checkedRadio() : RadioCup { return this.radioCups.find(rc => rc.getAttribute("checked")) }
    getValue() { 
        let found = this.checkedRadio;
        return (found == undefined) ? "" : found.letter;  
    }

    setValue(value: string) { 
        this.radioCups.forEach(rc => { rc.setAttribute("checked",(rc.letter == value)) } ); 
    }
    get UID(): string { return this._UID; }

    destroy() {
        this.radioCups.forEach((c) => {c.destroy()});
    }  

    setDecisionImage(value: IconName) {
        this.radioCups.forEach(r => {
            if (r.getAttribute("checked")) {
                r._decisionImage.setIconName(value);
            }
            else {
                r._decisionImage.setIconName(IconName.none);
            }
        })
    }

    setErrorText(value) { 
        this.radioCups.forEach(r => {
            if (r.getAttribute("checked")) {
                r.errorText.innerHTML = value;
                if (value.length > 0) r._decisionImage.setIconName(IconName.error);
            }
        }) }

    resetError() {
        this.radioCups.forEach(r => {
            r.errorText.innerHTML = "";
            if (r._decisionImage.getIconName() == IconName.error) { r._decisionImage.setIconName(IconName.none); }    
        })
    }

    //used to set disabled
    setAttribute(name: string, value: string) { this.radioCups.forEach(r => r.setAttribute(name, value))}
}


class RadioCup extends ICup { //does not implement responsefield
    letter: string;
    _decisionImage: Icon;
    errorText: Span;

    constructor(parent: Container, letter: string, decisionImage: Icon, span: Span) {
        super(parent, "input");
        this.setAttribute("type","radio");
        this.letter = letter;
        this._decisionImage = decisionImage;
        this.errorText = span;
        this.errorText.addClass("errorText");
    }
    //called by different cups which exist in the expression tree
    get outerHTML() {
      return this.letter + ". " + super.outerHTML;
    }
}


class CheckBoxCup extends Icon implements ValueField, SetImageField {
    errorText: Span;
    constructor(parent: Container, iconName: IconName, span: Span) {
        super(parent, iconName);
        this.errorText = span;
        this.errorText.addClass("errorText");
    }

    setDecisionImage(value: IconName) { this.setIconName(value); }
    setValue(value: string) {  }
    getValue() { return "";  }
    setErrorText(value) { 
        this.errorText.innerHTML = value;
        if (value.length > 0) this.setDecisionImage(IconName.error);
    }
    resetError() {
        this.errorText.innerHTML = "";
        if (this.getIconName() == IconName.error) { this.setDecisionImage(IconName.none); }
    }
}


class DollarImage extends ImageCup implements ValueField {
    constructor(parent, alt, width) {
        super(parent, "", alt, width);
    }
    setValue(value: string) { this.setAttribute("src",value); }
    getValue(): string { return this.getAttribute("src"); }
    setErrorText(value: string) { }
    resetError() { }
}

class DollarSpan extends Span implements ValueField {
    constructor(parent: Container) {
        super(parent, "");
        this.classes.push("dollarCup");
    }

    setValue(value: string) { this.innerHTML = value; }
    getValue() { return this.innerHTML; }

    //must be done before any HTMLelements have been rendered - does not trigger destroy
    swapForInput() {
        let parent = this._parent;
        let decisionImage = new Icon(parent, IconName.none);
        let span = new Span(parent, "");
        let input =  new InputCup(parent, 3, decisionImage, span);

        let index = parent._childNodes.indexOf(this);
        parent._childNodes.splice(index, 2, input, decisionImage, span);

        return input;
    }
    
    setErrorText(value) { }
    resetError() { }
}