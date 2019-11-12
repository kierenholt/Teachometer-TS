function alphaIndex(str) {
    if (isLowerAlpha(str)) {
        return str.charCodeAt(0) - 97;
    }
    if (isUpperAlpha(str)) {
        return str.charCodeAt(0) - 65;
    }
    throw "function alphaindex called on non alphanumeric string";
}
;
function isAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
;
function isLowerAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 97 && code <= 122);
}
;
function isUpperAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 65 && code <= 90);
}
;
function isNumeric(str) {
    return !isNaN(parseFloat(str)) && isFinite(str);
}
function getDigits(n) {
    if (n < 10) {
        return [n];
    }
    return getDigits(Math.floor(n / 10)).concat([n % 10]);
}
function HCF(a, b) {
    if (a <= 0 || b <= 0) {
        return 0;
    }
    if (a < b) {
        return HCF(b, a);
    }
    if (a % b == 0) {
        return b;
    }
    return HCF(b, a % b);
}
function hcfMulti(args) {
    var ret = args.splice(-1);
    while (args.length > 0) {
        var arg = args.splice(-1);
        ret = HCF(ret, arg);
    }
    return ret;
}
function lcm(args) {
    var ret = args.splice(-1);
    while (args.length > 0) {
        var arg = args.splice(-1);
        ret = ret * arg / HCF(ret, arg);
    }
    return ret;
}
function factorial(n) {
    if (n < 2) {
        return 1;
    }
    return n * factorial(n - 1);
}
;
function binomial(x, N, p) {
    return factorial(N) / factorial(N - x) / factorial(x) * Math.pow(p, x) * Math.pow(1 - p, N - x);
}
function roundToSF(n, d) {
    if (n == 0) {
        return n;
    }
    ;
    var biggestTen = Math.floor(Math.log(Math.abs(n)) / Math.LN10) + 1;
    return Math.round(n * Math.pow(10, d - biggestTen)) / Math.pow(10, d - biggestTen);
}
function calculatedJSONtoViewable(ret) {
    ret = JSON.parse(ret);
    if (typeof (ret) == "string") {
        return helpers.stripQuotes(ret);
    }
    if (typeof (ret) == "number") { //round it a bit to prevent 54.9999999999
        if (ret % 1 == 0) {
            return ret.toString();
        }
        else {
            ret = parseFloat(ret.toPrecision(12));
            return ret.toString();
        }
    }
    if (ret) {
        return ret.toString();
    }
}
//takes in string which may not be strict JSON e.g. missing quotes
function safeStringify(str) {
    var ret = undefined;
    try {
        var obj = JSON.parse(str);
        ret = JSON.stringify(obj);
    }
    catch (e) { //not in JSON so it needs quotes
        ret = "\"" + str + "\"";
    }
    return ret;
}
function JSONtoEval(str) {
    var obj = JSON.parse(str);
    if (typeof (obj) == "string") {
        return str;
    }
    if (obj === true) {
        return "true";
    }
    ;
    if (obj === false) {
        return "false";
    }
    ;
    return str;
    //.toString() causes problems with arrays [2] -> "2"
}
//REPLACE VARIABLES
function replaceVariables(s, injector) {
    var buffer = "";
    for (var i = 0; i < s.length; i++) {
        if (isLowerAlpha(s[i]) &&
            (s.length == 1 || s[i].toLowerCase() != "e" || i == 0 || !isNumeric(s[i - 1]))) { //allow abcdfgh OR e if previous char was NOT numeric i.e. not 5e)
            var index = alphaIndex(s[i]);
            if (index < injector.allTemplateComments.length) {
                injector.variablesUsed[index] = true;
                var val = injector.allTemplateComments[index].calculatedValue;
                buffer += JSONtoEval(val);
            }
            else {
                throw "variable does not exist";
            }
        }
        //CHECK FOR CUSTOM VARIABLES
        else if (s[i] in injector.customFunctions) {
            if (injector.customFunctions[s[i]]) {
                buffer += JSONtoEval(injector.customFunctions[s[i]]);
            }
            else {
                throw ("variable not yet defined");
            }
        }
        else if (s[i] == 'π') {
            buffer += "3.14159265359";
        }
        else {
            buffer += s[i];
        }
    }
    return buffer;
}
function toExpressionTree(s, i, commaIsTerminator) {
    //PARSES s (the comment)
    var children = [];
    var buffer = "";
    while (i < s.length && s[i] != ")"
        && s[i] != "]"
        && (commaIsTerminator != true || s[i] != ",")
        && (i + 2 >= s.length || s[i + 1] != "/" || s[i + 2] != "/")) {
        if (s[i] == '(') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = toExpressionTree(s, i + 1);
            children.push(expr);
            i = expr.i;
        }
        else if (s[i] == '[') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = new ArrayExpression(s, i + 1);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && s.substr(i, 2) == "..") {
            if (buffer.length + children.length == 0) {
                throw new Error("Range expression missing something before ..");
            }
            children.push(buffer);
            return new RangeExpression(new SimpleExpression(children, i), s, i);
        }
        else if (s[i] == ",") {
            if (buffer.length + children.length == 0) {
                throw new Error("List expression missing something before ,");
            }
            children.push(buffer);
            return new ListExpression(new SimpleExpression(children, i), s, i);
        }
        else if (s[i] == '"') {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = new QuoteExpression(s, i);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && isAlpha(s[i]) && isAlpha(s[i + 1])) {
            if (buffer.length > 0) {
                children.push(buffer);
            }
            buffer = "";
            var expr = new FunctionExpression(s, i);
            children.push(expr);
            i = expr.i;
        }
        else {
            buffer += s[i];
        }
        i++;
    }
    //push last string into children
    if (buffer.length > 0) {
        children.push(buffer);
    }
    //always end on the last bracket, since i gets incremented afterwards
    return new SimpleExpression(children, i);
}
//brackets could contain a single expression or a range,list etc.
var SimpleExpression = /** @class */ (function () {
    function SimpleExpression(children, i) {
        this.children = children;
        this.i = i;
    }
    ///EVAL
    SimpleExpression.prototype.eval = function (injector) {
        injector.count();
        if (this.children.length == 1 && typeof (this.children[0]) != "string") {
            return this.children[0].eval(injector);
        }
        var buffer = "";
        for (var i = 0, expr = void 0; expr = this.children[i]; i++) {
            if (typeof (expr) == "string") {
                buffer += replaceVariables(expr, injector);
            }
            else {
                buffer += JSONtoEval(expr.eval(injector));
            }
        }
        ;
        if (helpers.IsNullOrWhiteSpace(buffer)) {
            return "";
        }
        //replace -- with +
        buffer = helpers.replaceAll(buffer, " ", "");
        buffer = helpers.replaceAll(buffer, "\t", "");
        //if (buffer[0] == '"') {return buffer;}
        buffer = helpers.replaceAll(buffer, "--", "+");
        /*** THE ONLY EVAL ***/
        var evaluated = eval(buffer);
        return JSON.stringify(evaluated);
    };
    return SimpleExpression;
}());
var QuoteExpression = /** @class */ (function () {
    function QuoteExpression(s, i) {
        i++; //skip first quote
        this.s = "";
        while (i < s.length && s[i] != '"') {
            this.s += s[i];
            i++;
        }
        this.i = i;
    }
    QuoteExpression.prototype.eval = function (injector) {
        injector.count();
        return "\"" + this.s + "\"";
    };
    return QuoteExpression;
}());
var RangeExpression = /** @class */ (function () {
    function RangeExpression(firstBuffer, s, i) {
        this.minExpr = firstBuffer;
        this.maxExpr = toExpressionTree(s, i + 2);
        this.i = this.maxExpr.i;
    }
    ///EVAL
    //always returns number
    RangeExpression.prototype.eval = function (injector) {
        injector.count();
        var decimalmin = Number(this.minExpr.eval(injector));
        var decimalmax = Number(this.maxExpr.eval(injector));
        var min = Math.ceil(decimalmin);
        var max = Math.floor(decimalmax);
        if (min > max) {
            var tempSwapMinandMax = min;
            min = max;
            max = tempSwapMinandMax;
        }
        var temp = min == max ? min : min + injector.random.next(max - min + 1);
        return JSON.stringify(temp);
    };
    return RangeExpression;
}());
var ListExpression = /** @class */ (function () {
    function ListExpression(firstBuffer, s, i) {
        this.options = [];
        if (firstBuffer != null) {
            this.options.push(firstBuffer);
        }
        while (i < s.length && s[i] != ')') {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {
                    i++;
                }
                var expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new Error("bad list");
            }
        }
        this.i = i;
    }
    ///EVAL
    ListExpression.prototype.eval = function (injector) {
        injector.count();
        var randomIndex = injector.indexForListEvaluation % this.options.length;
        var evaluated = this.options[randomIndex].eval(injector);
        return evaluated; //already eval'd
    };
    return ListExpression;
}());
var ArrayExpression = /** @class */ (function () {
    function ArrayExpression(s, i) {
        this.options = [];
        while (i < s.length && s[i] != ']') {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {
                    i++;
                }
                var expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw "bad array";
            }
        }
        this.i = i;
    }
    ///EVAL
    ArrayExpression.prototype.eval = function (injector) {
        injector.count();
        var evaluated = "[" + this.options.map(function (o) { return o.eval(injector); }).join() + "]";
        return evaluated;
    };
    return ArrayExpression;
}());
/* FUNCTION NAMES
        "maxlength",
        "padleftzeroes",
        "padrightzeroes",
        "includes",
        "abs",
        "mean",
        "median",
        "mode",
        "max",
        "min",
        "if",
        "exponent",
        "mantissa",
        "HCF",
        "coprime",
        "floor (math)",
        "ceil (math)",
        "roundtodp",
        "pow (math)",
        "includesign",
        "includeoppsign",
        "sind",
        "cosd",
        "tand",
        "choose",
        "toexponential",
        "normalcdf",
        "code",
        "variable"

 */
