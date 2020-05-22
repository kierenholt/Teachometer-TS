class ExpressionError extends Error {
    feedbackToUser: any;
    isCritical: any;
    constructor(message,paramFeedbackToUser,paramIsCritical) {
        super(message);
        this.feedbackToUser = paramFeedbackToUser;
        this.isCritical = paramIsCritical;
    }
} 


abstract class IExpression {
    _value: any;
    i: number;
    variablesUsed = {};
    constructor(i) {
        this.i = i;
        for (let j = 0; j < 26; j++) {
            this.variablesUsed[helpers.lowerCaseLetterFromIndex(j)] = false; 
        }
    }

    getValue(injector: ExpressionEngine) {
        if (this._value == undefined) {
            this._value = this.eval(injector);
        }
        return this._value;
    }

    abstract eval(injector: ExpressionEngine);


    //REPLACE VARIABLES
    replaceVariables(s, injector: ExpressionEngine) {
        let buffer = "";
        for (let i = 0; i < s.length; i++) {
            if (isAlpha(s[i]) &&
                (s.length == 1 || s[i].toLowerCase() != "e" || i == 0 || !helpers.isNumeric(s[i - 1]))
                )
                {//allow abcdfgh OR e if previous char was NOT numeric i.e. not 5e)
                    if (s[i] in injector.allVariablesAndFunctions) {
                        this.variablesUsed[s[i]] = true;
                        let val = injector.allVariablesAndFunctions[s[i]];
                        if (val instanceof IExpression) {
                            buffer += JSONtoEval(val.getValue(injector));
                        }
                        else if (typeof(val) == "string") {
                            buffer += JSONtoEval(val);
                        }
                        else if (val == undefined) {
                            throw new ExpressionError(`variable "${s[i]}" is undefined`,true,false);
                        }
                        else {
                            throw new ExpressionError(`variable "${s[i]}" not found`,true,true);
                        }
                    }
                    else {
                        throw new ExpressionError(`variable "${s[i]}" not found`,true,true);
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
}

//#region helpers

function alphaIndex(str) { //lowercase only!!!
    if (isLowerAlpha(str)) { return str.charCodeAt(0) - 97; }
    if (isUpperAlpha(str)) { return str.charCodeAt(0) - 65; }
    throw new Error("function alphaindex called on non alphanumeric string");
};

function isAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
};

function isLowerAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 97 && code <= 122);
};

function isUpperAlpha(str) {
    var code = str.charCodeAt(0);
    return (code >= 65 && code <= 90);
};

function getDigits(n) {
    if (n < 10) {
        return [n];
    }
    return getDigits(Math.floor(n/10)).concat([n%10])
}

function HCF(a,b) {
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

function hcfMulti(args) {
    var ret = args.splice(-1);
    while (args.length > 0) {
        var arg = args.splice(-1);
        ret = HCF(ret,arg);
    }
    return ret;
}

function lcm(args) {
    var ret = args.splice(-1);
    while (args.length > 0) {
        var arg = args.splice(-1);
        ret = ret *  arg / HCF(ret,arg);
    }
    return ret;
}

function factorial(n) {
    if (n < 2) {
        return 1;
    }
    return n * factorial(n - 1);
};

function binomial(x,N,p) {
    return factorial(N)/factorial(N-x)/factorial(x)*Math.pow(p,x)*Math.pow(1-p,N-x);
}

function roundToSF(n,d) {
    if (n==0) {return n};
    var biggestTen = Math.floor(Math.log(Math.abs(n))/Math.LN10)+1;
    return Math.round(n*Math.pow(10,d-biggestTen))/Math.pow(10,d-biggestTen);
} 

//formats JSON for solution text
function JSONtoViewable(ret): string {
    if (ret == undefined) { return "undefined"; }
    if (ret === "false") { return "false"; }
    if (ret === "true") { return "true"; }
    ret = JSON.parse(ret);
    if (typeof(ret) == "string") {return helpers.stripQuotes(ret);}
    if (typeof(ret) == "number") { //round it a bit to prevent 54.9999999999 etc.
        if (ret%1 == 0) {
            return ret.toString();
        }
        else {
            return helpers.removeCrazySigFigs(ret);
        }
    }
    if (ret)  { return ret.toString(); }
}

//used in iscorrect function to compare arrays etc.
function compareobjects(A,B) {
    if (A === undefined || B === undefined) {
      return A === undefined && B === undefined;
    }
    if (A instanceof Array || B instanceof Array) {
      if (A instanceof Array && B instanceof Array) {
        return (A.length == B.length) && A.every(function(e, i) {
          return compareobjects(e,B[i]);
        });
      }
      else {
        return false;
      }
    }
    return A == B;
  }


//formats calculated JSON for insertion into eval strings (buffer += etc,)
function JSONtoEval(str) {
    if (str == "" || str == undefined) {
        return "null";
    } //e.g. if a variable is bound to empty textbox, then empty string will be evalled  
    let obj = undefined;
    try {
        obj = JSON.parse(str);
    }
    catch (e) { 
        //within replaceVariables
        throw new ExpressionError("unable to parse JSON: " + str, true, false);
    }
    if (typeof(obj) == "string") {
        return str;
    }
    if (obj === true) {return "true"};
    if (obj === false) {return "false"};
    return str;
    //.toString() causes problems with arrays [2] -> "2"
}
//#endregion 



function toExpressionTree(s, i, commaIsTerminator?): IExpression {
    //PARSES s (the comment) into tree of expression objects
    let children = [];

    let buffer = "";
    while (
        i < s.length && s[i] != ")" //bracket ends expression
        && s[i] != "]"
        && (commaIsTerminator != true || s[i] != ",") //allows commas to terminate like a bracket
        && (i+1 >= s.length || !(s[i] == "/" && s[i+1] == "/"))
        )
    {
        if (s[i] == '(') {
            if (buffer.length > 0) {children.push(buffer);}
            buffer = "";
            let expr = toExpressionTree(s, i+1);
            children.push(expr);
            i = expr.i;
        }
        else if (s[i] == '[') {
            if (buffer.length > 0) {children.push(buffer);}
            buffer = "";
            let expr = new ArrayExpression(s, i+1);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && s.substr(i, 2) == "..") {
            if (buffer.length + children.length == 0) { throw new ExpressionError("Range expression missing something before ..",true,true);}
            children.push(buffer);
            return new RangeExpression(new SimpleExpression(children,i), s, i);
        }
        else if (s[i] == ",") {
            if (buffer.length + children.length == 0) { throw new ExpressionError("List expression missing something before ,",true,true);}
            children.push(buffer);
            return new ListExpression(new SimpleExpression(children,i), s, i);
        }
        else  if (s[i] == '"') {
            if (buffer.length > 0) {children.push(buffer);}
            buffer = "";
            let expr = new QuoteExpression(s, i);
            children.push(expr);
            i = expr.i;
        }
        else if (i + 1 < s.length && isAlpha(s[i]) && isAlpha(s[i+1])) {
            if (buffer.length > 0) {children.push(buffer);}
            buffer = "";
            let expr = new FunctionExpression(s, i);
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
    return new SimpleExpression(children,i);
}

//brackets could contain a single expression or a range,list etc.
class SimpleExpression extends IExpression {
    children: IExpression[];

    constructor(children, i) {
        super(i);
        this.children = children;
    }

    ///EVAL
    eval(injector: ExpressionEngine) {
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

        if (helpers.IsStringNullOrWhiteSpace(buffer)) {
            return "";
        }
        
        //replace -- with +
        buffer = helpers.replaceAll(buffer,"\t","");
        //if (buffer[0] == '"') {return buffer;}
        
        buffer = helpers.replaceAll(buffer,"--","+");

        /*** THE ONLY EVAL ***/

        var evaluated =  eval(buffer);
        return JSON.stringify(evaluated);                    
    }
}

class QuoteExpression extends IExpression {
    s: string;

    constructor(s,i) {
        super(i);
        i++; //skip first quote

        this.s  = "";
        while (i < s.length && s[i] != '"') {
            this.s += s[i];
            i++;
        }
        this.i = i;
    }

    eval(injector: ExpressionEngine) {
        injector.count();
        return `"${this.s}"`;
    }
}

class RangeExpression extends IExpression {
    minExpr: IExpression;
    maxExpr: IExpression;

    constructor(firstBuffer:IExpression, s, i) {
        super(i);
        this.minExpr = firstBuffer;
        this.maxExpr = toExpressionTree(s, i+2);
        this.i = this.maxExpr.i;
    }

    ///EVAL
    //always returns number
    eval(injector: ExpressionEngine) {
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


class ListExpression extends IExpression {
    options: IExpression[];

    constructor(firstBuffer:IExpression, s, i) {
        super(i);
        this.options = [];
        if (firstBuffer != null) {
            this.options.push(firstBuffer);
        }

        while (i < s.length && s[i] != ')' 
            && (i+1 >= s.length || !(s[i] == "/" && s[i+1] == "/"))
        )
        {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {i++;}
                let expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new ExpressionError("bad list",true,true);
            }
        }
        this.i = i;
    }
    ///EVAL
    eval(injector: ExpressionEngine) {
        injector.count();
        let randomIndex = injector.indexForListEvaluation % this.options.length;
        let evaluated = this.options[randomIndex].eval(injector);
        return evaluated; //already eval'd
    }
}

class ArrayExpression extends IExpression {
    options: any[];

    constructor(s, i) {
        super(i);
        this.options = [];

        while (i < s.length && s[i] != ']'
            && (i+1 >= s.length || !(s[i] == "/" && s[i+1] == "/"))
            )
        {
            if (s[i] == "," || this.options.length == 0) {
                if (s[i] == ",") {i++;}
                let expr = toExpressionTree(s, i, true);
                this.options.push(expr);
                i = expr.i;
            }
            else {
                throw new ExpressionError("bad array",true,true);
            }
        }
        this.i = i;
    }

    ///EVAL
    eval(injector: ExpressionEngine) {
        injector.count();
        let evaluated = "["+this.options.map(o => o.eval(injector)).join()+"]";
        return evaluated;
    }
}



//returns all types of variables
class FunctionExpression extends IExpression {
    functionName: string;
    functionNamePreserveCase: string;
    list: ListExpression;

    constructor(s, i) {
        super(i);
        this.functionName = "";
        this.functionNamePreserveCase = "";
        while (i < s.length && 
            ( isAlpha(s[i]) || (helpers.isNumeric(s[i])) )
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
                throw new ExpressionError("string without following bracket",true,true);
            }
        }
        else {

            this.list = new ListExpression(null,s,i+1);
            this.i = this.list.i; //skips final bracket
        }
    }
        
        ///EVAL
    eval(injector: ExpressionEngine) {
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

        if (this.functionName == "tostandardform") {
            let ret = evaluatedParameters[0];
            return JSON.stringify(ret.toExponential().replace("e"," x 10^").replace("+",""));
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
            let ret = null;
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
                throw new ExpressionError("no smaller coprime number exists for "+denom,true,true);
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
            let ret = 0;
            //if one parameter is specified, return normal arctan
            if (evaluatedParameters.length == 1) {
                ret = (180*Math.atan(evaluatedParameters[0])/Math.PI);
            }
            //if two parameters x y are specified, return a bearing 0 - 360
            if (evaluatedParameters.length == 2) {
                ret = (180*Math.atan(evaluatedParameters[0]/evaluatedParameters[1])/Math.PI);//-90 to 90
                //x y
                //+ + 0-90
                //+ - 90-180
                //- - 180-270
                //- + 270-360
                let xIsPos = evaluatedParameters[0] > 0;
                let yIsPos = evaluatedParameters[1] > 0;
                if (xIsPos) { ret += yIsPos ? 0 : 180; }
                else { ret += yIsPos ? 360 : 180 }
            }
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
            var index2 = l - evaluatedParameters[0];
            let ret = evaluatedParameters.slice(1).sort()[index2];
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
            if (evaluatedParameters[0] > 0) { ret = 1; }
            return JSON.stringify(ret);
        }
        
        if (this.functionName == "lcm") {
            let ret = lcm(evaluatedParameters);
            return JSON.stringify(ret);
        }

        if (this.functionName == "compareobjects") {
            let ret = compareobjects(evaluatedParameters[0],evaluatedParameters[1]);
            return JSON.stringify(ret);
        }
        
        //CALL CUSTOM CODE FUNCTION 
        if (injector.allVariablesAndFunctions[this.functionName] instanceof JSFunction) {
            return injector.allVariablesAndFunctions[this.functionName].execute(evaluatedParameters); //already in JSON
        }

        //try Math
        if (typeof(Math[this.functionName]) == "function") {
            let ret =  Math[this.functionName](evaluatedParameters[0],evaluatedParameters[1],evaluatedParameters[2]);
            return JSON.stringify(ret);
        }

        throw new ExpressionError(`custom function with name "${this.functionNamePreserveCase}" not defined`,false,false);
    }   
}
