class Connection {

    workbookSheetString: string; //from php
    user: string; //from cookie
    url: string;
    static instance: Connection;

    constructor(url, user, workbookSheetString) {
        Connection.instance = this;
        this.url = url;
        this.user = user;
        this.workbookSheetString = workbookSheetString;
    }

    getMarkbookSettings(onSuccess, onFail, userOverride?) {
        var data = { 
            action : "getMarkbookSettings", 
            workbookSheetString : this.workbookSheetString, 
            user : userOverride ? userOverride : this.user };
        this.sendRequestAndFail(this.url, data, onSuccess, onFail);
    }
        
    checkRequest(onSuccess, onRetry) {
        var object = {
            "action": "checkRequest", 
            "workbookSheetString" : this.workbookSheetString,
            "user" : this.user,
            "startTimeAsNumber": Number(Settings.instance.startTime)
        };
        this.sendRequestAndRetry(this.url, object, onSuccess, onRetry)
    }

    pageRequest(onSuccess) {
        var object = {
            "action": "pageRequest", 
            "workbookSheetString" : this.workbookSheetString,
            "user" : this.user,
            "startTimeAsNumber": Number(Settings.instance.startTime)
        };
        this.sendRequestAndFail(this.url, object, onSuccess, () => {})
    }

    writeToSheet(onSuccess, onRetry, scores) {
        var object = {
            "action" : "writeToSheet",
            "workbookSheetString" : this.workbookSheetString,
            "user" : this.user,
            "startTimeAsNumber": Number(Settings.instance.startTime),
            "scores" : JSON.stringify(scores)
            };
        this.sendRequestAndRetry(this.url, object, onSuccess, onRetry)
    }

    //Usage: sendObject(object,(data) => console.log(data));
    sendRequestAndFail(url, object, onSuccess, onFail?) {
        var queryString = "?";
        for (var key in object) {
            queryString += key + "=" + encodeURIComponent(object[key]) + "&";
        }
        let scriptElement = document.createElement("script");
        scriptElement.type = 'text/javascript';
        scriptElement.onerror = function (scriptElement, onFail) {
            var onFail = onFail;
            var scriptElement = scriptElement;
            return (data) => {
                if (onFail) onFail(data);
                document.body.removeChild(scriptElement);
            }
        }(scriptElement, onFail);
        let random = Math.random().toString().substring(2);
        window["callback"] = function (scriptElement, onSuccess) {
            var scriptElement = scriptElement;
            var onSuccess = onSuccess;
            return (data) => {
                onSuccess(data);
                document.body.removeChild(scriptElement);
            };
        }(scriptElement, onSuccess);
        scriptElement.src = url + queryString + "prefix=callback";
        document.body.appendChild(scriptElement);
    }

    //Usage: sendObject(object,(data) => console.log(data));
    sendRequestAndRetry(url, object, onSuccess, onRetry?) {
        var queryString = "?";
        for (var key in object) {
            queryString += key + "=" + encodeURIComponent(object[key]) + "&";
        }
        let scriptElement = document.createElement("script");
        scriptElement.type = 'text/javascript';
        scriptElement.onerror = function (connection, object, onSuccess, scriptElement, onRetry) {
            var connection = connection;
            var object = object;
            var onSuccess = onSuccess;
            var scriptElement = scriptElement;
            var onRetry = onRetry;
            return (data) => {
                if (onRetry) onRetry(data);
                document.body.removeChild(scriptElement);
                setTimeout(() => connection.sendRequestAndRetry(url, object, onSuccess, onRetry), 1000);
            }
        }(this, object, onSuccess, scriptElement, onRetry);
        let random = Math.random().toString().substring(2);
        window["callback"] = function (scriptElement, onSuccess) {
            var scriptElement = scriptElement;
            var onSuccess = onSuccess;
            return (data) => {
                onSuccess(data);
                scriptElement.remove();
            };
        }(scriptElement, onSuccess);
        scriptElement.src = url + queryString + "prefix=callback";
        document.body.appendChild(scriptElement);
    }

}