//returns all types of variables
var FunctionExpression = /** @class */ (function () {
    function FunctionExpression(s, i) {
        this.functionName = "";
        this.functionNamePreserveCase = "";
        while (i < s.length &&
            (isAlpha(s[i]) || isNumeric(s[i]))) {
            this.functionName += s[i].toLowerCase();
            this.functionNamePreserveCase += s[i];
            i++;
        }
        if (s[i] != "(") {
            this.i = i - 1; //includes final bracket
            if (this.functionName == "true") {
                this.eval = function (injector) { return true; };
            }
            else if (this.functionName == "false") {
                this.eval = function (injector) { return false; };
            }
            else {
                throw ("string without following bracket");
            }
        }
        else {
            this.list = new ListExpression(null, s, i + 1);
            this.i = this.list.i; //skips final bracket
        }
    }
    ///EVAL
    FunctionExpression.prototype.eval = function (injector) {
        injector.count();
        //if must be called before all options are evaluated
        if (this.functionName == "if") {
            if (this.list.options[0].eval(injector) == "true") {
                return this.list.options[1].eval(injector);
            }
            else {
                return this.list.options[2].eval(injector);
            }
        }
        //call evaluate on each option then cast to numbers
        var evaluatedParameters = this.list.options.map(function (o) {
            var f = o.eval(injector);
            //parameters are in JSON
            return JSON.parse(f);
        });
        if (this.functionName == "exponent") {
            var asExponent = evaluatedParameters[0].toExponential();
            var Eindex = asExponent.indexOf('e');
            return JSON.stringify(asExponent.substr(Eindex + 1));
        }
        if (this.functionName == "mantissa") {
            var asExponent = evaluatedParameters[0].toExponential();
            var Eindex = asExponent.indexOf('e');
            return JSON.stringify(asExponent.substr(0, Eindex));
        }
        //RETURNS BOOLEAN
        if (this.functionName == "includes") {
            var ret = evaluatedParameters[0].toString().includes(evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        if (this.functionName == "maxlength") {
            //if string
            if (evaluatedParameters[0][0] == '"') {
                return "\"" + evaluatedParameters[0].substr(1, evaluatedParameters[1]) + "\"";
            }
            var ret_1 = evaluatedParameters[0].toString().substr(0, evaluatedParameters[1]);
            return JSON.stringify(ret_1);
        }
        //RETURNS STRING
        if (this.functionName == "padleftzeroes") {
            var ret_2 = evaluatedParameters[0].toString().padStart(evaluatedParameters[1], '0');
            return JSON.stringify(ret_2);
        }
        //RETURNS STRING
        if (this.functionName == "padrightzeroes") {
            var str = evaluatedParameters[0].toString();
            if (!str.includes('.'))
                str += '.';
            var ret_3 = str.padEnd(evaluatedParameters[1], '0');
            return JSON.stringify(ret_3);
        }
        if (this.functionName == "getdigit") {
            var n_1 = evaluatedParameters[0];
            var ret_4 = getDigits(n_1)[evaluatedParameters[1] - 1];
            return JSON.stringify(ret_4);
        }
        if (this.functionName == "dayname") {
            var year = evaluatedParameters[0];
            var month = evaluatedParameters[1];
            var date = evaluatedParameters[2];
            var today = new Date(year, month - 1, date);
            var ret_5 = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];
            return JSON.stringify(ret_5);
        }
        if (this.functionName == "dayofyear") {
            var year = evaluatedParameters[0];
            var month = evaluatedParameters[1];
            var date = evaluatedParameters[2];
            var firstOfYear = new Date(year, 0, 1);
            var today = new Date(year, month - 1, date);
            var ret_6 = Math.round((today.valueOf() - firstOfYear.valueOf()) / 8.64e7 + 1);
            return JSON.stringify(ret_6);
        }
        if (this.functionName == "abs") {
            var ret_7 = Math.abs(evaluatedParameters[0]);
            return JSON.stringify(ret_7);
        }
        if (this.functionName == "mean") {
            var sum = evaluatedParameters.reduce(function (acc, val) { return acc + val; });
            var ret_8 = sum / evaluatedParameters.length;
            return JSON.stringify(ret_8);
        }
        if (this.functionName == "median") {
            evaluatedParameters.sort();
            var l_1 = evaluatedParameters.length;
            var ret_9 = null;
            if (l_1 % 2 == 0) {
                ret_9 = 0.5 * (evaluatedParameters[l_1 / 2 - 1] + evaluatedParameters[l_1 / 2]);
            }
            else {
                ret_9 = evaluatedParameters[(l_1 - 1) / 2];
            }
            return JSON.stringify(ret_9);
        }
        if (this.functionName == "lowerquartile") {
            evaluatedParameters.sort();
            var l_2 = evaluatedParameters.length;
            var ret_10 = null;
            if (l_2 % 4 == 0) {
                ret_10 = 0.5 * (evaluatedParameters[l_2 / 4 - 1] + evaluatedParameters[l_2 / 4]);
            }
            else {
                ret_10 = evaluatedParameters[Math.floor(l_2 / 4)];
            }
            return JSON.stringify(ret_10);
        }
        if (this.functionName == "upperquartile") {
            evaluatedParameters.sort();
            var l_3 = evaluatedParameters.length;
            var ret_11 = null;
            if (l_3 % 4 == 0) {
                ret_11 = 0.5 * (evaluatedParameters[3 * l_3 / 4 - 1] + evaluatedParameters[3 * l_3 / 4]);
            }
            else {
                ret_11 = evaluatedParameters[Math.floor(3 * l_3 / 4)];
            }
            return JSON.stringify(ret_11);
        }
        if (this.functionName == "mode") {
            var freqs = {};
            for (var _i = 0, evaluatedParameters_1 = evaluatedParameters; _i < evaluatedParameters_1.length; _i++) {
                n = evaluatedParameters_1[_i];
                if (n in freqs) {
                    freqs[n] += 1;
                }
                else {
                    freqs[n] = 1;
                }
            }
            var bestF = 0;
            var best = -1;
            var ret_12 = null;
            for (var f in freqs) {
                if (freqs[f] > bestF) {
                    bestF = freqs[f];
                    ret_12 = f;
                }
            }
            return JSON.stringify(ret_12);
        }
        if (this.functionName == "max") {
            var best = evaluatedParameters[0];
            for (var i = 1; i < evaluatedParameters.length; i++) {
                if (evaluatedParameters[i] > best) {
                    best = evaluatedParameters[i];
                }
            }
            return JSON.stringify(best);
        }
        if (this.functionName == "min") {
            var best = evaluatedParameters[0];
            for (var i = 1; i < evaluatedParameters.length; i++) {
                if (evaluatedParameters[i] < best) {
                    best = evaluatedParameters[i];
                }
            }
            return JSON.stringify(best);
        }
        if (this.functionName == "hcf") {
            var ret_13 = hcfMulti(evaluatedParameters);
            return JSON.stringify(ret_13);
        }
        if (this.functionName == "coprime") {
            var denom = evaluatedParameters[0];
            if (denom < 2) {
                throw new Error("no smaller coprime number exists for " + denom);
            }
            var guess = injector.random.next(denom - 1) + 1;
            while (HCF(denom, guess) > 1) {
                guess = injector.random.next(denom - 1) + 1;
            }
            return JSON.stringify(guess);
        }
        if (this.functionName == "roundtodp") {
            var mult = Math.pow(10, evaluatedParameters[1]);
            var result = Math.round(evaluatedParameters[0] * mult) / mult;
            return JSON.stringify(result);
        }
        if (this.functionName == "roundtosf") {
            var n = evaluatedParameters[0];
            var d = evaluatedParameters[1];
            ret = roundToSF(n, d);
            return JSON.stringify(ret);
        }
        if (this.functionName == "factorial") {
            var ret_14 = factorial(evaluatedParameters[0]);
            return JSON.stringify(ret_14);
        }
        if (this.functionName == "toexponential") {
            var ret_15 = evaluatedParameters[0];
            return JSON.stringify(ret_15.toExponential());
        }
        if (this.functionName == "includesign") {
            var sign = evaluatedParameters[0] < 0 ? "-" : "+";
            var ret_16 = "\"" + sign + " " + Math.abs(evaluatedParameters[0]).toString() + "\"";
            return JSON.stringify(ret_16);
        }
        if (this.functionName == "includeoppsign") {
            var sign = evaluatedParameters[0] < 0 ? "+ " : "- ";
            var ret_17 = "\"" + sign + " " + Math.abs(evaluatedParameters[0]).toString() + "\"";
            return JSON.stringify(ret_17);
        }
        if (this.functionName == "sind") {
            var ret_18 = Math.sin(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret_18);
        }
        if (this.functionName == "cosd") {
            var ret_19 = Math.cos(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret_19);
        }
        if (this.functionName == "tand") {
            var ret_20 = Math.tan(evaluatedParameters[0] / 180 * Math.PI);
            return JSON.stringify(ret_20);
        }
        if (this.functionName == "asind") {
            var ret_21 = (180 * Math.asin(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret_21);
        }
        if (this.functionName == "acosd") {
            var ret_22 = (180 * Math.acos(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret_22);
        }
        if (this.functionName == "atand") {
            var ret_23 = (180 * Math.atan(evaluatedParameters[0]) / Math.PI);
            return JSON.stringify(ret_23);
        }
        if (this.functionName == "choose") {
            var index = evaluatedParameters[0];
            var ret_24 = evaluatedParameters[index + 1];
            return JSON.stringify(ret_24);
        }
        if (this.functionName == "countif") {
            var target = evaluatedParameters[0];
            var ret_25 = evaluatedParameters.slice(1).filter(function (e) { return e == target; }).length;
            return JSON.stringify(ret_25);
        }
        if (this.functionName == "large") {
            var l = evaluatedParameters.length;
            var index2 = l - evaluatedParameters[l - 1] - 1;
            var ret_26 = evaluatedParameters.slice(0, l - 1).sort()[index2];
            return JSON.stringify(ret_26);
        }
        if (this.functionName == "normalcdf") {
            var X = evaluatedParameters[0];
            var T = 1 / (1 + .2316419 * Math.abs(X));
            var D = .3989423 * Math.exp(-X * X / 2);
            var Prob = D * T * (.3193815 + T * (-.3565638 + T * (1.781478 + T * (-1.821256 + T * 1.330274))));
            if (X > 0) {
                Prob = 1 - Prob;
            }
            return JSON.stringify(Prob);
        }
        if (this.functionName == "binomial") {
            var x = evaluatedParameters[0];
            var N = evaluatedParameters[1];
            var p = evaluatedParameters[2];
            var ret_27 = binomial(x, N, p);
            return JSON.stringify(ret_27);
        }
        if (this.functionName == "binomialcdf") {
            var x = evaluatedParameters[0];
            var N = evaluatedParameters[1];
            var p = evaluatedParameters[2];
            var ret_28 = 0;
            for (var i_1 = 0; i_1 <= x; i_1++) {
                ret_28 += binomial(i_1, N, p);
            }
            return JSON.stringify(ret_28);
        }
        if (this.functionName == "sgn") {
            var ret_29 = 0;
            if (evaluatedParameters[0] < 0) {
                ret_29 = -1;
            }
            if (evaluatedParameters[0] > 0) {
                ret_29 = 1;
            }
            return JSON.stringify(ret_29);
            return JSON.stringify(ret_29);
        }
        if (this.functionName == "lcm") {
            var ret_30 = lcm(evaluatedParameters);
            return JSON.stringify(ret_30);
        }
        //CREATE CUSTOM FUNCTION
        if (this.functionName == "code") {
            //if text is entered
            var JSName = helpers.stripQuotes(evaluatedParameters[0]);
            injector.customFunctions[JSName] = null;
            var DEFAULTCODE = "function " + JSName + "() {\n\n    //your code goes here\n\n    }";
            if (injector.allSolutions) {
                var thisSolution = injector.allSolutions.filter(function (s) { return s.template == injector; });
                if (thisSolution.length == 1) {
                    thisSolution[0].triggerCalculateFromLateFunction = false;
                    var code = thisSolution[0].field.elementValue;
                    //DEFAULT CODE EXCEPT FOR CONSOLE
                    if (code == "" && JSName != "console") { //first time
                        thisSolution[0].field.elementValue = DEFAULTCODE;
                    }
                    else { //user has entered code
                        if (code != DEFAULTCODE) {
                            injector.customFunctions[JSName] = new JSFunction(code, JSName);
                            //code has been entered so this counts as answer
                            injector.allSolutions.filter(function (s) { return s.triggerCalculateFromLateFunction; }).forEach(function (s) {
                                s.template._calculatedValue = "null";
                                s.field.onResponse(); //includes score update
                            });
                        }
                    }
                }
            }
            return "null";
        }
        //CALL CUSTOM CODE FUNCTION 
        if (injector.customFunctions[this.functionNamePreserveCase] instanceof JSFunction) {
            return injector.customFunctions[this.functionNamePreserveCase].execute(evaluatedParameters); //already in JSON
        }
        //ASSIGN VALUE TO CUSTOM VARIABLE
        if (this.functionName == "variable") {
            var JSName = helpers.stripQuotes(evaluatedParameters[0]);
            injector.customFunctions[JSName] = null;
            if (injector.allSolutions == undefined) {
                throw new Error("allSolutions not found on template");
            }
            var thisSolution = injector.allSolutions.filter(function (s) { return s.template == injector; });
            if (thisSolution.length != 1) {
                throw new Error("number of mathcing solutions != 1");
            }
            thisSolution[0].triggerCalculateFromLateFunction = false;
            if (thisSolution[0].field.elementValue) {
                //store variable in template.customfunctions
                injector.customFunctions[JSName] = safeStringify(thisSolution[0].field.elementValue); //needs to be in JSON before going in to template
                //if the value is not null, then update any dependent calculatedvalues using
                injector.allSolutions.filter(function (s) { return s.triggerCalculateFromLateFunction; }).forEach(function (s) {
                    s.template._calculatedValue = "null";
                    s.field.onResponse(); //includes score update
                });
            }
            return "null";
        }
        if (injector.customFunctions[this.functionNamePreserveCase] === null) {
            throw ("custom function with name \"" + this.functionNamePreserveCase + "\" not defined");
        }
        //try Math
        if (typeof (Math[this.functionName]) == "function") {
            var ret_31 = Math[this.functionName](evaluatedParameters[0], evaluatedParameters[1], evaluatedParameters[2]);
            return JSON.stringify(ret_31);
        }
        return "null";
    };
    return FunctionExpression;
}());
//# sourceMappingURL=expression.js.map