    var alphaIndex = function(str) { //lowercase only!!!
        if (isLowerAlpha(str)) { return str.charCodeAt(0) - 97; }
        if (isUpperAlpha(str)) { return str.charCodeAt(0) - 65; }
        throw "function alphaindex called on non alphanumeric string";
    };

    var isAlpha = function(str) {
        var code = str.charCodeAt(0);
        return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    };

    var isLowerAlpha = function(str) {
        var code = str.charCodeAt(0);
        return (code >= 97 && code <= 122);
    };

    var isUpperAlpha = function(str) {
        var code = str.charCodeAt(0);
        return (code >= 65 && code <= 90);
    };

    var isNumeric = function(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }


    var getDigits = function(n) {
        if (n < 10) {
            return [n];
        }
        return getDigits(Math.floor(n/10)).concat([n%10])
    }

    var HCF = function(a,b) {
        if (a <= 0 || b <= 0) {
            return 0;
        }
        if (a < b) {
            return HCF(b,a);
        }
        if (a%b == 0) {
            return b;
        }
        return HCF(b, a%b);
    }

    var hcfMulti = function(args) {
        var ret = args.splice(-1);
        while (args.length > 0) {
            var arg = args.splice(-1);
            ret = HCF(ret,arg);
        }
        return ret;
    }

    var lcm = function(args) {
        var ret = args.splice(-1);
        while (args.length > 0) {
            var arg = args.splice(-1);
            ret = ret *  arg / HCF(ret,arg);
        }
        return ret;
    }
    
    var factorial = function(n) {
        if (n < 2) {
            return 1;
        }
        return n * factorial(n - 1);
    };

    var binomial = function(x,N,p) {
        return factorial(N)/factorial(N-x)/factorial(x)*Math.pow(p,x)*Math.pow(1-p,N-x);
    }

    var roundToSF = function(n,d) {
        if (n==0) {return n};
        var biggestTen = Math.floor(Math.log(Math.abs(n))/Math.LN10)+1;
        return Math.round(n*Math.pow(10,d-biggestTen))/Math.pow(10,d-biggestTen);
    } 

function strip(number) {
    return parseFloat(number.toPrecision(12));
}

    var calculatedJSONtoViewable = function(ret) {
        ret = JSON.parse(ret);
        if (typeof(ret) == "string") {return helpers.stripQuotes(ret);}
        if (typeof(ret) == "number") { //round it a bit to prevent 54.9999999999
            if (ret%1 == 0) {
                return ret.toString();
            }
            else {
                ret = strip(ret);
                return ret.toString();
            }
        }
        if (ret)  { return ret.toString(); }
    }

    //takes in string which may not be strict JSON e.g. missing quotes
    var safeStringify = function(str) {
        let ret = undefined;
        try {
            let obj = JSON.parse(str);
            ret = JSON.stringify(obj);
        }
        catch (e) { //not in JSON so it needs quotes
            ret = `"${str}"`;
        }
        return ret;
    }

    var JSONtoEval = function(str) {
        let obj = JSON.parse(str);
        if (typeof(obj) == "string") {
            return str;
        }
        if (obj === true) {return "true"};
        if (obj === false) {return "false"};
        return str;
        //.toString() causes problems with arrays [2] -> "2"
    }

