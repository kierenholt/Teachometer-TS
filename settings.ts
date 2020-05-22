


class Settings {
    //FROM MARKSHEET
    appendMode: boolean;
    endTime: Date;
    initialChecksRemaining: number;
    presentMode: boolean
    questionJSON: string;

    removeHyperlinks: boolean;
    responses: any;
    shuffleQuestions: boolean;
    startTime: Date;
    title: string;
    
    truncateMarks: number;

    //OTHER
    allowGridlines: boolean;
    allowRowDelete: boolean;
    allowRowDuplicate: boolean;
    allowRefresh: boolean;

    //ADDED AFTER CONSTRUCTOR
    //AFTER GETTING DATA FROM SERVER E.G QUERYSTRING
    writeToSheet: any; 
    checkRequest: any; // returns number of checks on server
    user: any; //from cookie
    random: Random; //from seed data - user and startDate
    
    //ADDED IN CONSTRUCTOR
    seedObject: any; // - used to create random
    assignment: Assignment;
    timerLogic: TimerLogic;
    sheetManager: SheetManager;

    constructor(settingsObj:any) {
        window["cupsById"] = {};
        
        for (var key in settingsObj) {this[key] = settingsObj[key]};
        
        //sheetManager
        if (this.writeToSheet) {
            this.sheetManager = new SheetManager(this);
        }

        //overridden when settings are taken from markbook
        this.random = new Random();
        
        //setup timer
        if (this.endTime) {
            this.timerLogic = new TimerLogic(this.endTime, this);
        }        
    }

    static getSettingsFromMarkbook(url, workbookSheetString, user, onSuccess, onFail) {
        
        var addStuffToSettings = function(markbookSettings: any) {

            //check for error data
            if ("error" in markbookSettings) {
                onFail(markbookSettings["error"]);
                return;
            }

            //add functions
            var settings = new Settings(markbookSettings);
            settings.checkRequest = (onSuccess, onRetry) => {
					var object = {
                        "action": "echo", 
                        "workbookSheetString" : workbookSheetString,
                        "user" : user,
                        "startTime": settings.startTime,
                        "returnValue": 1
                    };
					helpers.sendRequestAndRetry(url, object, onSuccess, onRetry)
				};
            settings.writeToSheet = (onSuccess, onRetry, scores) => {
                var object = {
                    "action" : "writeToSheet",
                    "workbookSheetString" : workbookSheetString,
                    "user" : user,
                    "startTime": settings.startTime,
                    "scores" : JSON.stringify(scores)
                    };
                helpers.sendRequestAndRetry(url, object, onSuccess, onRetry)
            };
            settings.allowRowDelete = false;
            settings.allowRowDuplicate = false;
            settings.allowRefresh = false;
            settings.allowGridlines = false;
            settings.user = user;
            settings.random = new Random(helpers.objToHash([user, markbookSettings.startTime]));
            onSuccess(settings);
        };

        var data = { 
            action : "getMarkbookSettings", 
            workbookSheetString : workbookSheetString, 
            user : user };
        helpers.sendRequestAndFail(url, data, addStuffToSettings, onFail);
        return;
    }

    get totalStars() {
        return ScoreLogic.instances.reduce((a, b) => a + b.stars, 0);
    }

    get totalAttempted() {
        return ScoreLogic.instances.reduce((a, b) => a + b.attempted, 0);
    }

    get totalOutOf() {
        return ScoreLogic.instances.reduce((a, b) => a + b.outOf, 0);
    }

    get totalCorrect() {
        return ScoreLogic.instances.reduce((a, b) => a + b.score, 0);
    }

    get totalScores() {
        return {
            "Correct":{"value":this.totalCorrect},
            "Attempted":{"value":this.totalAttempted},
            "Stars":{"value":this.totalStars},
            "Out of":{"value":this.totalOutOf}
        };
    }

    disableAllInputs() {
        CommentLogic.instances.forEach(c => c.disable());
    }
}