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
var JSFunction = /** @class */ (function () {
    function JSFunction(code, JSName) {
        try {
            this.interpreter = new Interpreter(code);
        }
        catch (error) {
            this.error = error;
        }
        this.code = code;
        this.JSName = JSName;
        this.cache = {};
    }
    JSFunction.prototype.execute = function (parameters) {
        //https://neil.fraser.name/software/JS-Interpreter/docs.html
        if (this.error) {
            throw (this.error);
        }
        var joinedParameters = parameters.map(function (a) { return JSON.stringify(a); }).join();
        if (joinedParameters in this.cache) {
            return this.cache[joinedParameters];
        }
        if (this.JSName != "console") {
            this.interpreter.appendCode("\n              " + this.JSName + "(" + joinedParameters + ");");
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
            var arr = [];
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
    };
    return JSFunction;
}());
var questionTemplate = /** @class */ (function () {
    function questionTemplate(paramText) {
        this._text = paramText;
    }
    Object.defineProperty(questionTemplate.prototype, "calculatedValue", {
        get: function () {
            return this._text;
        },
        enumerable: true,
        configurable: true
    });
    questionTemplate.prototype.isCorrect = function (value) {
        //do not turn into JSON
        if (value != null && value != undefined) {
            if (isNumeric(this.calculatedValue)) {
                return isNumeric(value) &&
                    Math.abs(value - this.calculatedValue) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * this.calculatedValue);
            }
            return value.toLowerCase().replace("'", "\'") == this.calculatedValue.toLowerCase();
        }
        return false;
    };
    questionTemplate.prototype.forceCalculate = function () {
        var dummy = this.calculatedValue;
    };
    return questionTemplate;
}());
var Template = /** @class */ (function (_super) {
    __extends(Template, _super);
    //delimiters
    function Template(paramText, paramAllTemplates, paramRandom, paramIndexForRangeEvaluation, paramCustomFunctions) {
        var _this = _super.call(this, paramText) || this;
        _this.allTemplateComments = paramAllTemplates;
        _this.random = paramRandom;
        _this.indexForListEvaluation = paramIndexForRangeEvaluation; //ensures that lists are synchronised
        _this.customFunctions = paramCustomFunctions;
        _this.overflowCounter = 0;
        _this.OVERFLOW_LIMIT = 1000;
        _this.variablesUsed = [];
        for (var i = 0; i < 26; i++) {
            _this.variablesUsed.push(false);
        }
        _this._calculatedValue = "null";
        return _this;
    }
    Template.prototype.count = function () {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw "Infinite loop error";
        }
    };
    Object.defineProperty(Template.prototype, "calculatedValue", {
        //called by replacer, forcecalculate, 
        //evaluateVariable, getSolutionText, 
        get: function () {
            //eval result is in JSON form
            if (this._calculatedValue == "null") {
                var expr = toExpressionTree(this._text, 0);
                if (expr.eval == undefined) {
                    throw new Error("parse error");
                }
                var result = expr.eval(this);
                //error may generate null result
                if (result == null) {
                    this._calculatedValue = "null";
                    return "";
                }
                this._calculatedValue = result;
            }
            return this._calculatedValue;
        },
        enumerable: true,
        configurable: true
    });
    Template.prototype.removeExtraSigFigs = function (number) {
        var ret = (parseFloat(number).toPrecision(12));
        return parseFloat(ret);
    };
    Template.prototype.isCorrect = function (value) {
        //turn value into JSON
        if (this.calculatedValue != null) {
            if (isNumeric(this.calculatedValue)) {
                var n = Number(this.calculatedValue);
                return isNumeric(value) &&
                    Math.abs(value - n) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER * n);
            }
            return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
        }
        return false;
    };
    return Template;
}(questionTemplate));
//# sourceMappingURL=template.js.map