
class ScoreLogic  {
    hasBeenWrong: boolean;
    hasBeenCorrect: boolean;
    _score: number;
    pending: boolean = false;

    setImageField: SetImageField;
    static showHourGlassNotification = true;
    settings: Settings;
    questionDiv: QuestionDiv;
    static instances: ScoreLogic[] = [];

    constructor(setImageField: SetImageField, settings: Settings, questionDiv: QuestionDiv) {
        ScoreLogic.instances.push(this);
        this.settings = settings;
        this.setImageField = setImageField;
        if (this.questionDiv instanceof QuestionDiv) this.questionDiv = questionDiv; //turns green when all SL's are correct

        this._score = 0;
        
        this.hasBeenWrong = false;
        this.hasBeenCorrect = false;
    }

    get stars() {
        return (this.hasBeenCorrect && !this.hasBeenWrong) ? 1 : 0;
    }

    get attempted() {
        return (this.hasBeenCorrect || this.hasBeenWrong) ? 1 : 0;
    }

    get outOf() {
        return 1;
    }

    get score() {
        return this._score;
    }

    //usually postpones unless first attempt
    setCorrect(isCorrect: boolean) {
        this._score = isCorrect ? 1 : 0;

        if ((this.attempted == 0 || this.settings.presentMode) &&
            this.settings.initialChecksRemaining < 0) { //do not postpone if first attempt
            this.setImage();
        }
        else { //postpone
            this.setImageField.setDecisionImage(IconName.hourglass);
            this.pending = true;
            if (this.settings.initialChecksRemaining < 0 && ScoreLogic.showHourGlassNotification) {
                alert("To check an answer after the first attempt, you must use the 'check answers button' at the bottom of the page.");
                ScoreLogic.showHourGlassNotification = false;
            }
        }

        if (isCorrect) {
            this.hasBeenCorrect = true;
        }
        else {
            this.hasBeenWrong = true;
        }
    }

    //also called from check button
    setImage() {
        this.setImageField.setDecisionImage(this.iconName);
        this.pending = false;


        if (this.questionDiv) {
            //also check the other scorelogics and if they are all correct, turn questiondiv green
            let sameQuestionSLs = ScoreLogic.instances.filter(sl => sl.questionDiv == this.questionDiv);
            let wrongOnes = sameQuestionSLs.filter(sl => sl.score == 0);

            if (wrongOnes.length == 0) { //all correct
                this.questionDiv.marginDiv.addClass("greenBackground");
                this.questionDiv.marginDiv.removeClass("greyBackground");
                this.questionDiv.addClass("greenBorder");
                this.questionDiv.removeClass("greyBorder");
            }
            else { //some wrong
                this.questionDiv.marginDiv.addClass("greyBackground");
                this.questionDiv.marginDiv.removeClass("greenBackground");
                this.questionDiv.addClass("greyBorder");
                this.questionDiv.removeClass("greenBorder");
            }
        }
    }

    get iconName(): IconName {
        if (this._score == 1) {
            return this.hasBeenWrong ? IconName.tick : IconName.star;
        }
        if (this._score == 0) {
            return IconName.cross;
        }
    }

    get color(): string {
        if (this._score == 1) {
            return this.hasBeenWrong ? "LimeGreen" : "LightGreen";
        }
        if (this._score == 0) {
            return (this.hasBeenCorrect || this.hasBeenWrong) ? "LightSalmon" : "White";
        }
    }

    get iconAsString(): string {
        if (this._score == 1) {
            return this.hasBeenWrong ? "✓" : "★";
        }
        if (this._score == 0) {
            return (this.hasBeenCorrect || this.hasBeenWrong) ? "✗" : "White";
        }
    }

    destroy() {
        helpers.removeFromArray(ScoreLogic.instances,this);
    }

}