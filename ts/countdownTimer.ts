
/*
        //Number of clicks away
        if (false) {
            window.onblur = function(paramAsn) { 
                var asn = paramAsn;
                return function() {
                    asn.settings.clicksAway++;
                };
            }(this); 
            this.settings.clicksAway = Number(this.settings.scores[0]);
        } 
        */
    
class CountdownTimerLogic  extends CalculatorBase{
    endTime: Date;
    timerInterval: any;
    div: Container;
    span: Span;
    input: InputCup;
    lastEnteredValue: string;
    helpText = "Enter time in secs or mins:secs. \n Press Enter to start countdown.";

    constructor() {
        super();
    }

    createDiv(parent): Span {
        this.div = new Container(parent, "div");
        this.div.addClass("countdownTimerContainer").addClass("displayNone");
        let errorSpan = new Span(this.div, "");
        let image = new Icon(this.div, IconName.help).setAttribute("title",this.helpText);;
        this.input = new InputCup(parent, 20, image, errorSpan).addClass("countdownTimerInput");

        this.input.setEvent("onkeyup",(e) => {
            this.onKeyUp(e);
        });
        this.input.setEvent("onfocus",() => {
            this.onFocus();
        });

        this.div._childNodes = [this.input, image];
        return this.div;
    }

    //reset timer
    onFocus() {
        this.input.removeClass("red").removeClass("blink");
        if (this.lastEnteredValue) {
            this.input.setValue(this.lastEnteredValue);
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    onKeyUp(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13 && this.input.getValue()) {
            this.input.getElement(true).blur();
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            var durationString = this.input.getValue();
            this.lastEnteredValue = durationString;
            var patt = /([0-9]*):?([0-9]*)/;
            var result = patt.exec(durationString);
            let seconds = null;
            if (result[2]) { //minutes:seconds
                seconds += Number(result[2]) + 60*Number(result[1]);
            }
            else { //seconds
                seconds = Number(result[1]);
            }
            if (helpers.isNumeric(seconds)) {
                let endTime = new Date(Number(new Date()) + 1000*seconds);
                if (endTime) {
                    this.startCounting(endTime);
                }
            }
        }
    
    }

    startCounting(endTime: Date) {
        this.endTime = endTime;
        this.timerInterval = setInterval(function(timer) {
            var timer = timer;
            //REPEATS EVERY 0.9 SECONDS
            return function() {
                    timer.input.setValue(timer.timerText);
                    if (timer.isElapsed) { 
                        timer.input.addClass("red").addClass("blink");
                        clearInterval(timer.timerInterval);
                    }
                };
            }(this), 900);
    }

    get timerText() {
        if (this.isElapsed) { return "TIME UP"; }
        // get total seconds between the times
        var delta = Math.abs(Number(this.endTime) - Number(new Date())) / 1000;

        // calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;

        // what's left is seconds
        var seconds = Math.floor(delta % 60);

        return minutes.toString() + ":" + ("0" + seconds.toString()).slice(-2);
    }

    get isElapsed() {
        return Number(this.endTime) < Number(new Date());
    }
}
