
interface IEngine {
    calculate(inputs: any, seed: number): any;
}


class SimpleEngine {
    comment: any;
    correctAnswers = {};

    constructor(comment: string) {
        this.comment = comment;
        let split = comment.split("\n");
        for (let i = 0; i < split.length; i++)  {
            this.correctAnswers[helpers.lowerCaseLetterFromIndex(i)] = split[i];
        }
    }

    calculate(inputs, seed) { //outputs can be hourglass? undefined? if inputs are undefined?
        //comment variables are "a" "b" etc.
        return this.correctAnswers;
    }
}

//used in expression.eval(injector)
class ExpressionEngine implements IEngine {
    overflowCounter = 0;
    OVERFLOW_LIMIT = 1000;
    allVariablesAndFunctions: any = {}; //points to IExpression / JSON string / undefined
    indexForListEvaluation: number;
    random: Random;
    jsFunctionsWithLetters: any;
    variableNamesWithLetters: any;
    numVariables = 0;

    constructor(commentsWithLetters, jsFunctionsWithLetters, variableNamesWithLetters) {
        //expression tree
        this.jsFunctionsWithLetters = jsFunctionsWithLetters;
        this.variableNamesWithLetters = variableNamesWithLetters;
        for (let key in commentsWithLetters) {
            this.allVariablesAndFunctions[key] = toExpressionTree(commentsWithLetters[key],0);
            this.numVariables++;
        }
    }

    count() {
        if (this.overflowCounter++ > this.OVERFLOW_LIMIT) {
            throw new ExpressionError("contains an infinite loop",true,true);
        }
    }

    calculate(inputs, seed: number) {
        //reset everything
        this.random =  new Random(seed);
        this.indexForListEvaluation = this.random.next();
        this.overflowCounter = 0;
        for (let letter in this.allVariablesAndFunctions) {
            if (this.allVariablesAndFunctions[letter] instanceof IExpression) {
                this.allVariablesAndFunctions[letter]._value = undefined;
            }
        }

        let outputs = {};
        //prepare jsfunctions
        for (let letter in this.jsFunctionsWithLetters) {
            if (inputs[letter] && inputs[letter].length > 0) {
                try {
                    //try and evaluate each expression
                    let obj =  new JSFunction(inputs[letter], this.jsFunctionsWithLetters[letter]);
                    this.allVariablesAndFunctions[this.jsFunctionsWithLetters[letter]] = obj;
                }
                catch (e) {
                    if (e instanceof ExpressionError) {
                        //log user errors
                        if (!e.isCritical) { outputs[letter] = e; }
                        //re-throw critical errors up to commentLogic
                        else { throw(e) }
                    }
                }
            }
        }

        //prepare variables - copy the input over to allVariables with the specified variable name
        for (let letter in this.variableNamesWithLetters) {
            this.allVariablesAndFunctions[this.variableNamesWithLetters[letter]] = inputs[letter];
        }

        //run through expression trees. returns letter-indexed strings
        for (let key in this.allVariablesAndFunctions) {
            if (this.allVariablesAndFunctions[key] instanceof IExpression) {
                try {
                    //try and evaluate each expression
                    outputs[key] = JSONtoViewable(this.allVariablesAndFunctions[key].getValue(this));
                }
                catch (e) {
                    if (e instanceof ExpressionError) {
                        //log user errors
                        if (!e.isCritical) { outputs[key] = e; }
                        //re-throw critical errors up to commentLogic
                        else { throw(e) }
                    }
                }
            }
        }
        return outputs;
    }

    variablesToKeepAsDollars(seed: number) {
        this.calculate({},0);
        let matrix = [];
        let i = 0;
        for (let key in this.allVariablesAndFunctions) {
            let row = helpers.getValuesFromObject(this.allVariablesAndFunctions[key].variablesUsed);
            //add variables (cols) to their own equations (rows)
            row[i] = true;
            matrix.push(row.slice(0,this.numVariables));
            i++;
        }
        return this.showVariables(matrix, this.numVariables, new Random(seed));
    }
    
    //takes square grid of rows (equations) with variables as true (columns)
    showVariables(arr:boolean[][],numDollars,paramRandom) {
        //automatically show variables (columns) that only appear once (in diagonal)
        var colsToShow = arr[0].map(a => false); //set all cols to false
        for (var rowCol = 0; rowCol < arr[0].length; rowCol++) {
            colsToShow[rowCol] = (arr[rowCol].filter(p => p).length == 1) 
                && (arr.filter(p => p[rowCol]).length == 1);
        }

        //remove equations (rows) with a single true
        arr = arr.filter(r => r.filter(p => p).length > 1);
        
        //target number hidden variables = num of equations at this point
        var maxColsToShow = colsToShow.length - arr.length;
        var backupArr = arr.map(row => row.slice());
        var backupColsToShow = colsToShow.slice();

        while (arr.length  > 0 || maxColsToShow < colsToShow.filter(p => p).length) {

            //if too may variables shown, reset and try again
            if (maxColsToShow < colsToShow.filter(p => p).length) {
                arr = backupArr.map(row => row.slice());
                colsToShow = backupColsToShow.slice();
            }

            var colsWithATrue = [];
            //get colsWithATrue from within the hidden

            for (var col = numDollars; col <  arr[0].length; col++) {
                var hasATrue = false;
                for (var row = 0; row < arr.length; row++) {
                    hasATrue = hasATrue || arr[row][col]; 
                }
                if (hasATrue) {
                    colsWithATrue.push(col);
                }
            }

            //get cols with a true from within the dollars
            if (colsWithATrue.length == 0) {
                for (let col = 0; col < numDollars; col++) {
                    var hasATrue = false;
                    for (var row = 0; row < arr.length; row++) {
                        hasATrue = hasATrue || arr[row][col]; 
                    }
                    if (hasATrue) {
                        colsWithATrue.push(col);
                    }
                }
            }

            //if no cols then stop
            if (colsWithATrue.length == 0) {
                break;
            }

            //randomly pick a col to remove

            var colToRemove = colsWithATrue[Math.floor(paramRandom.next(colsWithATrue.length))];
            colsToShow[colToRemove] = true;
            //set col to false 
            arr.forEach(f => f[colToRemove] = false);
            //if any rows have 1 true, remove that col too since these equations can be solved 
            var rowsWithOneTrue = arr.filter(r => r.filter(p => p).length == 1);
            while (rowsWithOneTrue.length > 0) {
                for (var r = 0; r < rowsWithOneTrue.length; r++) {
                    var row2 = rowsWithOneTrue[r];
                    var singleCol = row2.indexOf(true);
                    //set col to false 
                    arr.forEach(f => f[singleCol] = false);
                    //remove rows with only one true
                    arr = arr.filter(r => r.filter(p => p).length > 0);
                }
                rowsWithOneTrue = arr.filter(r => r.filter(p => p).length == 1);
            }
        }
        return colsToShow;
    }

}