class CodeError extends Error {
    constructor(message) {
        super(message);
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
            this.error = error; //don't throw it until code is executed
        }
        this.code = code;
        this.JSName = JSName;
        this.cache = {};
    }

    execute(parameters) { //parameters are currently js objects
        //https://neil.fraser.name/software/JS-Interpreter/docs.html
        if (this.error) { throw new CodeError(this.error); }
        
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
            throw new CodeError("your code contains an infinite loop");            
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
