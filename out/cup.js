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
        this.str = str;
    }
    Cup.prototype.onThisAndChildren = function (action) {
        action(this);
    };
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
        return _this;
    }
    Object.defineProperty(ImageCup.prototype, "HTML", {
        get: function () {
            return "<img style=\"position: relative; left:" + (50 - this.width / 2) + "%; width:" + this.width + "%\" \n      src=\"" + this.source + "\" alt=\"" + this.comment + "\" />";
        },
        enumerable: true,
        configurable: true
    });
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
        return _this;
    }
    Object.defineProperty(AnchorCup.prototype, "HTML", {
        get: function () {
            return "<a href=\"" + this.url + "\" target=\"_blank\">" + this.text + "</a>";
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
///does not replace chunks or dollars
var CodeCup = /** @class */ (function (_super) {
    __extends(CodeCup, _super);
    function CodeCup(str) {
        var _this = this;
        str = helpers.trimChar(str, "`");
        str = helpers.trimChar(str, "\n");
        _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        return _this;
    }
    Object.defineProperty(CodeCup.prototype, "HTML", {
        get: function () {
            return "<div class=\"codeblock\">" + this.childrenHTML + "</div>";
        },
        enumerable: true,
        configurable: true
    });
    return CodeCup;
}(Cup));
var ChunkCup = /** @class */ (function (_super) {
    __extends(ChunkCup, _super);
    function ChunkCup(str) {
        return _super.call(this, str) || this;
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
    Object.defineProperty(ChunkCup.prototype, "HTML", {
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
        return _super.call(this, str.substring(1, str.length - 1)) || this;
    }
    Object.defineProperty(UnderlineCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new UnderlineCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(UnderlineCup.prototype, "HTML", {
        get: function () {
            return "<u>" + this.str + "</u>";
        },
        enumerable: true,
        configurable: true
    });
    return UnderlineCup;
}(ChunkCup));
var BoldCup = /** @class */ (function (_super) {
    __extends(BoldCup, _super);
    function BoldCup(str) {
        return _super.call(this, str.replace("*", "")) || this;
    }
    Object.defineProperty(BoldCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new BoldCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(BoldCup.prototype, "HTML", {
        get: function () {
            return "<b>" + this.str + "</b>";
        },
        enumerable: true,
        configurable: true
    });
    return BoldCup;
}(ChunkCup));
var SuperScriptCup = /** @class */ (function (_super) {
    __extends(SuperScriptCup, _super);
    function SuperScriptCup(str) {
        return _super.call(this, str.replace("^", "")) || this;
    }
    Object.defineProperty(SuperScriptCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new SuperScriptCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(SuperScriptCup.prototype, "HTML", {
        get: function () {
            return "<sup>" + this.str + "</sup>";
        },
        enumerable: true,
        configurable: true
    });
    return SuperScriptCup;
}(ChunkCup));
var SubScriptCup = /** @class */ (function (_super) {
    __extends(SubScriptCup, _super);
    function SubScriptCup(str) {
        return _super.call(this, str.replace("~", "")) || this;
    }
    Object.defineProperty(SubScriptCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new SubScriptCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(SubScriptCup.prototype, "HTML", {
        get: function () {
            return "<sub>" + this.str + "</sub>";
        },
        enumerable: true,
        configurable: true
    });
    return SubScriptCup;
}(ChunkCup));
var TitleCup = /** @class */ (function (_super) {
    __extends(TitleCup, _super);
    function TitleCup(str) {
        return _super.call(this, str.replace("#", "")) || this;
    }
    Object.defineProperty(TitleCup.prototype, "thisConstructor", {
        get: function () { return function (s) { return new TitleCup(s); }; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(TitleCup.prototype, "HTML", {
        get: function () {
            return "<h1>" + this.str + "</h1>";
        },
        enumerable: true,
        configurable: true
    });
    return TitleCup;
}(ChunkCup));
var CupContainer = /** @class */ (function (_super) {
    __extends(CupContainer, _super);
    function CupContainer(str) {
        return _super.call(this, str) || this;
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
    Object.defineProperty(CupContainer.prototype, "childrenHTML", {
        get: function () {
            return this.children.map(function (c) { return c.HTML; }).join("");
        },
        enumerable: true,
        configurable: true
    });
    return CupContainer;
}(Cup));
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
        return _this;
    }
    Object.defineProperty(RelativePositionCup.prototype, "HTML", {
        get: function () {
            return "<div style=\"position:absolute;left:" + this.xPos + ";top:" + this.yPos + "\">" + this.childrenHTML + "</div>";
        },
        enumerable: true,
        configurable: true
    });
    return RelativePositionCup;
}(CupContainer));
var InnerFractionCup = /** @class */ (function (_super) {
    __extends(InnerFractionCup, _super);
    function InnerFractionCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = [new ChunkCup(str)];
        return _this;
    }
    Object.defineProperty(InnerFractionCup.prototype, "HTML", {
        get: function () {
            return this.childrenHTML;
        },
        enumerable: true,
        configurable: true
    });
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
            return "<br>" + this.childrenHTML;
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
    Object.defineProperty(DivCup.prototype, "HTML", {
        get: function () {
            var classStr = this.class ? "class=\"" + this.class + "\"" : "";
            return "<div " + classStr + ">" + this.childrenHTML + "\n    " + (this.containsRelativeCup ? this.gridlines : "") + "\n    </div>";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DivCup.prototype, "gridlines", {
        get: function () {
            return "\n<div class=\"gridlinecontainer\">\n    <div class=\"hgridline\"><p>10%</p></div>\n    <div class=\"hgridline\"><p>20%</p></div>\n    <div class=\"hgridline\"><p>30%</p></div>\n    <div class=\"hgridline\"><p>40%</p></div>\n    <div class=\"hgridline\"><p>50%</p></div>\n    <div class=\"hgridline\"><p>60%</p></div>\n    <div class=\"hgridline\"><p>70%</p></div>\n    <div class=\"hgridline\"><p>80%</p></div>\n    <div class=\"hgridline\"><p>90%</p></div>\n    <div class=\"hgridline\"><p>100%</p></div>\n    \n    <div class=\"vgridline\"><p>10%</p></div>\n    <div class=\"vgridline\"><p>20%</p></div>\n    <div class=\"vgridline\"><p>30%</p></div>\n    <div class=\"vgridline\"><p>40%</p></div>\n    <div class=\"vgridline\"><p>50%</p></div>\n    <div class=\"vgridline\"><p>60%</p></div>\n    <div class=\"vgridline\"><p>70%</p></div>\n    <div class=\"vgridline\"><p>80%</p></div>\n    <div class=\"vgridline\"><p>90%</p></div>\n    <div class=\"vgridline\"><p>100%</p></div>\n</div>\n";
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
        _this.children = str.split("\n").filter(function (s) { return s.length > 0; }).map(function (s) { return new RowCup(s); });
        return _this;
        //this.numCols = rows[0].children.Length;
    }
    Object.defineProperty(TableCup.prototype, "HTML", {
        get: function () {
            var borderStyle = this.hasBorder ? "" : "border: none;";
            return "<table class=\"markdowntable\" style=\"" + borderStyle + "\" >" + this.childrenHTML + "</table>";
        },
        enumerable: true,
        configurable: true
    });
    return TableCup;
}(CupContainer));
var RowCup = /** @class */ (function (_super) {
    __extends(RowCup, _super);
    function RowCup(str) {
        var _this = _super.call(this, str) || this;
        _this.children = str.split(/(\|[^\|]*)/).filter(function (s) { return s.length > 0; }).map(function (s) { return new CellCup(s); });
        return _this;
    }
    Object.defineProperty(RowCup.prototype, "HTML", {
        get: function () {
            return "<tr>" + this.childrenHTML + "</tr>";
        },
        enumerable: true,
        configurable: true
    });
    return RowCup;
}(CupContainer));
var CellCup = /** @class */ (function (_super) {
    __extends(CellCup, _super);
    function CellCup(str) {
        var _this = _super.call(this, str) || this;
        _this.hasBorder = str.startsWith("|");
        _this.str = _this.str.substring(1);
        _this.children = [new ChunkCup(_this.str)];
        _this.isRelative = false; //used only for markdown cells which need it in case of relativepositioncups   
        return _this;
    }
    Object.defineProperty(CellCup.prototype, "HTML", {
        get: function () {
            var borderStyle = this.hasBorder ? "" : " border: none;";
            var colspanStyle = this.colSpan == null ? "" : " colspan=" + this.colSpan;
            var isRelativeStyle = this.isRelative ? " position:relative;" : "";
            return "<td style=\"" + borderStyle + " " + isRelativeStyle + "\" " + colspanStyle + ">\n    " + this.childrenHTML + "</td>";
        },
        enumerable: true,
        configurable: true
    });
    return CellCup;
}(CupContainer));
//FIELD PRESENTATION LAYER
var FieldCup = /** @class */ (function (_super) {
    __extends(FieldCup, _super);
    function FieldCup(str, window) {
        var _this = _super.call(this, str) || this;
        _this.UID = helpers.createUID();
        window[_this.UID] = _this;
        _this.onResponse = function () { }; //can be overwritten by solution 
        _this.defaultText = "";
        _this.imageHTML = "";
        _this.disabledText = "";
        _this.document = window.document;
        return _this;
    }
    Object.defineProperty(FieldCup.prototype, "formName", {
        get: function () {
            return " name='" + this.UID + "' " + this.disabledText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FieldCup.prototype, "elementValue", {
        get: function () {
            if (this.element) {
                this.element.value = helpers.replaceAll(this.element.value, "x10^", "e");
                return this.element.value;
            }
            else {
                return this.defaultText;
            }
        },
        set: function (value) {
            if (this.element) {
                this.element.value = value;
            }
            else {
                this.defaultText = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FieldCup.prototype, "element", {
        get: function () {
            if (this._element == undefined) {
                var found = this.document.getElementsByName(this.UID);
                if (found.length > 0) {
                    this._element = found[0];
                }
            }
            return this._element;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FieldCup.prototype, "disabled", {
        get: function () {
            if (this.element) {
                return this.element.disabled;
            }
            else {
                return this.disabledText == " disabled ";
            }
        },
        set: function (value) {
            if (this.element) {
                this.element.disabled = value;
            }
            else {
                this.disabledText = value ? " disabled " : "";
            }
        },
        enumerable: true,
        configurable: true
    });
    FieldCup.prototype.src = function (image) {
        if (image == "star") {
            return imageData.star;
        }
        else if (image == "tick") {
            return imageData.tick;
        }
        else if (image == "cross") {
            return imageData.cross;
        }
    };
    FieldCup.prototype.prependImage = function (src, element) {
        setTimeout(function (paramsrc, paramid, paramelement) {
            var src = paramsrc;
            var id = paramid;
            var element = paramelement;
            return function () {
                //clear old image away
                var images = this.document.getElementsByTagName("IMG");
                for (var i = 0, image; image = images[i]; i++) {
                    if (image.id == id) {
                        image.parentElement.removeChild(image);
                    }
                }
                //create new image
                var sourceImage = this.document.createElement('img');
                sourceImage.src = src;
                //16x16 png
                sourceImage.style.zIndex = "100";
                sourceImage.id = id;
                element.parentElement.insertBefore(sourceImage, element.nextSibling);
            };
        }(src, this.UID, element), 0);
    };
    FieldCup.prototype.showDecisionImage = function (image) {
        if (this.element) {
            this.prependImage(this.src(image), this.element);
        }
        else {
            this.imageHTML = "<img src=\"" + this.src(image) + "\" id=\"" + this.UID + "\">";
        }
    };
    return FieldCup;
}(Cup));
var RadioCup = /** @class */ (function (_super) {
    __extends(RadioCup, _super);
    function RadioCup(str, window) {
        var _this = _super.call(this, str, window) || this;
        _this.letter = str[0];
        _this.radioCups = [_this];
        return _this;
    }
    //called by rowHTML injector
    RadioCup.prototype.add = function (radioCup) {
        radioCup.UID = this.UID;
        this.radioCups.push(radioCup);
    };
    Object.defineProperty(RadioCup.prototype, "HTML", {
        //called by different cups which exist in the expression tree
        get: function () {
            return this.letter + (".<input type=\"radio\" " + this.formName + " value=\"" + this.letter + "\" \n    onclick=\"window['" + this.UID + "'].onResponse();\" " + this.defaultText + ">" + this.imageHTML);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RadioCup.prototype, "elements", {
        get: function () {
            if (this._elements == undefined) {
                var found = this.document.getElementsByName(this.UID);
                this._elements = [];
                for (var i = 0; i < found.length; i++) {
                    this._elements.push(found[i]);
                }
                if (this._elements.length < 1) {
                    this._elements = undefined;
                }
            }
            return this._elements;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RadioCup.prototype, "elementValue", {
        get: function () {
            if (this.elements) {
                var found = this.elements.filter(function (r) { return r.checked; });
                if (found.length > 0) {
                    return found[0].value;
                }
                return null;
            }
            else {
                var found = this.radioCups.filter(function (r) { return r.defaultText == " checked "; });
                if (found.length > 0) {
                    return found[0].letter;
                }
                return null;
            }
        },
        set: function (value) {
            if (this.elements) {
                this.elements.forEach(function (r) { return r.checked = (r.letter == value); });
            }
            else {
                this.radioCups.forEach(function (r) { return r.defaultText = (value == r.letter) ? " checked " : ""; });
            }
        },
        enumerable: true,
        configurable: true
    });
    RadioCup.prototype.showDecisionImage = function (image) {
        if (this.elements) {
            var found = this.elements.filter(function (r) { return r.checked; });
            if (found.length > 0) {
                this.prependImage(this.src(image), found[0]);
            }
        }
        else {
            this.radioCups.forEach(function (r) {
                if (r.defaultText == " checked ") {
                    r.imageHTML = "<img src=\"" + r.src(image) + "\" id=\"" + r.UID + "\">";
                }
                else {
                    r.imageHTML = "";
                }
            });
        }
    };
    Object.defineProperty(RadioCup.prototype, "disabled", {
        get: function () {
            if (this.elements) {
                return this.elements[0].disabled;
            }
            else {
                return this.disabledText == " disabled ";
            }
        },
        set: function (value) {
            if (this.elements) {
                this.elements.forEach(function (e) { return e.disabled = value; });
            }
            else {
                this.radioCups.forEach(function (r) { return r.disabledText = value ? " disabled " : ""; });
            }
        },
        enumerable: true,
        configurable: true
    });
    return RadioCup;
}(FieldCup));
var TextAreaCup = /** @class */ (function (_super) {
    __extends(TextAreaCup, _super);
    function TextAreaCup(str, window) {
        return _super.call(this, str, window) || this;
    }
    Object.defineProperty(TextAreaCup.prototype, "HTML", {
        get: function () {
            return "<br><textarea rows=\"10\" " + this.formName + " \n     onblur=\"window['" + this.UID + "'].onResponse();\">" + this.defaultText + "</textarea>" + this.imageHTML;
        },
        enumerable: true,
        configurable: true
    });
    return TextAreaCup;
}(FieldCup));
var InputCup = /** @class */ (function (_super) {
    __extends(InputCup, _super);
    function InputCup(str, window) {
        return _super.call(this, str, window) || this;
    }
    Object.defineProperty(InputCup.prototype, "HTML", {
        get: function () {
            return "<input size=\"" + this.str.length + "\" type=\"text\" " + this.formName + "  \n      onblur=\"window['" + this.UID + "'].onResponse();\" value=\"" + this.defaultText + "\">" + this.imageHTML;
        },
        enumerable: true,
        configurable: true
    });
    return InputCup;
}(FieldCup));
var ComboCup = /** @class */ (function (_super) {
    __extends(ComboCup, _super);
    function ComboCup(str, window) {
        var _this = _super.call(this, str, window) || this;
        _this.options = [" "].concat(_this.str.substring(1, _this.str.length - 1).split("/"));
        return _this;
    }
    Object.defineProperty(ComboCup.prototype, "HTML", {
        get: function () {
            var optionFunc = function (paramDefaultText) {
                var defaultText = paramDefaultText;
                return function (o) {
                    if (o == defaultText) {
                        return "<option value='" + o + "' selected>" + o + "</option>";
                    }
                    return "<option value='" + o + "' >" + o + "</option>";
                };
            };
            var optionHTML = this.options.map(optionFunc(this.defaultText)).join("");
            return "<select " + this.formName + "  onchange=\"window['" + this.UID + "'].onResponse();\" >" + optionHTML + " </select>" + this.imageHTML;
        },
        enumerable: true,
        configurable: true
    });
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
    function CheckBoxCup(str, window) {
        var _this = _super.call(this, str, window) || this;
        _this._image = "hourglass";
        _this.defaultText = imageData.hourglass;
        return _this;
    }
    Object.defineProperty(CheckBoxCup.prototype, "HTML", {
        get: function () {
            return "<img src=\"" + this.defaultText + "\" " + this.formName + "  onclick=\"window['" + this.UID + "'].onResponse();\">";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CheckBoxCup.prototype, "hoverText", {
        set: function (value) {
            this.element.title = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CheckBoxCup.prototype, "elementValue", {
        get: function () {
            if (this._image == "tick") {
                return "✓";
            }
            if (this._image == "cross") {
                return "✗";
            }
            if (this._image == "error") {
                return "!";
            }
            return "";
        },
        set: function (value) {
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
        },
        enumerable: true,
        configurable: true
    });
    CheckBoxCup.prototype.showDecisionImage = function (image) {
        this._image = image;
        if (this.element) {
            this.element.src = imageData[image];
        }
        else {
            this.defaultText = imageData[this._image];
        }
    };
    Object.defineProperty(CheckBoxCup.prototype, "disabled", {
        get: function () {
            if (this.element) {
                return this.element.hidden;
            }
            else {
                return this.disabledText == " hidden ";
            }
        },
        set: function (value) {
            if (this.element) {
                this.element.hidden = value;
            }
            else {
                this.disabledText = " hidden ";
            }
        },
        enumerable: true,
        configurable: true
    });
    return CheckBoxCup;
}(FieldCup));
var PoundCup = /** @class */ (function (_super) {
    __extends(PoundCup, _super);
    function PoundCup(str, window) {
        return _super.call(this, str, window) || this;
    }
    Object.defineProperty(PoundCup.prototype, "HTML", {
        get: function () {
            return "<span " + this.formName + " >" + this.defaultText + "</span>";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PoundCup.prototype, "elementValue", {
        get: function () {
            if (this.element) {
                return this.element.innerText;
            }
            else {
                return this.defaultText;
            }
        },
        //DOES NOT GET MARKED. NO DECISION IMAGE
        set: function (value) {
            if (this.element) {
                this.element.innerText = value;
            }
            else {
                this.defaultText = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    PoundCup.prototype.showDecisionImage = function (image) {
        //do nothing
    };
    Object.defineProperty(PoundCup.prototype, "isRed", {
        set: function (value) {
            if (this.element) {
                this.element.style.color = value ? "red" : "";
            }
            else {
                this.disabledText = " hidden ";
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PoundCup.prototype, "disabled", {
        get: function () {
            if (this.element) {
                return this.element.hidden;
            }
            else {
                return this.disabledText == " hidden ";
            }
        },
        set: function (value) {
            if (this.element) {
                this.element.hidden = value;
            }
            else {
                this.disabledText = " hidden ";
            }
        },
        enumerable: true,
        configurable: true
    });
    return PoundCup;
}(FieldCup));
//# sourceMappingURL=cup.js.map