class SubmitButtonAndFinalScoreLogic {
    div: Container;
    button: ButtonCup;
    finalScore: HeadingCup;
    settings: Settings;

    constructor(settings) {
        this.settings = settings;
    }

    createDiv(parent) {
        this.div = new Container(parent, "div");
        if (this.settings.initialChecksRemaining == 0) {
            //no checks left so no button 
            this.div.appendChildElement(this.createFinalScore(this.div));
            ScoreLogic.instances.forEach(sc => sc.setImage()); 
            this.settings.disableAllInputs();
        }
        else {
            this.div.appendChildElement(this.createButton(this.div, this.settings.initialChecksRemaining)); 
        }
        return this.div;
    }

    createButton(parent, numChecks) {
        this.button = new ButtonCup(parent, this.buttonText(numChecks));
        this.button.addClass("submitButton");
        this.button.setEvent("onclick",this.onCheckButton.bind(this));
        return this.button;
    }

    createFinalScore(parent) {
        this.finalScore = new HeadingCup(this.div, `FINAL SCORE: ${this.settings.totalCorrect} out of ${this.settings.totalOutOf}</h1>`);
        this.finalScore.addClass("finalScore");
        return this.finalScore;
    }

    buttonText(numChecks: number) {
        return numChecks < 1 ? "check my answers" :
            numChecks < 1 ? "no checks remaining" :
            numChecks == 1 ? "I am finished. Check my answers then freeze the quiz" :
            numChecks + " checks remaining";
    }

    //button onclick - only check with server if checks are limited
    onCheckButton() {
        if (this.settings.initialChecksRemaining >= 0) {
            this.button.setAttribute("disabled",true);
            let onRetry = (data) => { 
                this.button.innerHTML = "connection error....retrying";
            };
            Connection.instance.checkRequest(this.checkCallback.bind(this), onRetry.bind(this));
        }
        else {
            //unlimited checks
            ScoreLogic.instances.forEach(s => { if (s.pending) s.setImage(); });   
        }
    }

    checkCallback(checksRemaining) {
        this.button.innerHTML = this.buttonText(checksRemaining);
        this.button.setAttribute("disabled",false); 

        //update button
        if (this.button) {
            this.button.setAttribute("value",this.buttonText);
            if (checksRemaining == 0) {
                this.button.destroy(); 
                this.div.appendChildElement(this.createFinalScore(this.div));
                ScoreLogic.instances.forEach(sc => sc.setImage());
                this.settings.disableAllInputs();
            }
        }
    }

}