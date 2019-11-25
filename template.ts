class UserError extends Error {
    constructor(message) {
        super(message);
    }
} 

class EvaluationError extends Error {
    constructor(message) {
        super(message);
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
            if (helpers.isNumeric(this.calculatedValue) ) {
                return (helpers.isNumeric(value) && 
                    Math.abs(value-this.calculatedValue) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*this.calculatedValue));
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
    errorMessages: Error[];
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
        this.errorMessages = [];
    }

    count() {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw new UserError("contains an infinite loop");
        }
    }


    //called by replacer, forcecalculate, 
    //evaluateVariable, getSolutionText, 
    get calculatedValue()
    {
        //eval result is in JSON form
        if (this.errorMessages.length == 0 && this._calculatedValue == "null") {
            let result = "null";
            try {
                let expr = toExpressionTree(this._text, 0);
                result = expr.eval(this);
            }
            catch(e) {
                //allow code errors to bubble up to solution which uses them to alter decision images etc. 
                if (e instanceof CodeError) throw(e);
                this.errorMessages.push(e.message);
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
            if (helpers.isNumeric(this.calculatedValue)) {
                let n = Number(this.calculatedValue);
                return (helpers.isNumeric(value) && 
                    Math.abs(value-n) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*n));
            }
            return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
        }
        return false;
    }

}
