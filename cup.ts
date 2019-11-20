


class Cup {
  str: any;
  attributes = [];
  tagName = "";
  
  constructor(str) { this.str = str; }

  onThisAndChildren(action) { action(this); }

  get innerHTML() { return ""; }
  get HTML() { return `<${this.tagName} ${this.attributes.join("  ")}>${this.innerHTML}</${this.tagName}>` }
}

class ImageCup extends Cup {
  comment: any;
  source: any;
  width: number;
  constructor(str) {
    super(str);

    [, this.comment, this.source,] = str.split(/!\[([^\]]*)]\(([^\)]*)\)/g);
    let commaIndex = this.comment.indexOf(",");
    if (commaIndex != -1)
      this.width = Number(this.comment.substr(commaIndex + 1));
    if (this.width == null || isNaN(this.width))
      this.width = 100;
      this.tagName = "img";
      this.attributes.push(`style="position: relative; left:${(50 - this.width / 2)}%; width:${this.width}%"`);
      this.attributes.push(`src="${this.source}"`);
      this.attributes.push(`alt="${this.comment}"`);
  }

  
  //does not do replace (i.e. cups), but does do textreplace (dollars)
  
  //for replacing dollars with numbers etc.
  textReplace(patternMakeItGlobal, getTemplateValue) //https://stackoverflow.com/questions/6605640/javascript-by-reference-vs-by-value
  {
    function replacer(match, p1, p2, p3, offset, string) {
      // p1 is nondigits, p2 digits, and p3 non-alphanumerics
      return getTemplateValue();
    }

    this.source = this.source.replace(patternMakeItGlobal, replacer);
    this.comment = this.comment.replace(patternMakeItGlobal, replacer);
  }
}


class AnchorCup extends Cup {
  text: any;
  url: any;
  constructor(str) {
    super(str);
    [, this.text, this.url,] = str.split(/\[([^\]]*)]\(([^\)]*)\)/);
    if (!(this.url.startsWith("http://") || this.url.startsWith("https://")))
      this.url = "https://" + this.url;
    this.tagName = "a";
    this.attributes.push(`href="${this.url}"`);
    this.attributes.push(`target="_blank">`);
  }

  get innerHTML() {
    return this.text;
  }

  //does not do replace (i.e. cups), but does do textreplace (dollars)
  //for replacing dollars with numbers etc.
  textReplace(patternMakeItGlobal, getTemplateValue) //https://stackoverflow.com/questions/6605640/javascript-by-reference-vs-by-value
  {
    function replacer(match, p1, p2, p3, offset, string) {
      // p1 is nondigits, p2 digits, and p3 non-alphanumerics
      return getTemplateValue();
    }

    this.text = this.text.replace(patternMakeItGlobal, replacer);
    this.url = this.url.replace(patternMakeItGlobal, replacer);
  }
}

