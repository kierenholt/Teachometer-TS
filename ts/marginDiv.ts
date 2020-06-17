
class MarginDiv extends Container {
    parent: QuestionDiv;
    constructor(parent, questionNumberLogic: QuestionNumberLogic, questionLogic: QuestionLogic) {
        super(parent,"div");
        this.classes.push("margin");
        this.classes.push("greyBackground");
        
        //question number
        if (questionNumberLogic) {
            let questionNumberDiv = new Container(this,"div",[questionNumberLogic.createSpan(this)]);
            questionNumberDiv.addClass("questionNumber");
            this.appendChildElement(questionNumberDiv);
        }

        //delete button
        if (this.settings.allowRowDelete) {
            let deleteButton = new Icon(this,IconName.trash);
            deleteButton.setEvent("onclick", questionLogic.destroy.bind(questionLogic));
            deleteButton.addClass("deleteButton").addClass("hideOnPrint");
            this.appendChildElement(deleteButton);
        }

        //duplicate button
        if (this.settings.allowRowDuplicate) {
            let duplicateButton = new Icon(this,IconName.duplicate);
            duplicateButton.setEvent("onclick",
                function(ql, assignment) { 
                    var ql = ql;
                    var assignment = assignment;
                    return () => { assignment.duplicateRow(ql);}
                }(questionLogic, this.settings.assignment)
                );
            duplicateButton.addClass("duplicateButton").addClass("hideOnPrint");
            this.appendChildElement(duplicateButton);
        }

        //refresh button
        if (Settings.instance.allowRefresh && 
            (questionLogic.rowData.purpose == "template" || questionLogic.rowData.purpose == "sudoku")
            ) {
            let refreshButton = new Icon(this,IconName.refresh);
            refreshButton.setEvent("onclick",
                function(ql) { 
                    var ql = ql;
                    return () => { questionLogic.commentLogic.generateNewDollars();}
                }(questionLogic)
                );
            refreshButton.addClass("refreshButton").addClass("hideOnPrint");
            this.appendChildElement(refreshButton);
        }

        //gridlines button
        if (parent.contentDiv.gridlines.length > 0) {
            let gridlinesButton = new Icon(this,IconName.grid);
            gridlinesButton.setEvent("onclick",
                function(contentDiv) { 
                    var contentDiv = contentDiv;
                    return () => { contentDiv.toggleGridlines();}
                }(parent.contentDiv)
                );
            gridlinesButton.addClass("gridlinesButton").addClass("hideOnPrint");
            this.appendChildElement(gridlinesButton);
        }

        //pin button
        //hideAllQuestionsButOne
        if (Settings.instance.allowPin) {
            let spotlightButton = new Icon(this,IconName.pin);
            spotlightButton.setEvent("onclick",
                function(ql) { 
                    var ql = ql;
                    return () => { QuestionLogic.toggleHideAllQuestionsButOne(ql);}
                }(questionLogic)
                );
            spotlightButton.addClass("refreshButton").addClass("hideOnPrint");
            this.appendChildElement(spotlightButton);
        }

        //calculator button
        let calculatorButton = new Icon(this,IconName.calculator);
        calculatorButton.setEvent("onclick",
            function(ql) { 
                var ql = ql;
                return () => { 
                    Settings.instance.calculatorLogic.moveAfterQuestion(ql);
                }
            }(questionLogic)
            );
        calculatorButton.addClass("calculatorButton").addClass("hideOnPrint");
        this.appendChildElement(calculatorButton);

        //countdown timer
        if (Settings.instance.allowCountdownTimer) {
            let countdownButton = new Icon(this,IconName.clock);
            countdownButton.setEvent("onclick",
                function(ql) { 
                    var ql = ql;
                    return () => { 
                        Settings.instance.countdownTimerLogic.moveAfterQuestion(ql);
                    }
                }(questionLogic)
                );
            countdownButton.addClass("countdownButton").addClass("hideOnPrint");
            this.appendChildElement(countdownButton);
        }

    }
}