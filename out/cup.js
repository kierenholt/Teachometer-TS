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
var Cup = /** @class */ (function () {
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
var ImageCup = /** @class */ (function (_super) {
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
    //does not do replace (i.e. cups), but does do textreplace (dollars)
    //for replacing dollars with numbers etc.
    ImageCup.prototype.textReplace = function (patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            // p1 is nondigits, p2 digits, and p3 non-alphanumerics
            return getTemplateValue();
        }
        this.source = this.source.replace(patternMakeItGlobal, replacer);
        this.comment = this.comment.replace(patternMakeItGlobal, replacer);
    };
    return ImageCup;
}(Cup));
var AnchorCup = /** @class */ (function (_super) {
    __extends(AnchorCup, _super);
    function AnchorCup(str) {
        var _a;
        var _this = _super.call(this, str) || this;
        _a = str.split(/\[([^\]]*)]\(([^\)]*)\)/), _this.text = _a[1], _this.url = _a[2];
        if (!(_this.url.startsWith("http://") || _this.url.startsWith("https://")))
            _this.url = "https://" + _this.url;
        _this.tagName = "a";
        _this.attributes.push("href=\"" + _this.url + "\"");
        _this.attributes.push("target=\"_blank\">");
        return _this;
    }
    Object.defineProperty(AnchorCup.prototype, "innerHTML", {
        get: function () {
            return this.text;
        },
        enumerable: true,
        configurable: true
    });
    //does not do replace (i.e. cups), but does do textreplace (dollars)
    //for replacing dollars with numbers etc.
    AnchorCup.prototype.textReplace = function (patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            // p1 is nondigits, p2 digits, and p3 non-alphanumerics
            return getTemplateValue();
        }
        this.text = this.text.replace(patternMakeItGlobal, replacer);
        this.url = this.url.replace(patternMakeItGlobal, replacer);
    };
    return AnchorCup;
}(Cup));
///has a different replace function from chunkcup
///replacing is done by innerfractioncup
var FractionCup = /** @class */ (function (_super) {
    __extends(FractionCup, _super);
    function FractionCup(str) {
        var _a;
        var _this = _super.call(this, str) || this;
        var top = "";
        var bottom = "";
        //~\[([^\]]*)\]\(([^)]*)\)
        //~\[([^\]]*)\]\((?:\\\)|[^)])*)\)
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
var ChunkCup = /** @class */ (function (_super) {
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
    //for parsing cups
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
        return retVal; //return an array of replacements
    };
    //for replacing dollars with numbers etc.
    ChunkCup.prototype.textReplace = function (patternMakeItGlobal, getTemplateValue) {
        function replacer(match, p1, p2, p3, offset, string) {
            // p1 is nondigits, p2 digits, and p3 non-alphanumerics
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
var UnderlineCup = /** @class */ (function (_super) {
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
var BoldCup = /** @class */ (function (_super) {
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
var SuperScriptCup = /** @class */ (function (_super) {
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
var SubScriptCup = /** @class */ (function (_super) {
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
var TitleCup = /** @class */ (function (_super) {
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
var CupContainer = /** @class */ (function (_super) {
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
                else { //child does not have a replace function
                    newChildren.push(child);
                }
            }
            this.children = newChildren;
        }
        return [this]; //needs to return an array since chunkcup does it
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
///does not replace chunks or dollars
var CodeCup = /** @class */ (function (_super) {
    __extends(CodeCup, _super);
    function CodeCup(str) {
        var _this = this;
        str = helpers.trimChar(str, "`");
        str = helpers.trimChar(str, "\n");
        _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        _this.attributes.push("class=\"codeblock\"");
        _this.tagName = "div";
        return _this;
    }
    return CodeCup;
}(CupContainer));
var RelativePositionCup = /** @class */ (function (_super) {
    __extends(RelativePositionCup, _super);
    function RelativePositionCup(str, inPixels) {
        var _a;
        var _this = _super.call(this, str) || this;
        //strip newline
        // if (this.str.StartsWith("\n")){
        //   this.str = this.str.Substring(1);
        // }
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
var InnerFractionCup = /** @class */ (function (_super) {
    __extends(InnerFractionCup, _super);
    function InnerFractionCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        return _this;
    }
    return InnerFractionCup;
}(CupContainer));
var ParagraphCup = /** @class */ (function (_super) {
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
var DivCup = /** @class */ (function (_super) {
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
var TableCup = /** @class */ (function (_super) {
    __extends(TableCup, _super);
    //children are rows
    function TableCup(str) {
        var _this = _super.call(this, str) || this;
        _this.hasBorder = str.startsWith("|");
        _this.tagName = "table";
        _this.children = str.split("\n").filter(function (s) { return s.length > 0; }).map(function (s) { return new RowCup(s); });
        _this.attributes.push("class=\"markdowntable\"");
        _this.attributes.push("style=\"" + (_this.hasBorder ? "" : "border: none;") + "\"");
        return _this;
        //this.numCols = rows[0].children.Length;
    }
    return TableCup;
}(CupContainer));
var RowCup = /** @class */ (function (_super) {
    __extends(RowCup, _super);
    function RowCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = str.split(/(\|[^\|]*)/).filter(function (s) { return s.length > 0; }).map(function (s) { return new CellCup(s); });
        _this.tagName = "tr";
        return _this;
    }
    return RowCup;
}(CupContainer));
var CellCup = /** @class */ (function (_super) {
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
//FIELD PRESENTATION LAYER
var FieldCup = /** @class */ (function (_super) {
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
        //replaces the dummy element with a real HTML input element
        newElement.value = this._element.value;
        newElement.disabled = this._element.disabled;
        this._element = newElement;
        //get decision image, update
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
    FieldCup.prototype.onResponse = function () { }; //to be overridden;
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
var RadioSet = /** @class */ (function () {
    function RadioSet() {
        this.radioCups = [];
        this.instanceNum = RadioSet.numInstances++;
        this._element = { value: "", "disabled": false };
        this._decisionImage = decisionImageEnum.None;
    }
    Object.defineProperty(RadioSet.prototype, "decisionImage", {
        set: function (value) {
            //remove all decisions first
            this.radioCups.forEach(function (r) { return r.decisionImage = decisionImageEnum.None; });
            //apply image to checked radio only
            var found = this.radioCups.filter(function (r) { return r.elementValue == true; });
            if (found) {
                found[0].decisionImage = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    //called by rowHTML injector
    RadioSet.prototype.add = function (radioCup) {
        this.radioCups.push(radioCup);
        radioCup.onResponse = this._cachedOnResponse;
        //add formname to all radiocups so only one can be selected at a time
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
            if (found) {
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
    RadioSet.numInstances = 0;
    return RadioSet;
}());
var RadioCup = /** @class */ (function (_super) {
    __extends(RadioCup, _super);
    function RadioCup(str) {
        var _this = _super.call(this, str) || this;
        _this.letter = str[0];
        _this.radioCups = [_this];
        _this._element = { checked: false, "disabled": false };
        return _this;
    }
    Object.defineProperty(RadioCup.prototype, "HTML", {
        //called by different cups which exist in the expression tree
        get: function () {
            return this.letter + (".<input type=\"radio\" " + this.attributes.join("  ") + " value=\"" + this.letter + "\" >" + this.decisionImageHTML);
        },
        enumerable: true,
        configurable: true
    });
    RadioCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        //attach onresponse function to click event 
        newElement.onclick = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    Object.defineProperty(RadioCup.prototype, "elementValue", {
        get: function () { return this._element.checked; } //true or false
        ,
        set: function (value) { this._element.checked = (value == true); } //true or false
        ,
        enumerable: true,
        configurable: true
    });
    return RadioCup;
}(FieldCup));
var TextAreaCup = /** @class */ (function (_super) {
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
        //attach onresponse function to blur event 
        newElement.onblur = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    return TextAreaCup;
}(FieldCup));
var InputCup = /** @class */ (function (_super) {
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
        //attach onresponse function to blur event 
        newElement.onblur = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    return InputCup;
}(FieldCup));
var ComboCup = /** @class */ (function (_super) {
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
        //attach onresponse function to blur event 
        newElement.onchange = function (paramCup) {
            var cup = paramCup;
            return function () { cup.onResponse(); };
        }(this);
    };
    //for replacing dollars with numbers etc.
    ComboCup.prototype.textReplace = function (pattern, getTemplateValue) {
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
        var replacer = function (match, offset, string) {
            // p1 is nondigits, p2 digits, and p3 non-alphanumericsif (index > -1) 
            return getTemplateValue();
        };
        this.str = this.str.replace(pattern, replacer);
        this.options = [" "].concat(this.str.substring(1, this.str.length - 1).split("/"));
    };
    return ComboCup;
}(FieldCup));
var CheckBoxCup = /** @class */ (function (_super) {
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
        this._element = { value: "", disabled: false }; //no element
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
                this._element.value = "tick"; //just stored for markbook
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
var PoundCup = /** @class */ (function (_super) {
    __extends(PoundCup, _super);
    function PoundCup(str) {
        return _super.call(this, str) || this;
    }
    Object.defineProperty(PoundCup.prototype, "HTML", {
        get: function () {
            return "<span " + this.attributes.join("  ") + " ></span>"; //no decision image
        },
        enumerable: true,
        configurable: true
    });
    PoundCup.prototype.setElement = function (newElement) {
        _super.prototype.setElement.call(this, newElement);
        //no change event etc. `
        //no decision element
    };
    Object.defineProperty(PoundCup.prototype, "elementValue", {
        get: function () {
            return this._element.innerText;
        },
        //DOES NOT GET MARKED. NO DECISION IMAGE
        set: function (value) {
            this._element.innerText = value;
        },
        enumerable: true,
        configurable: true
    });
    PoundCup.prototype.showDecisionImage = function (image) {
        //do nothing
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
//# sourceMappingURL=cup.js.map