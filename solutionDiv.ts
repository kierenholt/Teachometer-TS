class SolutionDiv extends Container {
    questionNumberLogic: QuestionNumberLogic;

    constructor(parent: Container, 
            questionNumberLogic: QuestionNumberLogic,
            commentLogic: CommentLogic) {
        super(parent, "div");
        this.classes.push("solution");
        if (commentLogic) {
            //questionNumber and letter
            commentLogic.createAndAppendSolutions(this, questionNumberLogic);
        }
    }

}