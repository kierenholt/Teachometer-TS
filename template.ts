class TemplateError extends Error {
    feedbackToUser: any;
    isCritical: any;
    constructor(message,paramFeedbackToUser,paramIsCritical) {
        super(message);
        this.feedbackToUser = paramFeedbackToUser;
        this.isCritical = paramIsCritical;

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

    forceCalculate()  { //used for variables Used
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
            throw new TemplateError("contains an infinite loop",true,true);
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
                if (e.isCritical) {
                    if (e.feedbackToUser) this.errorMessages.push(e.message);
                    else throw (e);
                }
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
            //if solution is numeric then compare within 5%
            if (helpers.isNumeric(this.calculatedValue)) {
                let n = Number(this.calculatedValue);
                return (helpers.isNumeric(value) && 
                    Math.abs(value-n) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*n));
            }
            else {
                //if it is a numeric in quotes (strip the quotes) - exact comparison
                if (helpers.isNumeric(helpers.stripQuotes(this.calculatedValue))) {
                    let n = Number(helpers.stripQuotes(this.calculatedValue));
                    if (helpers.isNumeric(value) && value == n) {
                        return true;
                    }
                }
                //compare nonnumerics with lowercase
                return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
            }
        }
        return false;
    }

}
