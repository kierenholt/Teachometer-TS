


class Cup {
  str: any;
  constructor(str) {
    this.str = str;
  }

  onThisAndChildren(action) {
    action(this);
  }
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
  }

  get HTML() {
    return `<img style=\"position: relative; left:${(50 - this.width / 2)}%; width:${this.width}%\" 
      src=\"${this.source}\" alt=\"${this.comment}\" />`;
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
  }

  get HTML() {
      return `<a href=\"${this.url}\" target=\"_blank\">${this.text}</a>`;
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

///does not replace chunks or dollars
class CodeCup extends Cup {
  children: ChunkCup[];
  childrenHTML: any;
  constructor(str) {
    str = helpers.trimChar(str,"`");
    str = helpers.trimChar(str,"\n");
    super(str);
    this.children = [new ChunkCup(str)];
  }

  get HTML() {
    return `<div class="codeblock">${this.childrenHTML}</div>`;
  }
}


class ChunkCup extends Cup {

  constructor(str) {
    super(str);
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


  get HTML() {
    return this.str;
  }
}

class UnderlineCup extends ChunkCup {
  constructor(str) {
    super(str.substring(1,str.length-1));
  }

  get thisConstructor() { return (s) => new UnderlineCup(s); };

  get HTML() {
    return `<u>${this.str}</u>`;
  }
}

class BoldCup extends ChunkCup {
  constructor(str) {
    super(str.replace("*", ""));
  }
  get thisConstructor() { return (s) => new BoldCup(s); };

  get HTML() {
    return `<b>${this.str}</b>`;
  }
}

class SuperScriptCup extends ChunkCup {
  constructor(str) {
    super(str.replace("^", ""));
  }
  get thisConstructor() { return (s) => new SuperScriptCup(s); };

  get HTML() {
    return `<sup>${this.str}</sup>`;
  }
}

class SubScriptCup extends ChunkCup {
  constructor(str) {
    super(str.replace("~", ""));
  }
  get thisConstructor() { return (s) => new SubScriptCup(s); };

  get HTML() {
    return `<sub>${this.str}</sub>`;
  }
}

class TitleCup extends ChunkCup {
  constructor(str) {
    super(str.replace("#", ""));
  }
  get thisConstructor() { return (s) => new TitleCup(s); };

  get HTML() {
    return `<h1>${this.str}</h1>`;
  }
}



class CupContainer extends Cup {
  children: any;
  constructor(str) { 
    super(str); 
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

  get childrenHTML() {
    return this.children.map(c => c.HTML).join("");
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
  }

  get HTML() {
    return `<div style=\"position:absolute;left:${this.xPos};top:${this.yPos}\">${this.childrenHTML}</div>`;
  }
}

class InnerFractionCup extends CupContainer {
  constructor(str) {
    super(str);
    this.children = [new ChunkCup(str)];
  }

  get HTML() {
    return this.childrenHTML;
  }
}

class ParagraphCup extends CupContainer {
  constructor(str) {
    super(str);
    this.children = [new ChunkCup(str)];
  }

  get HTML() {
    return `<br>${this.childrenHTML}`;
  }
}



class DivCup extends CupContainer {
  class: any;
  containsRelativeCup: any;
  constructor(str) {
    super(str);
    this.children = [new ChunkCup(this.str)];
  }

  get HTML() {
    let classStr = this.class ? `class="${this.class}"` : "";
    return `<div ${classStr}>${this.childrenHTML}
    ${this.containsRelativeCup ? this.gridlines : ""}
    </div>`;
  }

  get gridlines() {
return `
<div class="gridlinecontainer">
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
</div>
`
  }
}


class TableCup extends CupContainer {
  hasBorder: any;
  //children are rows

  constructor(str) {
    super(str);
    this.hasBorder = str.startsWith("|");

    this.children = str.split("\n").filter(s => s.length > 0).map(s => new RowCup(s));
    //this.numCols = rows[0].children.Length;
  }

  get HTML() {
    let borderStyle = this.hasBorder ? "" : "border: none;";
    return `<table class="markdowntable" style="${borderStyle}" >${this.childrenHTML}</table>`;
  }
}

class RowCup extends CupContainer {
  constructor(str) {
    super(str);
    this.children = str.split(/(\|[^\|]*)/).filter(s => s.length > 0).map(s => new CellCup(s));
  }

  get HTML() {
    return "<tr>" + this.childrenHTML + "</tr>";
  }
}

class CellCup extends CupContainer {
  hasBorder: any;
  isRelative: boolean;
  colSpan: any;
  constructor(str) {
    super(str);
    this.hasBorder = str.startsWith("|");
    this.str = this.str.substring(1);
    this.children = [new ChunkCup(this.str)];
    this.isRelative = false; //used only for markdown cells which need it in case of relativepositioncups   
  }

  get HTML() {
    let borderStyle = this.hasBorder ? "" : " border: none;";
    let colspanStyle = this.colSpan == null ? "" : " colspan=" + this.colSpan;
    let isRelativeStyle = this.isRelative ? " position:relative;" : "";
    return `<td style=\"${borderStyle} ${isRelativeStyle}\" ${colspanStyle}>
    ${this.childrenHTML}</td>`;
  }
}

//FIELD PRESENTATION LAYER
class FieldCup extends Cup {
  UID: string;
  onResponse: () => void;
  defaultText: string;
  imageHTML: string;
  disabledText: string;
  document: any;
  _element: any;
  constructor(str, window) {
    super(str);
    this.UID = helpers.createUID();
    window[this.UID] = this;
    this.onResponse = function() {  }; //can be overwritten by solution 
    this.defaultText = "";
    this.imageHTML = "";
    this.disabledText = "";
    this.document = window.document;
  }

  get formName() {
    return ` name='${this.UID}' ${this.disabledText}`;
  }
  
  set elementValue(value) {
    if (this.element) {
      this.element.value = value;
    }
    else {
      this.defaultText = value;
    }
  }

  get elementValue() {
    if (this.element) {
      this.element.value = helpers.replaceAll(this.element.value,"x10^","e");
      return this.element.value;
    }
    else {
      return this.defaultText;
    }
  }

  get element() {
      if (this._element == undefined) {
        let found = Array.from(this.document.getElementsByName(this.UID).values());
        if (found.length > 0) { this._element = found[0]; }
      }
      return this._element;
  }

  set disabled(value) {
    if (this.element) {
      this.element.disabled = value;
    }
    else {
      this.disabledText =  value ? " disabled " : "";
    }
  }

  get disabled() {
    if (this.element) {
      return this.element.disabled;
    }
    else {
      return this.disabledText == " disabled ";
    }
  }

  src(image) {
    if (image == "star") { return imageData.star; }
    else if (image == "tick") { return imageData.tick; }
    else if  (image == "cross") { return imageData.cross; }
  }

  prependImage(src,element) {
      setTimeout(function(paramsrc, paramid, paramelement) {
          var src = paramsrc;
          var id = paramid;
          var element = paramelement;

          return function() {
              //clear old image away
              let images = this.document.getElementsByTagName("IMG");
              for (var i=0, image; image = images[i]; i++) {
                 if (image.id == id) { image.parentElement.removeChild(image); } 
              }

              //create new image
              let sourceImage = this.document.createElement('img');
              sourceImage.src = src;

              //16x16 png
              sourceImage.style.zIndex = "100";
              sourceImage.id = id;
              element.parentElement.insertBefore(sourceImage,element.nextSibling);
          };
      }(src,this.UID,element), 0);
  }

  showDecisionImage(image) {
    if (this.element) {
      this.prependImage(this.src(image), this.element);
    }
    else {
      this.imageHTML = `<img src="${this.src(image)}" id="${this.UID}">`;
    }
  }
}

class RadioCup extends FieldCup {
  letter: any;
  radioCups: this[];
  _elements: any;
  constructor(str, window) {
    super(str, window);
    this.letter = str[0];
    this.radioCups = [this];
  }

  //called by rowHTML injector
  add(radioCup) {
    radioCup.UID = this.UID;
    this.radioCups.push(radioCup);
  }

  //called by different cups which exist in the expression tree
  get HTML() {
    return this.letter + `.<input type="radio" ${this.formName} value="${this.letter}" 
    onclick="window['${this.UID}'].onResponse();" ${this.defaultText}>${this.imageHTML}`;
  }

  get elements() {
      if (this._elements == undefined) {
          this._elements = Array.from(this.document.getElementsByName(this.UID).values());
          if (this._elements.length < 1) { this._elements = undefined; }
      }
      return this._elements;
  }

  get elementValue() {
      if (this.elements) { 
        let found = this.elements.filter(r => r.checked);
        if (found.length > 0) {
          return found[0].value;
        }
        return null;
      }
      else {
        let found = this.radioCups.filter(r => r.defaultText == " checked ");
        if (found.length > 0) {
          return found[0].letter;
        }
        return null;
      }
  }

  showDecisionImage(image) {
    if (this.elements) {
      let found = this.elements.filter(r => r.checked);
      if (found.length > 0) {
        this.prependImage(this.src(image), found[0]);
      }
    }
    else {
      this.radioCups.forEach(function(r) {
        if (r.defaultText == " checked ") {
          r.imageHTML = `<img src="${r.src(image)}" id="${r.UID}">`;
        }
        else {
          r.imageHTML = "";          
        }
      });
    }
  }

  set elementValue(value) {
    if (this.elements) {
      this.elements.forEach(r => r.checked = (r.letter == value));
    }
    else {
      this.radioCups.forEach(r => r.defaultText = (value == r.letter) ? " checked " : "");
    }
  }

  set disabled(value) {
    if (this.elements) {
      this.elements.forEach(e => e.disabled = value);
    }
    else {
      this.radioCups.forEach(r => r.disabledText = value ? " disabled " : "");
    }
  }

  get disabled() {
    if (this.elements) {
      return this.elements[0].disabled;
    }
    else {
      return this.disabledText == " disabled ";
    }
  }

}

class TextAreaCup extends FieldCup {
  constructor(str, window) {
    super(str, window);
  }

  get HTML() {
    return `<br><textarea rows="10" ${this.formName} 
     onblur="window['${this.UID}'].onResponse();">${this.defaultText}</textarea>${this.imageHTML}`;
  }

}

class InputCup extends FieldCup {
  constructor(str, window) {
    super(str, window);
  }

  get HTML() {
    return `<input size="${this.str.length}" type="text" ${this.formName}  
      onblur="window['${this.UID}'].onResponse();" value="${this.defaultText}">${this.imageHTML}`;
  }
}



class ComboCup extends FieldCup {
  options: string[];
  constructor(str, window) {
    super(str, window);
    this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
  }

  get HTML() {
    let optionFunc = function(paramDefaultText) {
      let defaultText = paramDefaultText; 
      return function(o) { 
        if (o == defaultText) {
          return `<option value='${o}' selected>${o}</option>`      
        }
        return `<option value='${o}' >${o}</option>`
      };
    }
    let optionHTML = this.options.map(optionFunc(this.defaultText)).join("");
    return `<select ${this.formName}  onchange="window['${this.UID}'].onResponse();" >${optionHTML} </select>${this.imageHTML}`;
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
  _image: string;
  constructor(str, window) {
    super(str, window);
    this._image = "hourglass";
    this.defaultText = imageData.hourglass;
  }

  get HTML() {
    return `<img src="${this.defaultText}" ${this.formName}  onclick="window['${this.UID}'].onResponse();">`;
  }

  set hoverText(value) {
      this.element.title = value;
  }
  
  set elementValue(value:any) {
    //if (value == "✓" || value == true) { BEFORE TSC AUTO CORRECTION
    if (value == "✓") {
        this._image = "tick"; 
    }
    //if (value == "✗" || value == false) { BEFORE TSC AUTO CORRECTION
    if (value == "✗") {
        this._image = "cross"; 
    }
    if (value == "!") {
      this._image = "error"; 
    }
    if (this.element) {
      this.element.src = imageData[this._image];
    }
  }

  get elementValue() {
    if (this._image == "tick") { return "✓"; }
    if (this._image == "cross") { return "✗"; } 
    if (this._image == "error") { return "!"; } 
    return "";
  }

  showDecisionImage(image) {
    this._image = image;
    if (this.element) {
      this.element.src = imageData[image];
    }
    else {
      this.defaultText = imageData[this._image];
    }
  }

  set disabled(value) {
    if (this.element) {
      this.element.hidden = value;
    }
    else {
      this.disabledText = " hidden ";
    }
  }

  get disabled() {
    if (this.element) {
      return this.element.hidden;
    }
    else {
      return this.disabledText == " hidden ";
    }
  }

}


class PoundCup extends FieldCup {
  constructor(str, window) {
    super(str, window);
  }

  get HTML() {
    return `<span ${this.formName} >${this.defaultText}</span>`;
  }
  
  //DOES NOT GET MARKED. NO DECISION IMAGE
  set elementValue(value) {
    if (this.element) {
      this.element.innerText = value;
    }
    else {
      this.defaultText = value;
    }
  }

  get elementValue() {
    if (this.element) {
      return this.element.innerText;
    }
    else {
      return this.defaultText;
    }
  }

  showDecisionImage(image) {
    //do nothing
  }

  set isRed(value) {
    if (this.element) {
      this.element.style.color = value ? "red" : "" ;
    }
    else {
      this.disabledText = " hidden ";
    }
  }

  set disabled(value) {
    if (this.element) {
      this.element.hidden = value;
    }
    else {
      this.disabledText = " hidden ";
    }
  }

  get disabled() {
    if (this.element) {
      return this.element.hidden;
    }
    else {
      return this.disabledText == " hidden ";
    }
  }
}



