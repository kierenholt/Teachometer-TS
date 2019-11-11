var ALLOWABLE_ERROR_FOR_CORRECT_ANSWER = 0.05;
//DECISION LOGIC
var Solution = /** @class */ (function () {
    function Solution(field, template, settings, allSolutions) {
        this.allSolutions = allSolutions;
        if (template) {
            template.allSolutions = allSolutions;
        }
        this.settings = settings;
        this.markbookIndex = settings.markbookIndex++;
        this.template = template;
        this.field = field;
        this.score = 0;
        this.triggerCalculateFromLateFunction = true; //set false by code() and variable() template functions
        this.elementHasChangedSinceLastChecked = false;
        this.notYetChecked = true; //used to assign star or tick
        this.notYetAnswered = true; //used to calculate outof
        //set cup onResponse
        field.onResponse = this.onResponseInjector(this);
    }
    //called from rowhtml after all new solutions made
    Solution.prototype.importResponses = function () {
        if (this.settings.responses && this.settings.responses[this.markbookIndex]) {
            this.field.elementValue = this.settings.responses[this.markbookIndex]; //this = field
            try {
                this.updateScoreAndImage();
            }
            catch (e) { }
            this.notYetChecked = false;
            this.elementHasChangedSinceLastChecked = true;
            //this.showDecisionImage(); moved to consumeblob
        }
        else {
            if (this.template) {
                try {
                    this.template.forceCalculate();
                }
                catch (e) {
                    console.log("error calculating template " + e);
                }
            }
            //execute the template anyway
        }
    };
    Object.defineProperty(Solution.prototype, "affectsScore", {
        get: function () {
            return !(this.field.disabled || this.template == null ||
                !this.triggerCalculateFromLateFunction || this.field instanceof PoundCup);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "solutionText", {
        get: function () {
            if (this.affectsScore) {
                if (this.field instanceof CheckBoxCup || this.field instanceof PoundCup) {
                    return "";
                }
                else {
                    try { //this will remove too many dps etc.
                        if (this.template instanceof Template) {
                            return calculatedJSONtoViewable(this.template.calculatedValue);
                        }
                        else {
                            return this.template.calculatedValue;
                        }
                    }
                    catch (e) {
                        console.log("error calculating template " + e);
                    }
                }
            }
            return "";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "disabled", {
        set: function (value) {
            this.field.disabled = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Solution.prototype, "outOf", {
        //depends on template + field
        get: function () {
            if ((this.settings.outOfOnlyQuestionsAttempted && this.notYetAnswered)
                || !this.affectsScore) {
                return 0;
            }
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    Solution.prototype.showDecisionImage = function () {
        if (this.affectsScore && this.elementHasChangedSinceLastChecked) {
            this.field.showDecisionImage(this.image);
        }
        this.elementHasChangedSinceLastChecked = false;
        this.notYetChecked = false;
    };
    //ONRESPONSE - check and store decision, call markbookUpdate
    Solution.prototype.onResponseInjector = function (solution) {
        var s = solution;
        return function () {
            if (this.element != null && this.elementValue != null) {
                s.updateScoreAndImage();
                if (s.settings.markbookUpdate && isNumeric(s.markbookIndex)) {
                    s.settings.markbookUpdate(s.markbookIndex, this.elementValue, //field.elementValue
                    s.color, //solution.color
                    !s.notYetChecked && this.triggerCalculateFromLateFunction, //append
                    s.settings.reportScoreAsPercentage ? window.assignment.scorePercentage : window.assignment.scoreOutOf);
                    //markbookColumn, response, color, append, scoreOutOf
                }
            }
        };
    };
    //does not updatemarkbook, does not show image unless showDecisionImage is called
    Solution.prototype.updateScoreAndImage = function () {
        this.elementHasChangedSinceLastChecked = true;
        this.notYetAnswered = false;
        this.color = "White";
        if (this.template) {
            //check box
            if (this.field instanceof CheckBoxCup) {
                try {
                    this.score = (this.template.calculatedValue == "true") ? 1 : 0;
                    this.field.elementValue = (this.score == 1);
                }
                catch (e) {
                    this.field.elementValue = "!";
                    this.field.hoverText = e;
                }
            }
            //pound
            else if (this.field instanceof PoundCup) {
                try {
                    var val = this.template.calculatedValue;
                    val = JSON.parse(val);
                    this.field.elementValue = val.toString();
                    this.field.isRed = false;
                }
                catch (e) {
                    this.field.elementValue = e;
                    this.field.isRed = true;
                }
            }
            //input, combo, radio but only if scoring
            else if (this.affectsScore) {
                try {
                    this.score = this.template.isCorrect(this.field.elementValue) ? 1 : 0;
                }
                catch (e) { }
            }
            else { //calculate anyway
                try {
                    this.template.forceCalculate();
                }
                catch (e) { }
            }
            //https://www.quackit.com/css/css_color_codes.cfm
        }
        if (this.affectsScore) {
            if (this.score == 1) {
                if (this.notYetChecked || this.image == "star") {
                    this.image = "star";
                }
                else {
                    this.image = "tick";
                }
            }
            else {
                this.image = "cross";
            }
            this.color = this.image == "star" ? "LimeGreen" :
                this.image == "tick" ? "LightGreen" :
                    this.image == "cross" ? "LightSalmon" : "Salmon";
        }
    };
    return Solution;
}());
//# sourceMappingURL=solution.js.map