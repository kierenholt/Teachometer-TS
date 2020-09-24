
class MarginDiv extends Container {
    parent: QuestionDiv;
    constructor(parent, questionNumberLogic: QuestionNumberLogic, questionLogic: QuestionLogic) {
        super(parent,"div");
        this.classes.push("margin");
        if (Settings.instance.presentMode) {
            
        }
        else {
            this.classes.push("greyBackground");
        }

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
            deleteButton.addClass("deleteButton").addClass("hideOnPrint")
            .setAttribute("title","delete this question");
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
            duplicateButton.addClass("duplicateButton").addClass("hideOnPrint")
            .setAttribute("title","duplicate this question");
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
            refreshButton.addClass("refreshButton").addClass("hideOnPrint")
            .setAttribute("title","randomise this question");
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
            gridlinesButton.addClass("gridlinesButton").addClass("hideOnPrint")
            .setAttribute("title","show gridlines");
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
            spotlightButton.addClass("refreshButton").addClass("hideOnPrint")
            .setAttribute("title","pin this question");
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
        calculatorButton.addClass("calculatorButton").addClass("hideOnPrint")
        .setAttribute("title","show inline calculator");
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
            countdownButton.addClass("countdownButton").addClass("hideOnPrint")
            .setAttribute("title","show countdown timer");
            this.appendChildElement(countdownButton);
        }

        //next page button
        if (Settings.instance.pageMode) {
            let pageButton = new Icon(this,IconName.rightArrow);
            pageButton.setEvent("onclick",
                function(ql) { 
                    var ql = ql;
                    return () => { 
                        ql.hideThisAndShowNextQuestion();
                    }
                }(questionLogic)
                );
            pageButton.addClass("pageButton").addClass("hideOnPrint")
            .setAttribute("title","go to next question");
            this.appendChildElement(pageButton);
        }

    }
}