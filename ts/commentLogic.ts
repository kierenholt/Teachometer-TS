function trimAfterDoubleSlash(comment): string {
    let indexOfDoubleSlash = comment.indexOf("//");
    if (indexOfDoubleSlash != -1) {comment = comment.substr(0,indexOfDoubleSlash);}
    return comment;
}

const ALLOWABLE_ERROR_FOR_CORRECT_ANSWER = 0.05;


//takes response events as input, triggers value updates in pound / scorelogic
class CommentLogic {
    solutionLines = {};
    solutionValueSpans = {};
    questionLogic: QuestionLogic;
    settings: Settings;
    static instances: CommentLogic[] = [];

    engine: IEngine;
    seed: number;

    inputsWithCommentLetters = {};
    dollarCupsWithCommentLetters = {};
    checkBoxesWithCommentLetters = {};
    scoreLogicsWithCommentLetters = {};
    jsFunctionNamesWithCommentLetters = {};
    pastInputValuesWithLetters = {}; //set each time inputValues is called


    //comments should match up to setValueFields
    //clickaway fields only trigger recalculate
    constructor(comment: string, valueFields: ValueField[], 
        purpose: string, questionLogic: QuestionLogic) {

        this.questionLogic = questionLogic;
        this.settings = questionLogic.settings;
        CommentLogic.instances.push(this);
        this.seed = this.settings.random.next();
        
        let commentsWithLetters = {};
        let variableNamesWithCommentLetters = {};

        if (purpose != "template" && purpose != "sudoku") {
            this.engine = new SimpleEngine(comment);
        }
        else {
            //remove javascript code and keep as jsfunctions for later
            //e.g. in variable b:  code("addTwo") => create function called addTwo() from b input
            //
            let splitComments = comment.split("\n");
            for (let i = 0; i < splitComments.length; i++) {
                let c = splitComments[i];
                let codeMatches = c.match(/code\(\"([\S]+)\"\)/);
                let variableMatches = c.match(/variable\(\"([\S]+)\"\)/);
                let commentLetter = helpers.lowerCaseLetterFromIndex(i);
                if (codeMatches) { 
                    //keep function name in lowercase
                    this.jsFunctionNamesWithCommentLetters[commentLetter] = codeMatches[1].toLowerCase(); 
                }
                else if (variableMatches) {
                    //use later in first step of inputs
                    variableNamesWithCommentLetters[commentLetter] = variableMatches[1]; 
                }
                else { 
                    //does not match code("something") so add to comments as normal
                    commentsWithLetters[commentLetter] = c;
                }
                this.engine = new ExpressionEngine(commentsWithLetters,this.jsFunctionNamesWithCommentLetters,variableNamesWithCommentLetters);
                //do not add scorelogic to variables which map to jsfunctions 
            }
        } 

        if (purpose == "sudoku") {
            let variablesToKeepAsDollars = ((this.engine as ExpressionEngine).variablesToKeepAsDollars(this.seed));
            for (let i = 0; i < variablesToKeepAsDollars.length; i++) {
                if (!variablesToKeepAsDollars[i]) {
                    valueFields[i] = (valueFields[i] as DollarCup).swapForInput();
                }
            }
        }

        
        //value fields match up to variables a, b, c etc.
        for (let i = 0; i < valueFields.length; i++) {           //hook up scorelogics except for poundcups
            let v = valueFields[i];
            //dollars also get commentLetter but should not be included in solutionLetter
            let commentLetter = helpers.lowerCaseLetterFromIndex(i);
            

            //INPUTS
            if (v instanceof ComboCup || 
                v instanceof InputCup || 
                v instanceof TextAreaCup || 
                v instanceof RadioSet) {
                this.inputsWithCommentLetters[commentLetter] = v; //assign comment letter

                //register with sheetmanager
                if (this.settings.sheetManager ) {
                    if (commentLetter in this.jsFunctionNamesWithCommentLetters) {
                        //code does not have a scorelogic letter so use functionName
                        this.settings.sheetManager.registerField(v, this.questionLogic.rowData.title, this.jsFunctionNamesWithCommentLetters[commentLetter]);
                    }
                    else if (commentLetter in variableNamesWithCommentLetters) {
                        //do not register variables
                    }
                    else {
                        //use title or question number as first part of column header
                        let columnHeaderFirstPart = helpers.IsStringNullOrWhiteSpace(this.questionLogic.rowData.title) ? this.questionLogic.questionNumberLogic.number.toString() : this.questionLogic.rowData.title;
                        this.settings.sheetManager.registerField(v, columnHeaderFirstPart);
                    }
                }
            }
            if (v instanceof CheckBoxCup) {
                this.checkBoxesWithCommentLetters[commentLetter] = v;
                if (this.settings.sheetManager) {
                    this.settings.sheetManager.registerField(v, this.questionLogic.rowData.title);
                }
            }

            //OUTPUTS
            if (v instanceof DollarCup)   {
                this.dollarCupsWithCommentLetters[commentLetter] = v;
            }

            //HOOK SCORELOGIC UP TO SETIMAGEFIELDS, except for code("") comments
            if (v instanceof ComboCup || 
                v instanceof InputCup || 
                v instanceof TextAreaCup || 
                v instanceof CheckBoxCup || 
                v instanceof RadioSet)   {
                    if (commentLetter in this.jsFunctionNamesWithCommentLetters) {
                        //do not create scorelogic, add some default code
                        v.setValue(JSFunction.generateDefaultCode(this.jsFunctionNamesWithCommentLetters[commentLetter]));
                    }
                    else if (commentLetter in variableNamesWithCommentLetters) {
                        //do not create scorelogic for variables
                    }
                    else {
                        this.scoreLogicsWithCommentLetters[commentLetter] = new ScoreLogic(v, this.settings, (questionLogic.questionDiv as QuestionDiv));
                    }
            }
        }
    
        //hookup clickaway events
        for (let d of valueFields) {
            if (d instanceof ComboCup ||
                d instanceof InputCup ||
                d instanceof TextAreaCup ||
                d instanceof RadioSet) {
                    d.setOnClickAway( function(commentLogic: CommentLogic, field: ValueField) {
                        //only triggers onResponseClickAway if field is not blank, and different from last time
                        var commentLogic = commentLogic;
                        var field = field;
                        var prevValue = field.getValue();
                        return () => {
                            if (field.getValue() && prevValue != field.getValue()) {
                                prevValue = field.getValue();
                                commentLogic.onResponseFieldClickAway();
                            }
                        };
                    }(this, d)
                    );
                }
        }

        //update dollars and decision images
        let inputValues = this.getInputValues();
        let outputValues = this.calculate(inputValues);
        if (outputValues) { 
            this.updateDollars(outputValues); 
            this.sendToScoreLogics(inputValues, outputValues); //sets stars for responses added from marksheet
            this.pastInputValuesWithLetters = inputValues;
        }
    }
    //end of constructor

    //refresh button does this
    generateNewDollars() {
        this.seed = Settings.instance.random.next();
        let outputValues = this.calculate(this.getInputValues());
        if (outputValues) {
            this.updateDollars(outputValues);
            //update solutions if available
            for (let key in this.solutionValueSpans) {
                if (key in outputValues && outputValues[key]) { (this.solutionValueSpans[key] as Span).innerHTML = outputValues[key]}
            }
        }
    }

    fieldHasChanged(letter) {
        return this.pastInputValuesWithLetters[letter] != this.getInputValues()[letter];
    }

    onResponseFieldClickAway() {
        let inputValues = this.getInputValues();
        let outputValues = this.calculate(inputValues);
        if (outputValues) {
            this.updateDollars(outputValues);
            this.sendToScoreLogics(inputValues, outputValues); //only updated if values have changed

            if (Settings.instance.sendScoresToMarksheet)  { this.sendToSheetManager(inputValues); }
            this.pastInputValuesWithLetters = inputValues;
        }
    }

    sendToScoreLogics(inputValues,outputValues) {
        for (let letter in this.inputsWithCommentLetters) { //excludes checkboxes
            if (!helpers.IsStringNullOrWhiteSpace(inputValues[letter]) && this.fieldHasChanged(letter)) {
                if (letter in this.scoreLogicsWithCommentLetters && letter in outputValues) {
                    let isCorrect = this.internalIsCorrect(inputValues[letter],outputValues[letter]);
                    //set image (or postpone)
                    (this.scoreLogicsWithCommentLetters[letter] as ScoreLogic).setCorrect(isCorrect);
                }
            }
        }
        //checkboxes
        for (let key in this.checkBoxesWithCommentLetters) {
            if (key in outputValues) {
                //set image or postpone
                (this.scoreLogicsWithCommentLetters[key] as ScoreLogic).setCorrect(outputValues[key] == "true");
            }
        }
    }

    sendToSheetManager(inputValues) {
        for (let letter in inputValues) { //excludes checkboxes
            if (!helpers.IsStringNullOrWhiteSpace(inputValues[letter]) && this.fieldHasChanged(letter)) {
                if (this.settings.sheetManager) {
                    this.settings.sheetManager.addFieldToSendBuffer(this.inputsWithCommentLetters[letter], this.scoreLogicsWithCommentLetters[letter]);
                }
            }
        }
        for (let key in this.checkBoxesWithCommentLetters) {
            if (this.settings.sheetManager) {
                this.settings.sheetManager.addFieldToSendBuffer(this.checkBoxesWithCommentLetters[key],this.scoreLogicsWithCommentLetters[key]);
            }
        }
        this.settings.sheetManager.attemptToSend();
    }

    updateDollars(outputValues) {
        //update dollar cups
        for (let key in this.dollarCupsWithCommentLetters) {
            if (key in outputValues) { (this.dollarCupsWithCommentLetters[key] as DollarCup).setValue(outputValues[key]); }
        }
    }

    getInputValues(): any {
        //get input values
        let ret = {};
        for (let key in this.inputsWithCommentLetters) {
            ret[key] = this.inputsWithCommentLetters[key].getValue();
        }
        return ret;
    }
    
    calculate(inputValues: any): any {
        //put into calculation engine
        let outputs = null;
        try {
            outputs = this.engine.calculate(inputValues, this.seed);
        }
        catch (e) {
            //user info errors are copied into outputs so no criticals will be caught
            if (e instanceof ExpressionError && e.isCritical) {
                    this.questionLogic.questionDiv.contentDiv.destroyAllChildren();
                    this.questionLogic.questionDiv.contentDiv.appendChildString(`There is an error in this question's comment cell which is preventing it from calculating the solutions.\n Error detail: ${e.message}`);
                    this.questionLogic.questionDiv.contentDiv.addClass("red");
                    return null;
            }
        }
        //hide previous errors
        this.questionLogic.questionDiv.contentDiv.removeClass("red");
        for (let letter in this.inputsWithCommentLetters) {
            (this.inputsWithCommentLetters[letter] as ValueField).resetError();
        }
        for (let letter in this.checkBoxesWithCommentLetters) {
            (this.checkBoxesWithCommentLetters[letter] as ValueField).resetError();
        }
        for (let letter in this.dollarCupsWithCommentLetters) {
            (this.dollarCupsWithCommentLetters[letter] as ValueField).resetError();
        }
        //show errors
        for (let letter in outputs) {
            if (letter in this.inputsWithCommentLetters && 
                    outputs[letter] instanceof ExpressionError) {
                (this.inputsWithCommentLetters[letter] as ValueField).setErrorText(outputs[letter].message);
                outputs[letter] = "";
            }
            if (letter in this.checkBoxesWithCommentLetters && 
                    outputs[letter] instanceof ExpressionError) {
                (this.checkBoxesWithCommentLetters[letter] as ValueField).setErrorText(outputs[letter].message);
                outputs[letter] = "";
            }
            if (letter in this.dollarCupsWithCommentLetters && 
                    outputs[letter] instanceof ExpressionError) {
                (this.dollarCupsWithCommentLetters[letter] as ValueField).setErrorText(outputs[letter].message);
                outputs[letter] = "";
            }
        }
        return outputs;
    }

    //returns a div for each scorelogic
    createAndAppendSolutions(parent: Container, questionNumberLogic: QuestionNumberLogic)  {
        //no input values
        let outputValues = this.calculate(this.getInputValues());

        if (outputValues) {
            let ret = [];
            let i = 0;
            for (var letter in this.scoreLogicsWithCommentLetters) {
                if (letter in outputValues) {
                    let solutionLine = new Container(parent,"div" )
                    solutionLine.appendChildElement(questionNumberLogic.createSpan(solutionLine));
                    solutionLine.appendChildString(helpers.lowerCaseLetterFromIndex(i) + ". ")
                    let solutionValue = new Span(solutionLine, outputValues[letter]);
                    solutionLine.appendChildElement(solutionValue);
                    parent.appendChildElement(solutionLine);
                    i++;
                    this.solutionLines[letter] = solutionLine;
                    this.solutionValueSpans[letter] = solutionValue;
                }
            }
        }
    }


    //destroy the image and remove the scorelogic and remove the solutionLine
    truncate(n) {
        let letters = helpers.getKeysFromObject(this.scoreLogicsWithCommentLetters);
        let i = letters.length - 1;
        while (n > 0) {
            let letter = letters[i];
            this.scoreLogicsWithCommentLetters[letter].setImageField.destroy();
            this.scoreLogicsWithCommentLetters[letter].destroy(); 
            this.solutionLines[letter].destroy();
            n--;
            i--;
        }
    }

    disable() {
        helpers.getValuesFromObject(this.inputsWithCommentLetters).forEach(i => (i as ICup).setAttribute("disabled",true));
    }

    //values come from JSONToViewable as *strings*
    internalIsCorrect(value, correctAnswer) {
        //numbers
        if (helpers.isNumeric(correctAnswer)) {
            //integers
            if (correctAnswer%1 == 0) {
                return this.isCorrectExact(value,correctAnswer);
            }
            else {
                return this.isCorrectWithin5Percent(value, correctAnswer);
            }
        }
        //strings
        else {
            return this.isCorrectString(value, correctAnswer);
        }
    }

    isCorrectWithin5Percent(value, correctAnswer) {
        return Math.abs(value-correctAnswer) <= Math.abs(ALLOWABLE_ERROR_FOR_CORRECT_ANSWER*correctAnswer);
    }

    isCorrectString(value, correctAnswer) {
        return value.toLowerCase().replace("'", "\'") == correctAnswer.toLowerCase();
    }

    isCorrectExact(value, correctAnswer) {
        return value == correctAnswer;
    }

    destroy() {
        for (let key in this.scoreLogicsWithCommentLetters) {
            this.scoreLogicsWithCommentLetters[key].destroy();
        }
        helpers.removeFromArray(CommentLogic.instances,this);
    }
}
