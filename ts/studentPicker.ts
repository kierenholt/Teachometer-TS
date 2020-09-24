class StudentPickerLogic {
    settings: Settings;
    combo: ComboCup;
    div: Container;
    studentNames: string[];
    NUMBER_CHARACTERS_VISIBLE = 10; //number of characters in student name, 
    //the rest chopped off to hide confidential info

    constructor(settings: Settings, studentNames: string[]) {
        this.settings = settings;
        this.studentNames = studentNames;
    }

    createDiv(parent) {
        this.div = new Container(parent, "div");
        let teachermodeNotice = new Span(this.div, "teacher mode enabled. Pick a student to view their questions.").addClass("red");
        this.combo = new ComboCup(this.div, [], 
            new Icon(parent, IconName.none),
            new Span(parent,"")).addClass("studentPicker");
        this.combo._childNodes = this.studentNames.map(s => {
            let text = (s.length > this.NUMBER_CHARACTERS_VISIBLE) ? s.substr(0,this.NUMBER_CHARACTERS_VISIBLE)+"..." : s;
            return new OptionCup(this.combo,s,text,false);
        });
        this.combo.setOnClickAway(this.comboClick.bind(this));
        this.div._childNodes = [teachermodeNotice, this.combo];
        return this.div;
    }

    comboClick() {
        this.combo.errorText.innerHTML = "";
        let student = this.combo.getValue();
        let onRetry = (data) => { 
            this.combo.errorText.innerHTML = "connection error...please try again";
        };
        
        Connection.instance.getMarkbookSettings(this.updateUser.bind(this),onRetry,student);
    }

    updateUser(markbookSettings) {
        this.combo.errorText.innerHTML = "";
        if (markbookSettings && markbookSettings.responses && markbookSettings.responses.Seed) {
            let seed = markbookSettings.responses.Seed;

            Settings.instance.random = new Random(seed);
            Settings.instance.assignment.resetQuestionOrder();
            if (Settings.instance.shuffleQuestions) Settings.instance.assignment.shuffle(true);
            Settings.instance.assignment.regenerateAllQuestions();
        }
        else {
            throw "seed not found";
        }
    }
}