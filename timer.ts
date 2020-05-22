
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
    
class TimerLogic {
    endTime: Date;
    timerInterval: any;
    div: Container;
    span: Span;
    settings: Settings;
    constructor(endTime: Date, settings: Settings) {
        this.endTime  = endTime;
        this.settings = settings;
    }

    createDiv(parent): Span {
        this.div = new Container(parent, "div");
        this.div.addClass("timer");
        this.span = new Span(this.div,"");
        this.div.appendChildElement(this.span);
        this.timerInterval = setInterval(function(timer) {
            
            var timer = timer;
            //REPEATS EVERY 0.9 SECONDS
            return function() {
                    timer.span.innerHTML = timer.timerText;
                    if (timer.isElapsed) { 
                        timer.div.addClass("red");
                        clearInterval(timer.timerInterval); 
                        timer.settings.disableAllInputs()
                    }
                };
            }(this), 900);
        return this.div;
    }

    get timerText() {
        if (this.isElapsed) { return "TIME EXPIRED"; }
        // get total seconds between the times
        var delta = Math.abs(this.endTime.valueOf() - new Date().valueOf()) / 1000;

        // calculate (and subtract) whole days
        var days = Math.floor(delta / 86400);
        var daysString = days == 0 ? "" : days.toString() + " d ";
        delta -= days * 86400;

        // calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        var hoursString = hours == 0 ? "" : hours.toString() + " h ";
        delta -= hours * 3600;

        // calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        var minutesString = minutes.toString() + " m ";
        delta -= minutes * 60;

        // what's left is seconds
        var seconds = Math.floor(delta % 60);  // in theory the modulus is not required
        var secondsString = seconds.toString() + " s";

        return daysString + hoursString + minutesString + secondsString;
    }

    get isElapsed() {
        return this.endTime.valueOf() < new Date().valueOf();
    }
}
