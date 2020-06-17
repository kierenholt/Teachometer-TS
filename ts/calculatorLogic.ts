class CalculatorBase {
    div: Container;

    constructor() {}
    
    moveAfterQuestion(ql: QuestionLogic) {
        let index = ql.questionDiv._childNodes.indexOf(this.div);
        if (index != -1 && this.div.classes.indexOf("displayNone") == -1) {
            //if already in correct position and showing, hide
            this.div.addClass("displayNone");
        }
        else {
            //move to position and show
            this.div.removeClass("displayNone");
            ql.questionDiv.appendChildElement(this.div);
            this.div._parent = ql.questionDiv;
        }
    }
}

class CalculatorLogic extends CalculatorBase {
    interpreter: any;
    input: InputCup;
    errorSpan: Span;
    image: Icon;
    output: Span;
    maxHeightBlock: Container;
    helpText = `Type the calculation in. Press Enter to calculate. Supports: 
    operations + - * /
    E notation e.g. 5e-4 the same as 0.0005  
    functions sqrt() exp() ln() pow()
    trig functions sin() cos() tan() arcsin() arccos() arctan() in degrees
    variables e.g. x = 9.
    constants pi, e`;

    constructor() {
        super();
        this.interpreter = new Interpreter(this.customFunctions);
    }

    createDiv(parent) {
        this.div = new Container(parent, "div").addClass("calculatorContainer").addClass("displayNone");
        this.maxHeightBlock = new Container(this.div,"div").addClass("calculatorOutput");
        this.output = new Span(this.div, "");
        this.maxHeightBlock.appendChildElement(this.output);
        this.errorSpan = new Span(this.div, "");
        this.image = new Icon(this.div, IconName.help).setAttribute("title", this.helpText);
        this.input = new InputCup(parent, 20, this.image, this.errorSpan).addClass("calculatorInput");

        this.input.setEvent("onkeyup",(e) => {
            this.checkEnterKey(e);
        });

        this.div._childNodes = [this.maxHeightBlock, this.input, this.image];
        return this.div;
    }

    checkEnterKey(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13 && this.input.getValue()) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            var input = this.input.getValue();
            var result = "";
            var i;
            try {
                this.interpreter.appendCode(input);
                i = 100000; //counts up to 9998 using a while loop....?
                while (i-- && this.interpreter.step()) {}
                result = this.interpreter.value;
            }
            catch (e) { //re-throw to be caught at expression.ts 
                result = "Error:code did not execute completely";  
                this.interpreter = new Interpreter(this.customFunctions);
            }
            if (i == -1) {
                result = "Error: Code contains an infinite loop";
                this.interpreter = new Interpreter(this.customFunctions);            
            }
            this.output.innerHTML += (input + " => " + result + "\n");
            this.maxHeightBlock.getElement(true).scrollTo(0,1000);
        }
    }

    customFunctions: string = `
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
}