
class JSFunction {
    interpreter: any;
    error: any;
    code: any;
    JSName: any;
    cache: {};
    constructor(code, JSName) {
        try {
            this.interpreter = new Interpreter(code);
        }
        catch(error) {
            this.error = error; 
        }
        this.code = code;
        this.JSName = JSName;
        this.cache = {};
    }

    execute(parameters) { //parameters are currently js objects
        //https://neil.fraser.name/software/JS-Interpreter/docs.html
        if (this.error) { throw (this.error); }
        
        let joinedParameters = parameters.map(a => JSON.stringify(a)).join();
        if (joinedParameters in this.cache) {
            return this.cache[joinedParameters];
        }
        
        if (this.JSName != "console") {
            this.interpreter.appendCode(`
              ${this.JSName}(${joinedParameters});`);
        }

        try {
            var i = 100000; //counts up to 9998 using a while loop....?
            while (i-- && this.interpreter.step()) {
                //console.log(i);
            }
        }
        catch (e) {
            throw (e);
            this.interpreter = new Interpreter(this.code);
        }
        if (i == -1) {
            throw ("infinite loop error");            
        }
        //this.interpreter.run(); //MAY FALL INTO AN INFINITE LOOP

        //array is returned as object
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
            evaluated = JSON.stringify(this.interpreter.value);
        }
        this.cache[joinedParameters] = evaluated;
        return evaluated;                    

    }
}

class questionTemplate {
    _text: any;
    constructor(paramText) {
      this._text = paramText;
    }

    get calculatedValue() {
        return this._text;
    }

    isCorrect(value) {
        //do not turn into JSON
        if (value != null && value != undefined) {
            if (isNumeric(this.calculatedValue) ) {
                return isNumeric(value) && 
                    Math.abs(value-this.calculatedValue) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*this.calculatedValue);
            }
            return value.toLowerCase().replace("'", "\'") == this.calculatedValue.toLowerCase();
        }
        return false;
    }

    forceCalculate()  { //used for variablesUsed
        var dummy = this.calculatedValue;
    }
}

class Template extends questionTemplate {
    allTemplateComments: any;
    random: any;
    indexForListEvaluation: any;
    customFunctions: any;
    overflowCounter: number;
    OVERFLOW_LIMIT: number;
    variablesUsed: any;
    _calculatedValue: string;
    //delimiters
    constructor(paramText, paramAllTemplates, paramRandom, paramIndexForRangeEvaluation, paramCustomFunctions)
    {
        super(paramText);
        this.allTemplateComments = paramAllTemplates;
        this.random = paramRandom;
        this.indexForListEvaluation = paramIndexForRangeEvaluation; //ensures that lists are synchronised
        this.customFunctions = paramCustomFunctions;

        this.overflowCounter = 0;
        this.OVERFLOW_LIMIT = 1000;
        this.variablesUsed = [];
        for (let i = 0; i < 26; i++) {
            this.variablesUsed.push(false);
        }
        this._calculatedValue = "null";
    }

    count() {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw "Infinite loop error";
        }
    }


    //called by replacer, forcecalculate, 
    //evaluateVariable, getSolutionText, 
    get calculatedValue()
    {
        //eval result is in JSON form
        if (this._calculatedValue == "null") {

            let expr = toExpressionTree(this._text, 0);
            if (expr.eval == undefined) { throw new Error("parse error");} 
            let result = expr.eval(this);
            
            //error may generate null result
            if (result == null) {
                this._calculatedValue = "null";
                return "";
            }
     
            this._calculatedValue = result;
            
        }
        return this._calculatedValue;
    }

    removeExtraSigFigs(number) {
        var ret = (parseFloat(number).toPrecision(12));
        return parseFloat(ret);
    }

    isCorrect(value) {
        //turn value into JSON
        if (this.calculatedValue != null) {
            if (isNumeric(this.calculatedValue) ) {
                let n = Number(this.calculatedValue);
                return isNumeric(value) && 
                    Math.abs(value-n) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*n);
            }
            return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
        }
        return false;
    }

}
