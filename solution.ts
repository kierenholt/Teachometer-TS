const ALLOWABLE_ERROR_FOR_CORRECT_ANSWER = 0.05;

//DECISION LOGIC
class Solution {
    allSolutions: any;
    settings: any;
    markbookIndex: number;
    template: any;
    field: Field;
    score: number;
    triggerCalculateFromLateFunction: boolean;
    elementHasChangedSinceLastChecked: boolean;
    notYetChecked: boolean;
    notYetAnswered: boolean;
    color: string;
    image: decisionImageEnum;

    constructor(field, template, settings, allSolutions) {

        this.allSolutions = allSolutions;
        if (template) {
            template.allSolutions = allSolutions;
        }

        this.settings = settings;
        this.markbookIndex = settings.markbookIndex++;
        this.template = template;
//        this.template.onError = function(paramSolution) { var s = paramSolution; return function() {s.onTemplateError()} }(this);
        this.field = field;
        this.score = 0;

        this.triggerCalculateFromLateFunction = true; 
        //set false by code() and variable() template functions to avoid infinite loop

        this.elementHasChangedSinceLastChecked = false;
        this.notYetChecked = true; //used to assign star or tick
        this.notYetAnswered = true; //used to calculate outof

        //set cup onResponse
        field.onResponse = this.onResponseInjector(this);
    }


    //called from rowhtml after all new solutions made
    importResponses() {
        if (this.settings.responses && this.settings.responses[this.markbookIndex]) {     
            this.field.elementValue = this.settings.responses[this.markbookIndex]; //this = field
            this.updateScoreAndImage(); 
            this.notYetChecked = false;
            this.elementHasChangedSinceLastChecked = true;
            
            //this.showDecisionImage(); moved to consumeblob
        }
        else {
            if (this.template) {
                this.template.forceCalculate();
            }
            //execute the template anyway
        }
    }

    get affectsScore() {
        return !(this.field.disabled || this.template == null || 
            !this.triggerCalculateFromLateFunction || this.field instanceof PoundCup)
    }

    get solutionText() {
        if (this.affectsScore) { 
            if (this.field instanceof CheckBoxCup || this.field instanceof  PoundCup) {
                return "";
            }
            else { 
                //this will remove too many dps etc.
                if (this.template instanceof Template) {
                    return calculatedJSONtoViewable(this.template.calculatedValue); 
                }
                else { //for questiontemplate
                    return this.template.calculatedValue; 
                }
            }
        }
        return "";
    }

    set disabled(value) {
        this.field.disabled = value;
    }

    get stars() {
        if (this.image == decisionImageEnum.Star) return 1;
        return 0
    }

    get attempted() {
        if (this.notYetAnswered || !this.affectsScore) return 0;
        return 1
    }

    //depends on template + field
    get outOf() {
        if (!this.affectsScore) return 0;
        return 1;
    }

    showDecisionImage() {
        if (this.affectsScore && this.elementHasChangedSinceLastChecked) {
            this.field.decisionImage = this.image;
        }
        this.elementHasChangedSinceLastChecked = false;
        this.notYetChecked = false;
    }
    
//ONRESPONSE - check and store decision, call markbookUpdate
    onResponseInjector(solution) {
        let s = solution;
        return function() { //called by field
            if (this.elementValue != null) {
                
                s.updateScoreAndImage();
                
                //do not append if not yet checked, student might be trying stuff out
                //do not append if its a late calculation

                let doAppend = !s.notYetChecked && 
                    s.triggerCalculateFromLateFunction &&
                    s.settings.appendToMarkbook;
                let scores = s.settings.scoreGetters ? s.settings.scoreGetters.map(f => f()): null;

                if (s.settings.markbookUpdate && helpers.isNumeric(s.markbookIndex)) {
                    s.settings.markbookUpdate(
                        s.markbookIndex, 
                        s.field.elementValue, //field.elementValue
                        s.color, //solution.color
                        doAppend,
                        scores)
                    //markbookColumn, response, color, append, scoreOutOf
                }
            }
        }
    }

    //does not updatemarkbook, does not show image unless showDecisionImage is called
    updateScoreAndImage() {
        this.elementHasChangedSinceLastChecked = true;
        this.notYetAnswered = false;

        this.color = "White";
        if (this.template) {
            //check box
            if (this.field instanceof CheckBoxCup) {
                try  { 
                    this.score = (this.template.calculatedValue == "true") ? 1 : 0;
                    this.field.elementValue = (this.score == 1); 
                } 
                catch (e) { //only catch code errors
                    if (e instanceof CodeError) {
                        this.field.elementValue = "!";
                        this.field.hoverText = e;
                    }
                    else { 
                        throw(e);
                    }
                }
            }
            //pound
            else if (this.field instanceof PoundCup) {
                let poundCoerced = this.field as PoundCup;
                try {
                    let val = this.template.calculatedValue;
                    val = JSON.parse(val);
                    poundCoerced.elementValue = val.toString();
                    poundCoerced.isRed = false;
                }
                catch (e) { //only catch code errors
                    if (e instanceof CodeError) {
                    poundCoerced.elementValue = e;
                    poundCoerced.isRed = true;
                    }
                    else { 
                        throw(e);
                    }
                }
            }
            //input, combo, radio but only if scoring
            else if (this.affectsScore) {
                this.score = this.template.isCorrect(this.field.elementValue) ? 1 : 0;
            }
            else { //calculate anyway
                this.template.forceCalculate();
            }

        //https://www.quackit.com/css/css_color_codes.cfm
        }
        
        if (this.affectsScore) {
            if (this.score == 1) {
                if (this.notYetChecked || this.image == decisionImageEnum.Star) {
                    this.image = decisionImageEnum.Star;
                }
                else {
                    this.image = decisionImageEnum.Tick;
                }
            }
            else {
                this.image = decisionImageEnum.Cross; 
            }

            this.color = this.image == decisionImageEnum.Star ? "LimeGreen" :
                    this.image == decisionImageEnum.Tick ? "LightGreen" :
                    this.image == decisionImageEnum.Cross ? "LightSalmon" : "Salmon";
        }
    }
}
