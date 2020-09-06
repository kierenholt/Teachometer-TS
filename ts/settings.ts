
enum Mode {
    "builder","lessonStudent","lessonTeacher","presentTeacher","previewTeacher"
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
    pageMode: boolean = false
    pageNumber: Number = 1;

    //DEFAULTS DEPENDING ON MODE
    mode: Mode
    allowGridlines: boolean;
    allowRowDelete: boolean;
    allowRowDuplicate: boolean;
    allowRefresh: boolean;
    allowPin: boolean;
    instantChecking: boolean;
    presentMode: boolean;
    sendScoresToMarksheet: boolean;
    showSolutions: boolean;
    
    //ADDED IN CONSTRUCTOR
    random: Random; //from seed
    assignment: Assignment;
    timerLogic: QuizTimerLogic;
    studentPicker: StudentPickerLogic;
    calculatorLogic : CalculatorLogic;
    countdownTimerLogic: CountdownTimerLogic;

    static instance: Settings;
    allowCountdownTimer: boolean;

    constructor(settingsObj:any, mode:Mode) {
        if (Settings.instance) { throw "only one of instance of Settings is allowed"}
        Settings.instance = this;
        window["cupsById"] = {};
        
        for (var key in settingsObj) {this[key] = settingsObj[key]};

        //MODE
        this.mode = mode;
        this.setDefaults(mode);

        this.calculatorLogic = new CalculatorLogic();
        this.countdownTimerLogic = new CountdownTimerLogic();
        
        //setup timer
        if (this.startTime) this.startTime = new Date(this.startTime);
        if (this.endTime) this.endTime = new Date(this.endTime);
        
        if (this.endTime) {
            this.timerLogic = new QuizTimerLogic(this.endTime, this);
        }        

        //TEACHER settings for lesson - overrides defaults
        if (settingsObj.studentNames) {
            this.mode = (this.mode == Mode.lessonStudent) ? Mode.lessonTeacher : Mode.presentTeacher;
            this.setDefaults(this.mode);
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
//    "builder" = 0,"lesson-student" = 1,"lesson-teacher" = 2,"present-teacher" = 3,"preview-teacher" = 4
        this.allowCountdownTimer =      [false,false,true,true,true][mode];
        this.allowRowDelete =           [true,false,false,false,true][mode];
        this.allowRowDuplicate =        [true,false,false,false,true][mode];
        this.allowRefresh =             [true,false,true,true,true][mode];
        this.allowGridlines =           [false,false,false,false,true][mode];
        this.allowPin =                 [false,true,true,false,true][mode];
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