///has a different replace function from chunkcup
///replacing is done by innerfractioncup
class FractionCup extends Cup {
  top: InnerFractionCup;
  bottom: InnerFractionCup;
  constructor(str) { 
    super(str); 
    
    let top = ""; let bottom = "";
    //~\[([^\]]*)\]\(([^)]*)\)
    //~\[([^\]]*)\]\((?:\\\)|[^)])*)\)
    [, top, bottom] = this.str.split(/~\[([^\]]*)\]\(((?:\\\)|[^)])*)\)/);
    this.top = new InnerFractionCup(top.replace("\\",""));
    this.bottom = new InnerFractionCup(bottom.replace("\\",""));
  }

  onThisAndChildren(action) {
    action(this);
    this.top.onThisAndChildren(action);
    this.bottom.onThisAndChildren(action);
  }

  replace(pattern, nodeConstructor, confirmReplace) { //replace with new chunks
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

  //for parsing cups
  replace(pattern, nodeConstructor, confirmReplace) //replace with new chunks
  {
    let retVal = [];
    for (let n of this.str.split(pattern)) {
      if (n != null && n.length > 0) {
        if (pattern.test(n) && (confirmReplace == null || confirmReplace(n))) {
          retVal.push(nodeConstructor(n))
        }
        else {
          retVal.push(this.thisConstructor(n))
        }
      }
    }
    return retVal; //return an array of replacements
  }

  //for replacing dollars with numbers etc.
  textReplace(patternMakeItGlobal, getTemplateValue) //https://stackoverflow.com/questions/6605640/javascript-by-reference-vs-by-value
  {
    function replacer(match, p1, p2, p3, offset, string) {
      // p1 is nondigits, p2 digits, and p3 non-alphanumerics
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
    super(str.substring(1,str.length-1));
    this.tagName = "u";
  }
  get thisConstructor() { return (s) => new UnderlineCup(s); };
}

class BoldCup extends ChunkCup {
  constructor(str) {
    super(str.replace("*", ""));
    this.tagName = "b";
  }
  get thisConstructor() { return (s) => new BoldCup(s); };
}

class SuperScriptCup extends ChunkCup {
  constructor(str) {
    super(str.replace("^", ""));
    this.tagName = "sup";
  }
  get thisConstructor() { return (s) => new SuperScriptCup(s); };
}

class SubScriptCup extends ChunkCup {
  constructor(str) {
    super(str.replace("~", ""));
    this.tagName = "sub";
  }
  get thisConstructor() { return (s) => new SubScriptCup(s); };
}

class TitleCup extends ChunkCup {
  constructor(str) {
    super(str.replace("#", ""));
    this.tagName = "h1";
  }
  get thisConstructor() { return (s) => new TitleCup(s); };
}

class CupContainer extends Cup {
  children: any;
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

  replace(pattern, nodeConstructor, confirmReplace) { //replace with new chunks
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
        else { //child does not have a replace function
            newChildren.push(child);          
        }
      }
      this.children = newChildren;
    }
    return [this]; //needs to return an array since chunkcup does it
  }

  get innerHTML() {
    return this.children.map(c => c.HTML).join("");
  }
}


///does not replace chunks or dollars
class CodeCup extends CupContainer {
  children: ChunkCup[];
  constructor(str) {
    str = helpers.trimChar(str,"`");
    str = helpers.trimChar(str,"\n");
    super(str);
    this.children = [new ChunkCup(str)];
    this.attributes.push(`class="codeblock"`);
    this.tagName = "pre";
    this.replace = null;
  }
}

class RelativePositionCup extends CupContainer {
  xPos: string;
  yPos: string;
  constructor(str,inPixels?:Boolean) {
    super(str); //in pixels is used by questionnumber
    //strip newline
    // if (this.str.StartsWith("\n")){
    //   this.str = this.str.Substring(1);
    // }
    if (inPixels == undefined) {
      inPixels = false;
    }
    let xPosAsString = ""; let yPosAsString = ""; let childrenAsString = "";
    [, xPosAsString, yPosAsString, childrenAsString] = this.str.split(/@\[([\-0-9]+),([\-0-9]+)\]\(([^)]*)\)/);
    this.xPos = Number(xPosAsString).toString() + (inPixels ? "px" : "%");
    this.yPos = Number(yPosAsString).toString() + (inPixels ? "px" : "%");
    this.children = [new ChunkCup(childrenAsString)];
    this.attributes.push(`style=\"position:absolute;left:${this.xPos};top:${this.yPos}\"`);
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
  _gridLinesDiv: HTMLDivElement;
  element: HTMLDivElement;

  constructor(str) {
    super(str);
    this.children = [new ChunkCup(this.str)];
  }

  set class(value) {
    this.attributes.push(`class="${value}"`)
  }

  toggleGridlines() {
    this.gridLinesDiv.style.display = (this.gridLinesDiv.style.display == "block") ? "none" : "block";
  }

