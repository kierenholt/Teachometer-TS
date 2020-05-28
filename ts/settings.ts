
enum Mode {
    "builder","lesson-student","lesson-teacher","present-teacher","preview-teacher"
}

class Settings {
    //FROM MARKSHEET - ALL OPTIONAL
    appendMode: boolean = false;
    endTime: Date = null;
    initialChecksRemaining: number = -1;
    questionJSON: string = "";
    removeHyperlinks: boolean = false;
    responses: any = [];
    shuffleQuestions: boolean = false;
    startTime: Date = null;
    seed: number = 1;
    title: string = "";
    truncateMarks: number = -1;

    //DEFAULTS DEPENDING ON MODE
    allowGridlines: boolean;
    allowRowDelete: boolean;
    allowRowDuplicate: boolean;
    allowRefresh: boolean;
    instantChecking: boolean;
    presentMode: boolean;
    sendScoresToMarksheet: boolean;
    showSolutions: boolean;
    
    //ADDED IN CONSTRUCTOR
    random: Random; //from seed
    assignment: Assignment;
    timerLogic: TimerLogic;
    sheetManager: SheetManager;
    studentPicker: StudentPickerLogic;

    static instance: Settings;

    constructor(settingsObj:any, mode:Mode) {
        if (Settings.instance) { throw "only one of instance of Settings is allowed"}
        Settings.instance = this;
        window["cupsById"] = {};
        
        for (var key in settingsObj) {this[key] = settingsObj[key]};

        this.setDefaults(mode);

        this.sheetManager = new SheetManager();
        
        //setup timer
        if (this.startTime) this.startTime = new Date(this.startTime);
        if (this.endTime) this.endTime = new Date(this.endTime);
        
        if (this.endTime) {
            this.timerLogic = new TimerLogic(this.endTime, this);
        }        

        //TEACHER settings for lesson
        if (settingsObj.studentNames) {
            this.setDefaults(Mode["lesson-teacher"]);
            this.studentPicker = new StudentPickerLogic(this, settingsObj.studentNames);

            //first student's responses will be added to existing questions
            this.responses = settingsObj.responses; //first student's responses
            this.random = new Random(Number(settingsObj.responses.Seed)); //first student name
        }
        else {
            //STUDENT SETTINGS FOR LESSON
            this.random = settingsObj.seed ? new Random(Number(settingsObj.seed)) : new Random();
        }
    }

 
    setDefaults(mode: Mode) {
//    "builder","lesson-student","lesson-teacher","present-teacher","preview-teacher"
        this.allowRowDelete =           [true,false,false,false,true][mode];
        this.allowRowDuplicate =        [true,false,false,false,true][mode];
        this.allowRefresh =             [true,false,true,true,true][mode];
        this.allowGridlines =           [false,false,false,false,true][mode];
        this.instantChecking =          [true,false,true,true,true][mode];
        this.presentMode =              [false,false,false,true,false][mode];
        this.sendScoresToMarksheet =    [false,true,false,false,false][mode];
        this.showSolutions =            [true,false,true,false,true][mode];
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