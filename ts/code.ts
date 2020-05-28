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
        catch(e) { //re-throw to be caught by expression.ts
            throw new ExpressionError("Error: Bad code. \n Detail:  " + (e as Error).message,true,false);  
        }
        this.code = code;
        this.JSName = JSName;
        this.cache = {};
    }

    execute(parameters) { //parameters are JSON format
        //https://neil.fraser.name/software/JS-Interpreter/docs.html
        
        let joinedParameters = parameters.map(a => JSON.stringify(a)).join();
        if (joinedParameters in this.cache) {
            return this.cache[joinedParameters];
        }
        
        if (this.JSName != "console") {
            this.interpreter.appendCode(`
              ${this.JSName}(${joinedParameters});`);
        }

        var i = 100000; //counts up to 9998 using a while loop....?
        try {
            while (i-- && this.interpreter.step()) {
                //console.log(i);
            }
        }
        catch (e) { //re-throw to be caught at expression.ts 
            throw new ExpressionError("Error:code did not execute completely\n Detail:  " + (e as Error).message,true,false);  
        }

        if (i == -1) {
            throw new ExpressionError("Error: Code contains an infinite loop",true,false);            
        }

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

    static generateDefaultCode(functionName) {
        if (functionName == "console") { return ""; }
        return `function ${functionName}() {

//your code goes here
        
}`;
    }
}