function SimpleExpression(s, i, commaIsTerminator) { //i must be char after first bracket

    ///EVAL
    this.eval = function(injector) {
        injector.count();
        if (this.children.length == 1 && typeof(this.children[0]) != "string" ) {
            return this.children[0].eval(injector);
        }

        let buffer = ""; 
        for (let i = 0, expr; expr = this.children[i]; i++) {
            if (typeof(expr) == "string") {
                buffer += this.replaceVariables(expr,injector);
            }
            else {
                buffer += JSONtoEval(expr.eval(injector));
            }
        };

        if (helpers.IsNullOrWhiteSpace(buffer)) {
            return "";
        }
        
        //replace -- with +
        buffer = helpers.replaceAll(buffer," ","");
        buffer = helpers.replaceAll(buffer,"\t","");
        //if (buffer[0] == '"') {return buffer;}
        
        buffer = helpers.replaceAll(buffer,"--","+");

        /*** THE ONLY EVAL ***/

        var evaluated =  eval(buffer);
        return JSON.stringify(evaluated);                    

    }

    //REPLACE VARIABLES
    this.replaceVariables = function(s, injector) {
        let buffer = "";
        for (let i = 0; i < s.length; i++) {
            if (isLowerAlpha(s[i]) && 
                (s.length == 1 || s[i].toLowerCase() != "e" || i == 0 || !isNumeric(s[i - 1]))
                ) {//allow abcdfgh OR e if previous char was NOT numeric i.e. not 5e)
                    let index = alphaIndex(s[i]);
                    if (index < injector.allTemplateComments.length) {
                        injector.variablesUsed[index] = true;
                        let val = injector.allTemplateComments[index].calculatedValue; 
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
                        throw("variable not yet defined");
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


        //PARSES THE COMMENT
        this.children = [];

        let buffer = "";
        while (i < s.length && s[i] != ")" 
            && s[i] != "]"
            && (commaIsTerminator != true || s[i] != ",")
            && (i+2 >= s.length || s[i+1] != "/" || s[i+2] != "/"))
        {
            if (s[i] == '(') {
                if (buffer.length > 0) {this.children.push(buffer);}
                buffer = "";
                let expr = new SimpleExpression(s, i+1);
                this.children.push(expr);
                i = expr.i;
            }
            else if (s[i] == '[') {
                if (buffer.length > 0) {this.children.push(buffer);}
                buffer = "";
                let expr = new ArrayExpression(s, i+1);
                this.children.push(expr);
                i = expr.i;
            }
            else if (i + 1 < s.length && s.substr(i, 2) == "..") {
                if (buffer.length > 0) {this.children.push(buffer);}
                return new RangeExpression(this, s, i);
            }
            else if (s[i] == ",") {
                if (buffer.length > 0) {this.children.push(buffer);}
                return new ListExpression(this, s, i);
            }
            else  if (s[i] == '"') {
                if (buffer.length > 0) {this.children.push(buffer);}
                buffer = "";
                let expr = new QuoteExpression(s, i);
                this.children.push(expr);
                i = expr.i;
            }
            else if (i + 1 < s.length && isAlpha(s[i]) && isAlpha(s[i+1])) {
                if (buffer.length > 0) {this.children.push(buffer);}
                buffer = "";
                let expr = new FunctionExpression(s, i);
                this.children.push(expr);
                i = expr.i;
            }
            else {
                buffer += s[i];
            }
            i++;
        }
        if (buffer.length > 0) {
            this.children.push(buffer);
        }
        //always end on the last bracket, since i gets incremented afterwards

        this.i = i;
}

function QuoteExpression(s,i) {
        i++; //skip first quote

        this.s  = "";
        while (i < s.length && s[i] != '"') {
            this.s += s[i];
            i++;
        }
        this.i = i;
    
    this.eval = function(injector) {
        injector.count();
        return `"${this.s}"`;
    }
}

function RangeExpression(firstBuffer, s, i) {
        this.minExpr = firstBuffer;
        this.maxExpr = new SimpleExpression(s, i+2);
        this.i = this.maxExpr.i;

    ///EVAL
    //always returns number
    this.eval = function(injector) {
        injector.count();
        let decimalmin = Number(this.minExpr.eval(injector));
        let decimalmax = Number(this.maxExpr.eval(injector));
        
        let min = Math.ceil(decimalmin);
        let max = Math.floor(decimalmax);
        if (min > max) {
            let tempSwapMinandMax = min;
            min = max;
            max = tempSwapMinandMax;
        }

        let temp = min == max ? min : min + injector.random.next(max - min + 1);
        return JSON.stringify(temp);
    }
}


function ListExpression(firstBuffer, s, i) {
        this.options = [];
        if (firstBuffer != null) {
            this.options.push(firstBuffer);
        }

        while (i < s.length && s[i] != ')')
        {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {i++;}
                let expr = new SimpleExpression(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw "bad list";
            }
        }
        this.i = i;

    ///EVAL
    this.eval = function(injector) {
        injector.count();
        let randomIndex = injector.indexForListEvaluation % this.options.length;
        let evaluated = this.options[randomIndex].eval(injector);
        return evaluated; //already eval'd
    }
}

function ArrayExpression(s, i) {
        this.options = [];

        while (i < s.length && s[i] != ']')
        {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {i++;}
                let expr = new SimpleExpression(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw "bad array";
            }
        }
        this.i = i;

    ///EVAL
    this.eval = function(injector) {
        injector.count();
        let evaluated = "["+this.options.map(o => o.eval(injector)).join()+"]";
        return evaluated;
    }
}


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
function FunctionExpression(s, i) {
        this.functionName = "";
        this.functionNamePreserveCase = "";
        while (i < s.length && 
            (isAlpha(s[i]) || isNumeric(s[i]))
            ) {
            this.functionName += s[i].toLowerCase();
            this.functionNamePreserveCase += s[i];
            i++;
        }
        
        if (s[i] != "(") {
            this.i = i - 1; //includes final bracket
            if (this.functionName == "true") {
                this.eval = function(injector) { return true; }
             }
            else if (this.functionName == "false") { 
                this.eval = function(injector) { return false; }
            }
            else {
                throw ("string without following bracket");
            }
        }
        else {

            this.list = new ListExpression(null,s,i+1);
            this.i = this.list.i; //skips final bracket

        ///EVAL
        this.eval = function(injector) {
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
            let evaluatedParameters = this.list.options.map(
                    function(o) {
                        var f = o.eval(injector);
                        //parameters are in JSON
                        return JSON.parse(f); 
                    }
                );


            if (this.functionName == "exponent") {
                let asExponent = evaluatedParameters[0].toExponential();
                let Eindex = asExponent.indexOf('e');
                return JSON.stringify(asExponent.substr(Eindex + 1));
            }

            if (this.functionName == "mantissa") {
                let asExponent = evaluatedParameters[0].toExponential();
                let Eindex = asExponent.indexOf('e');
                return JSON.stringify(asExponent.substr(0,Eindex));
            }

            //RETURNS BOOLEAN
            if (this.functionName == "includes") {
                var ret =  evaluatedParameters[0].toString().includes(evaluatedParameters[1]);
                return JSON.stringify(ret);
            }

            if (this.functionName == "maxlength") {

                //if string
                if (evaluatedParameters[0][0] == '"') {
                    return `"${evaluatedParameters[0].substr(1, evaluatedParameters[1])}"`;
                } 
                let ret = evaluatedParameters[0].toString().substr(0, evaluatedParameters[1]);
                return JSON.stringify(ret)
            }
            
            //RETURNS STRING
            if (this.functionName == "padleftzeroes") {
                let ret = evaluatedParameters[0].toString().padStart(evaluatedParameters[1], '0');
                return JSON.stringify(ret)                
            }
            
            //RETURNS STRING
            if (this.functionName == "padrightzeroes") {
                let str = evaluatedParameters[0].toString();
                if (!str.includes('.'))
                    str += '.';
                let ret = str.padEnd(evaluatedParameters[1], '0');
                return JSON.stringify(ret);
            }

            if (this.functionName == "getdigit") {
                let n = evaluatedParameters[0];
                let ret = getDigits(n)[evaluatedParameters[1]-1];
                return JSON.stringify(ret);
            }

            if (this.functionName == "dayname") {
                let year = evaluatedParameters[0];
                let month = evaluatedParameters[1];
                let date = evaluatedParameters[2];
                let today = new Date(year,month-1,date);
                let ret = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today.getDay()];
                return JSON.stringify(ret);
            }

            if (this.functionName == "dayofyear") {
                let year = evaluatedParameters[0];
                let month = evaluatedParameters[1];
                let date = evaluatedParameters[2];
                let firstOfYear = new Date(year,0,1);
                let today = new Date(year,month-1,date);
                let ret = Math.round((today.valueOf() - firstOfYear.valueOf())/8.64e7+1);
                return JSON.stringify(ret);
            }

            if (this.functionName == "abs") {
                let ret = Math.abs(evaluatedParameters[0]);
                return JSON.stringify(ret);
            }

            if (this.functionName == "mean") {
                let sum = evaluatedParameters.reduce(function(acc, val) { return acc + val; });
                let ret =  sum/evaluatedParameters.length;
                return JSON.stringify(ret);
              }

            if (this.functionName == "median") {
                evaluatedParameters.sort();
                let l = evaluatedParameters.length;
                let ret = null;
                if (l%2 == 0) {
                    ret = 0.5*(evaluatedParameters[l/2-1] + evaluatedParameters[l/2]);
                }
                else {
                    ret = evaluatedParameters[(l-1)/2];
                }
                return JSON.stringify(ret);
            }


            if (this.functionName == "lowerquartile") {
                evaluatedParameters.sort();
                let l = evaluatedParameters.length;
                let ret = null;
                if (l%4 == 0) {
                    ret = 0.5*(evaluatedParameters[l/4-1] + evaluatedParameters[l/4]);
                }
                else {
                    ret = evaluatedParameters[Math.floor(l/4)];
                }
                return JSON.stringify(ret);
            }

            if (this.functionName == "upperquartile") {
                evaluatedParameters.sort();
                let l = evaluatedParameters.length;
                let ret = "";
                if (l%4 == 0) {
                    ret = 0.5*(evaluatedParameters[3*l/4-1] + evaluatedParameters[3*l/4]);
                }
                else {
                    ret = evaluatedParameters[Math.floor(3*l/4)];
                }
                return JSON.stringify(ret);
            }

            if (this.functionName == "mode") {
                let freqs = {};
                for (n of evaluatedParameters) {
                  if (n in freqs) {
                    freqs[n] += 1
                  }
                  else {
                    freqs[n] = 1
                  }
                }
                let bestF = 0;
                let best = -1;
                let ret = null;
                for (var f in freqs) {
                  if (freqs[f] > bestF) {
                    bestF = freqs[f];
                    ret  = f;
                  }
                }
                return JSON.stringify(ret);
            }

            if (this.functionName == "max") {
                let best = evaluatedParameters[0];
                for (var i = 1; i < evaluatedParameters.length; i++) {
                  if (evaluatedParameters[i] > best) {
                    best = evaluatedParameters[i]
                  }
                }
                return JSON.stringify(best);
            }

            if (this.functionName == "min") {
                let best = evaluatedParameters[0];
                for (var i = 1; i < evaluatedParameters.length; i++) {
                  if (evaluatedParameters[i] < best) {
                    best = evaluatedParameters[i]
                  }
                }
                return JSON.stringify(best);
            }

            if (this.functionName == "hcf") {
                let ret = hcfMulti(evaluatedParameters);
                return JSON.stringify(ret);
            }

            if (this.functionName == "coprime") {
                let denom = evaluatedParameters[0];
                if (denom < 2) {
                    return new StringInt("0", i);
                }
                let guess = injector.random.next(denom-1) + 1;
                while (HCF(denom, guess) > 1) {
                    guess = injector.random.next(denom-1) + 1;
                }
                return JSON.stringify(guess);
            }

            if (this.functionName == "roundtodp") {
                let mult = Math.pow(10,evaluatedParameters[1]);
                let result = Math.round(evaluatedParameters[0]*mult)/mult;
                return JSON.stringify(result);
            }

            if (this.functionName == "roundtosf") {
                var n = evaluatedParameters[0];
                var d = evaluatedParameters[1];
                ret = roundToSF(n,d);
                return JSON.stringify(ret);
            }

            if (this.functionName == "factorial") {
                let ret = factorial(evaluatedParameters[0]);
                return JSON.stringify(ret);
            }

            if (this.functionName == "toexponential") {
                let ret = evaluatedParameters[0];
                return JSON.stringify(ret.toExponential());
            }

            if (this.functionName == "includesign") {
                let sign = evaluatedParameters[0] < 0 ? "-" : "+";
                let ret =  `"${sign} ${Math.abs(evaluatedParameters[0]).toString()}"`;
                return JSON.stringify(ret);
            }

            if (this.functionName == "includeoppsign") {
                let sign = evaluatedParameters[0] < 0 ? "+ " : "- ";
                let ret =`"${sign} ${Math.abs(evaluatedParameters[0]).toString()}"`;
                return JSON.stringify(ret);
            }

            if (this.functionName == "sind") {
                let ret = Math.sin(evaluatedParameters[0]/180*Math.PI);
                return JSON.stringify(ret);
            }

            if (this.functionName == "cosd") {
                let ret =Math.cos(evaluatedParameters[0]/180*Math.PI);
                return JSON.stringify(ret);
            }

            if (this.functionName == "tand") {
                let ret = Math.tan(evaluatedParameters[0]/180*Math.PI);
                return JSON.stringify(ret);
            }

            if (this.functionName == "asind") {
                let ret = (180*Math.asin(evaluatedParameters[0])/Math.PI);
                return JSON.stringify(ret);
            }

            if (this.functionName == "acosd") {
                let ret = (180*Math.acos(evaluatedParameters[0])/Math.PI);
                return JSON.stringify(ret);
            }

            if (this.functionName == "atand") {
                let ret = (180*Math.atan(evaluatedParameters[0])/Math.PI);
                return JSON.stringify(ret);
            }

            if (this.functionName == "choose") {
                var index = evaluatedParameters[0];
                let ret = evaluatedParameters[index+1];
                return JSON.stringify(ret);
            }

            if (this.functionName == "countif") {
                var target = evaluatedParameters[0];
                let ret = evaluatedParameters.slice(1).filter(e => e == target).length;
                return JSON.stringify(ret);
            }

            if (this.functionName == "large") {
                var l = evaluatedParameters.length;
                var index = l - evaluatedParameters[l-1] - 1;
                let ret = evaluatedParameters.slice(0,l-1).sort()[index];
                return JSON.stringify(ret);
            }
            
            if (this.functionName == "normalcdf") {
                var X = evaluatedParameters[0];
                var T=1/(1+.2316419*Math.abs(X));
                var D=.3989423*Math.exp(-X*X/2);
                var Prob=D*T*(.3193815+T*(-.3565638+T*(1.781478+T*(-1.821256+T*1.330274))));
                if (X>0) {
                    Prob=1-Prob
                }
                return JSON.stringify(Prob);
            }

            if (this.functionName == "binomial") {
                let x = evaluatedParameters[0];
                let N = evaluatedParameters[1];
                let p = evaluatedParameters[2];

                let ret = binomial(x,N,p);
                return JSON.stringify(ret);
            }

            if (this.functionName == "binomialcdf") {
                let x = evaluatedParameters[0];
                let N = evaluatedParameters[1];
                let p = evaluatedParameters[2];
                
                let ret = 0;
                for (let i = 0; i <= x; i++) {
                    ret += binomial(i,N,p);
                }
                return JSON.stringify(ret);
            }


            if (this.functionName == "sgn") {
                let ret = 0;
                if (evaluatedParameters[0] < 0) { ret = -1; }
                if (evaluatedParameters[0] > 0) { ret = 1; }                return JSON.stringify(ret);
                return JSON.stringify(ret);
            }
            
            if (this.functionName == "lcm") {
                let ret = lcm(evaluatedParameters);
                return JSON.stringify(ret);
            }
            

            //CREATE CUSTOM FUNCTION
            if (this.functionName == "code") {
                //if text is entered
                let JSName = helpers.stripQuotes(evaluatedParameters[0]);
                injector.customFunctions[JSName] = null;
                let DEFAULTCODE = `function ${JSName}() {

        //your code goes here

    }`;
                if (injector.allSolutions) {
                    let thisSolution = injector.allSolutions.filter(s => s.template == injector);
                    if (thisSolution.length == 1) {
                        thisSolution[0].triggerCalculateFromLateFunction = false;
                        let code = thisSolution[0].field.elementValue;
                        //DEFAULT CODE EXCEPT FOR CONSOLE
                        if (code == "" && JSName != "console") { //first time
                            thisSolution[0].field.elementValue = DEFAULTCODE;
                        }
                        else { //user has entered code
                            if (code != DEFAULTCODE) {
                                injector.customFunctions[JSName] = new JSFunction(code, JSName);
                                

                                //code has been entered so this counts as answer
                                injector.allSolutions.filter(s => s.triggerCalculateFromLateFunction).forEach(function(s) 
                                {
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
                let JSName = helpers.stripQuotes(evaluatedParameters[0]);
                injector.customFunctions[JSName] = null;
                if (injector.allSolutions) {
                    let thisSolution = injector.allSolutions.filter(s => s.template == injector);
                    if (thisSolution.length == 1) {
                        thisSolution[0].triggerCalculateFromLateFunction = false;
                        if (thisSolution[0].field.elementValue) {
                            injector.customFunctions[JSName] = safeStringify(thisSolution[0].field.elementValue); //needs to be in JSON before going in to template

                            injector.allSolutions.filter(s => s.triggerCalculateFromLateFunction).forEach(function(s) 
                            {
                                s.template._calculatedValue = "null";
                                s.field.onResponse(); //includes score update
                            });
                        }
                    }
                }
                return "null";
            }
            
            if (injector.customFunctions[this.functionNamePreserveCase] === null) {
                throw (`custom function with name "${this.functionNamePreserveCase}" not defined`);
            }

            //try Math
            if (typeof(Math[this.functionName]) == "function") {
                let ret =  Math[this.functionName](evaluatedParameters[0],evaluatedParameters[1],evaluatedParameters[2]);
                return JSON.stringify(ret);
            }

            return "null";
        }
        }
    
}

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

        this.variablesUsed = Array(26).fill(false);
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

            let expr = new SimpleExpression(this._text, 0);
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
                return isNumeric(value) && 
                    Math.abs(value-this.calculatedValue) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*this.calculatedValue);
            }
            return safeStringify(value.toLowerCase()) == this.calculatedValue.toLowerCase();
        }
        return false;
    }

}
