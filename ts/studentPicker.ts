class StudentPickerLogic {
    settings: Settings;
    combo: ComboCup;
    studentNames: string[];

    constructor(settings: Settings, studentNames: string[]) {
        this.settings = settings;
        this.studentNames = studentNames;
    }

    createCombo(parent) {
        this.combo = new ComboCup(parent, [], 
            new Icon(parent, IconName.none),
            new Span(parent,""));
        this.combo._childNodes = this.studentNames.map(s => {
            return new OptionCup(this.combo,s,false);
        });
        this.combo.setOnClickAway(this.comboClick.bind(this));
        return this.combo;
    }

    comboClick() {
        this.combo.errorText.innerHTML = "";
        let student = this.combo.getValue();
        console.log(student);
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