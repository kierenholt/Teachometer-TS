
/* FROM CONTAINER
interface Replacer {
    pattern: RegExp;
    nodeConstructorFromMatch(parent: Container, s: string): ICup;
}
*/

class ContentDiv extends Container {
    parent: QuestionDiv;
    setValueFields: ValueField[];
    clickAwayFields: ClickAwayField[];
    questionTitle: Container;
    gridlines: GridLines[] = [];

    constructor(parent, questionTitleLogic: QuestionTitleLogic, leftRightMarkdown: string[]) {
        super(parent,"div");
        this.classes.push("content");

        //title        
        this.questionTitle = questionTitleLogic.createTitle(this);
        this.appendChildElement(this.questionTitle);

        //left and right content
        let leftRightContents = [];
        for (let c of leftRightMarkdown) {
            if (!helpers.IsStringNullOrWhiteSpace(c)) {
                let div = new Container(this, "div",[c]);
                this.appendChildElement(div);
                leftRightContents.push(div);
            }
        }
        if (leftRightContents.length == 1) { //title already exists 
            leftRightContents[0].addClass("fullWidth");
        }
        if (leftRightContents.length == 2) {
            leftRightContents[0].addClass("leftHalfWidth");
            leftRightContents[1].addClass("rightHalfWidth");
        }

        //replacers
        for (let replacer of ContentDiv.replacers) {
            this.replace(replacer);
        }

        //gridlines 
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

        //set value fields and make radiosets
        let descendants: ICup[] = helpers.getDescendants(this);
        var currentRadioSet: RadioSet = null;
        this.setValueFields = [];
        for (let d of descendants) {
            if (d instanceof ComboCup ||
                d instanceof InputCup ||
                d instanceof TextAreaCup ||
                d instanceof CheckBoxCup ||
                d instanceof DollarSpan ||
                d instanceof DollarImage) {
                    this.setValueFields.push(d);
                }
            else if (d instanceof RadioCup) {
                if (currentRadioSet) {
                    if (!currentRadioSet.letterComesAfterLastInSet(d.letter)) { //if letter is before then make new set
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

    toggleGridlines() { this.gridlines.forEach( g => g.toggleVisible()); }
    
    static replacers: Replacer[] = [ //you can remove delimiters with non-capturing groups
        { //rollover - block level
            "pattern": /(\?{3,}[^\?]*\?{3,})/,  
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"?");
                return [new RolloverCup(parent, [str])]
            } 
        },
        { //code - block level
            "pattern": /(\`{3,}[^\?]*\`{3,})/,  
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"`");
                return [new CodeCup(parent, str)];
            } 
        },
        { //table - block level - row and cell happens within contructor
            "pattern": /((?:^|\n)[\|¦](?:[^\n]|\n\|)*)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let hasBorder = str.startsWith("|");
                return [TableCup.fromString(parent, hasBorder, str)];
                //return [new TableCup(parent, hasBorder, [str])]; //row and cell are replaced inside the constructor
            },
        },
        { //relative position - block level
            "pattern": /(?:^|\n)(@\[[0-9]+,[0-9]+\]\([^)]*\))/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let xPosAsString = ""; 
                let yPosAsString = ""; 
                let childrenAsString = "";
                [, xPosAsString, yPosAsString, childrenAsString] = str.split(/@\[([\-0-9]+),([\-0-9]+)\]\(([^)]*)\)/);
                return [new RelativePositionCup(parent, xPosAsString, yPosAsString, [childrenAsString])];
            },
        },
        { //bullet - block level <li>
            "pattern": /(?:^|\n)(\*[^\n]*)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"*");
                return [new List(parent, [str])];
            },
        },
        { //line break must go AFTER any markdown codes which use \n
            "pattern": /(\n)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                return [new BreakCup(parent)];
            },
        },
        { //fraction - block level
            "pattern": /(~\[[^\]]*\]\((?:\\\)|[^)])*\))/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let top = ""; let bottom = "";
                [, top, bottom] = str.split(/~\[([^\]]*)\]\(((?:\\\)|[^)])*)\)/);
                return [new FractionCup(parent, [top], [bottom])];
            },
        },
        { //heading
            "pattern": /((?:\n|^)#[^\n]+)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"#");
                return [new HeadingCup(parent, str)];
            },
        },
        { //super script
            "pattern": /(\^[\S\$]+)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"^");
                return [new SuperScriptCup(parent, str)];
            },
        },
        { //subscript
            "pattern": /(\~[\S]+)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"~");
                return [new SubScriptCup(parent,str)];
            },
        },
        { //bold
            "pattern": /(\*[^*]+\*)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                str = helpers.trimChar(str,"*");
                return [new BoldCup(parent,str)];
            },
        },
        { //underline
            "pattern": /(_[^_]+_)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                return [new UnderlineCup(parent, str)];
            },
        },
        { //dollar image - must come before normal image and dollar
            "pattern": /(!\[[^\]]*\]\(\$\$\))/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let alt = ""; let width = ""; let dummy = "";
                [,alt,width] = str.match(/!\[([^\],]*),?([^\]]*)\]/);
                return [new DollarImage(parent, alt, width)];
            },
        },
        { //dollar span
            "pattern": /(\$\$)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                return [new DollarSpan(parent)];
            },
        },
        { //anchor
            "pattern": /(?:[^\!]|^)(\[[^\]]*]\([^\)]*\))/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let text = ""; let url = "";
                [, text, url,] = str.split(/\[([^\]]*)]\(([^\)]*)\)/);
                if (!(url.startsWith("http://") || url.startsWith("https://"))) {
                    url = "https://" + url;
                }
                return parent.settings.removeHyperlinks ? null : [new AnchorCup(parent, url, text)];
            },
        },
        { //image
            "pattern": /(!\[[^\]]*]\([^\)]*\))/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let comment = ""; let source = "";
                [, comment, source,] = str.split(/!\[([^\]]*)]\(([^\)]*)\)/g);
                let commaIndex = comment.indexOf(",");
                let width = (commaIndex != -1) ? Number(comment.substr(commaIndex + 1)) : undefined ;
                return [new ImageCup(parent, source, comment, width)];
            },
        },
        { //textarea
            "pattern": /(_{10,})/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let decisionImage = new Icon(parent, IconName.none);
                let span = new Span(parent, "");
                return [new TextAreaCup(parent, decisionImage, span), new BreakCup(parent), decisionImage, span];
            },
        },
        { //input field
            "pattern": /(_{2,9})/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let decisionImage = new Icon(parent, IconName.none);
                let size = str.length;
                let span = new Span(parent, "");
                return [new InputCup(parent, size, decisionImage, span), decisionImage, span];
            },
        },
        { //check box field - does not need decision image
            "pattern": /(?:[^\!]|^)(\[\])/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let span = new Span(parent, "");
                return [new CheckBoxCup(parent, IconName.hourglass, span), span];
            },
        },
        { //radio button field
            "pattern": /(?:^|\s)([A-Z]\.)/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let decisionImage = new Icon(parent, IconName.none);
                let span = new Span(parent, "");
                return [new RadioCup(parent, str[0], decisionImage, span), decisionImage, span];
            },
        },
        { //combo box
            "pattern": /({[^}]+})/,
            "nodeConstructorFromMatch": (parent: Container, str: string) => {
                let decisionImage = new Icon(parent, IconName.none);
                str = helpers.trimChar(str,"{");
                str = helpers.trimChar(str,"}");
                let span = new Span(parent, "");
                return [new ComboCup(parent, [" ",str], decisionImage, span), decisionImage, span];
            },
        }
    ];
}