  get gridLinesDiv() {
    if (this._gridLinesDiv) { return this._gridLinesDiv; }
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
  hasBorder: any;
  //children are rows

  constructor(str) {
    super(str);
    this.hasBorder = str.startsWith("|");
    this.tagName = "table";
    this.children = str.split("\n").filter(s => s.length > 0).map(s => new RowCup(s));
    this.attributes.push(`class="markdowntable"`); 
    this.attributes.push(`style="${this.hasBorder ? "" : "border: none;"}"`);
    //this.numCols = rows[0].children.Length;
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
  colSpan: any;
  constructor(str) {
    super(str);
    this.str = this.str.substring(1);
    this.children = [new ChunkCup(this.str)];
    this.tagName = "td";
  }
}

enum decisionImageEnum {
  None,
  Star,
  Cross,
  Tick,
  Hourglass,
  Error
}

interface Field {
  onResponse();
  elementValue: any;
  disabled: boolean;
  decisionImage: decisionImageEnum;

}

//FIELD PRESENTATION LAYER
class FieldCup extends Cup implements Field {
  instanceNum: number;
  static instances: FieldCup[] = [];
  _element: any;
  _decisionImage: decisionImageEnum;
  _decisionElement: HTMLImageElement;

  constructor(str) {
    super(str);
    this.instanceNum = FieldCup.instances.length;
    FieldCup.instances.push(this);
    this._element = {value: "", "disabled": false};
    this.attributes.push(`id=cup${this.instanceNum}`);
    this._decisionImage = decisionImageEnum.None;
  }
  
  set elementValue(value) {
      this._element.value = value;
  }

  get elementValue() {
      this._element.value = helpers.replaceAll(this._element.value,"x10^","e");
      return this._element.value;
  }

  setElement(newElement: any) {
    //replaces the dummy element with a real HTML input element
    newElement.value = this._element.value;
    newElement.disabled = this._element.disabled;
    this._element = newElement;

    //get decision image, update
    this._decisionElement = newElement.nextSibling;
    this.decisionImage = this._decisionImage;
  }

  get decisionImageHTML() { return `<img style:"z-index:100;display:none" hidden />`}

  set disabled(value) { 
    this._element.disabled = value;
    this._decisionElement.hidden = value;  
  }
  get disabled() { return this._element.disabled; }

  set decisionImage(value:decisionImageEnum) {
    this._decisionImage = value;
    if (this._decisionElement) 
    {
      if (this._decisionImage == decisionImageEnum.None) {
        this._decisionElement.hidden = true;
      } 
      else {
        this._decisionElement.hidden = false;
        this._decisionElement.src = this.decisionToDataURL(value);
      } 
    }
  }

  onResponse() { } //to be overridden;
  
  decisionToDataURL(decision:decisionImageEnum) {
    if (decision == decisionImageEnum.Cross) { return imageData.cross; }
    if (decision == decisionImageEnum.Error) { return imageData.error; }
    if (decision == decisionImageEnum.Hourglass) { return imageData.hourglass; }
    if (decision == decisionImageEnum.Star) { return imageData.star; }
    if (decision == decisionImageEnum.Tick) { return imageData.tick; }
    return "";
  }
}

class RadioSet implements Field {
  radioCups: RadioCup[];
  _element: any;
  static numInstances = 0;
  instanceNum: any;
  _decisionImage: decisionImageEnum;
  _cachedOnResponse: any;

  constructor() {
    this.radioCups = [];
    this.instanceNum = RadioSet.numInstances++;
    this._decisionImage = decisionImageEnum.None;
  }
  
  set decisionImage(value:decisionImageEnum) {
    //remove all decisions first
    this.radioCups.forEach(r => r.decisionImage = decisionImageEnum.None);
    //apply image to checked radio only
    let found = this.radioCups.filter(r => r.elementValue == true);
    if (found.length) {
      found[0].decisionImage = value;
    }
  }

  //called by rowHTML injector
  add(radioCup:RadioCup) {
    this.radioCups.push(radioCup);
    radioCup.onResponse = this._cachedOnResponse;
    //add formname to all radiocups so only one can be selected at a time
    radioCup.attributes.push(`name=radioSet${this.instanceNum}`); 
  }
  
  set onResponse(value) {
    this._cachedOnResponse = value;
    this.radioCups.forEach(r => r.onResponse = value);
  }

  get elementValue() { 
    let found = this.radioCups.filter(r => r.elementValue);
    if (found.length) {return found[0].letter; }
    return "";
  }
  set elementValue(value) {
    this.radioCups.forEach(r => r.elementValue = (r.letter == value));
  }
  set disabled(value) {this.radioCups.forEach(r => r.disabled = value);} 
  get disabled() {return this.radioCups ? this.radioCups[0].disabled : false }
}

class RadioCup extends FieldCup { //needs to extend fieldcup for the instancenum stuff
  letter: any;
  radioCups: this[];
  _elements: any;

  constructor(str) {
    super(str);
    this.letter = str[0];
    this.radioCups = [this];
    this._element = {checked: false, "disabled": false};
  }

  //called by different cups which exist in the expression tree
  get HTML() {
    return this.letter + `.<input type="radio" ${this.attributes.join("  ")} value="${this.letter}" >${this.decisionImageHTML}`;
  }
  
  setElement(newElement) {
    super.setElement(newElement);
    //attach onresponse function to click event 
    newElement.onclick = function(paramCup) {
      let cup = paramCup; 
      return function() { cup.onResponse(); }
    }(this);
  }

  get elementValue() { return this._element.checked; } //true or false
  set elementValue(value) { this._element.checked = (value == true); } //true or false
}

class TextAreaCup extends FieldCup {
  constructor(str) {
    super(str);
  }

  get HTML() {
    return `<br><textarea ${this.attributes.join("  ")} rows="10"></textarea>`;
  }

  setElement(newElement) {
    super.setElement(newElement);
    //attach onresponse function to blur event 
    newElement.onblur= function(paramCup) {
      let cup = paramCup; 
      return function() { cup.onResponse(); }
    }(this);
  }
}

class InputCup extends FieldCup {
  constructor(str) {
    super(str);
  }

  get HTML() {
    return `<input size="${this.str.length}" type="text" ${this.attributes.join("  ")} >${this.decisionImageHTML}`;
  }
  
  setElement(newElement) {
    super.setElement(newElement);
    //attach onresponse function to blur event 
    newElement.onblur= function(paramCup) {
      let cup = paramCup; 
      return function() { cup.onResponse(); }
    }(this);
  }
}

class ComboCup extends FieldCup {
  options: string[];
  constructor(str) {
    super(str);
    this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
  }

  get HTML() {
    let optionHTML = this.options.map(o => `<option value='${o}'>${o}</option>`).join("");
    return `<select ${this.attributes.join("  ")} >${optionHTML} </select>${this.decisionImageHTML}`;
  }
  
  setElement(newElement) {
    super.setElement(newElement);
    //attach onresponse function to blur event 
    newElement.onchange= function(paramCup) {
      let cup = paramCup; 
      return function() { cup.onResponse(); }
    }(this);
  }

  //for replacing dollars with numbers etc.
  textReplace(pattern, getTemplateValue) //https://stackoverflow.com/questions/6605640/javascript-by-reference-vs-by-value
  {
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace

      var replacer = function(match, offset, string) {
        // p1 is nondigits, p2 digits, and p3 non-alphanumericsif (index > -1) 
        return getTemplateValue();
      }

    this.str = this.str.replace(pattern, replacer);
    this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
  }
}


class CheckBoxCup extends FieldCup {
  constructor(str) {
    super(str);
    this._decisionImage = decisionImageEnum.Hourglass;
  }

  get HTML() { //empty element
    return `<span ${this.attributes.join("  ")} ></span>${this.decisionImageHTML}`;
  }
  
  setElement(newElement) {
    super.setElement(newElement);
    this._element =  {value:"",disabled:false}; //no element
  }

  set hoverText(value) {
      this._element.title = value;
  }
  
  set elementValue(value:any) {
    if ((value == "✓") || (value == true)) { 
      this._element.value = "tick";  //just stored for markbook
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
  }

  get HTML() {
    return `<span ${this.attributes.join("  ")} ></span>`; //no decision image
  }
  
  setElement(newElement) {
    super.setElement(newElement);
    //no change event etc. `
    //no decision element
  }

  //DOES NOT GET MARKED. NO DECISION IMAGE
  set elementValue(value) {
    this._element.innerText = value;
  }

  get elementValue() {
    return this._element.innerText;
  }

  showDecisionImage(image) {
    //do nothing
  }

  set isRed(value) {
    this._element.style.color = value ? "red" : "" ;
  }
}



