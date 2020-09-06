<?php
include('doNotUpload.php');
if ($USER == "") {
	include('user.php');
	exit();
}
?>

<html>
<head>
<meta charset="UTF-8"> 
	<link id="style" rel="stylesheet" type="text/css" href="css/header.css">

  <style>


div.bar {
    height: 16px; 
    width:90%; 
    font-size: 0;
    border-style: solid;
    border-width: 2px;
    border-radius: 5px;
    border-color: #999;
}
div.wrong, div.correct, div.stars, div.unanswered {
    display: inline-block; 
    height: 16px;
    }
div.wrong {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIhSURBVDjLlZPrThNRFIWJicmJz6BWiYbIkYDEG0JbBiitDQgm0PuFXqSAtKXtpE2hNuoPTXwSnwtExd6w0pl2OtPlrphKLSXhx07OZM769qy19wwAGLhM1ddC184+d18QMzoq3lfsD3LZ7Y3XbE5DL6Atzuyilc5Ciyd7IHVfgNcDYTQ2tvDr5crn6uLSvX+Av2Lk36FFpSVENDe3OxDZu8apO5rROJDLo30+Nlvj5RnTlVNAKs1aCVFr7b4BPn6Cls21AWgEQlz2+Dl1h7IdA+i97A/geP65WhbmrnZZ0GIJpr6OqZqYAd5/gJpKox4Mg7pD2YoC2b0/54rJQuJZdm6Izcgma4TW1WZ0h+y8BfbyJMwBmSxkjw+VObNanp5h/adwGhaTXF4NWbLj9gEONyCmUZmd10pGgf1/vwcgOT3tUQE0DdicwIod2EmSbwsKE1P8QoDkcHPJ5YESjgBJkYQpIEZ2KEB51Y6y3ojvY+P8XEDN7uKS0w0ltA7QGCWHCxSWWpwyaCeLy0BkA7UXyyg8fIzDoWHeBaDN4tQdSvAVdU1Aok+nsNTipIEVnkywo/FHatVkBoIhnFisOBoZxcGtQd4B0GYJNZsDSiAEadUBCkstPtN3Avs2Msa+Dt9XfxoFSNYF/Bh9gP0bOqHLAm2WUF1YQskwrVFYPWkf3h1iXwbvqGfFPSGW9Eah8HSS9fuZDnS32f71m8KFY7xs/QZyu6TH2+2+FAAAAABJRU5ErkJggg==) 
}
div.correct {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLvZPZLkNhFIV75zjvYm7VGFNCqoZUJ+roKUUpjRuqp61Wq0NKDMelGGqOxBSUIBKXWtWGZxAvobr8lWjChRgSF//dv9be+9trCwAI/vIE/26gXmviW5bqnb8yUK028qZjPfoPWEj4Ku5HBspgAz941IXZeze8N1bottSo8BTZviVWrEh546EO03EXpuJOdG63otJbjBKHkEp/Ml6yNYYzpuezWL4s5VMtT8acCMQcb5XL3eJE8VgBlR7BeMGW9Z4yT9y1CeyucuhdTGDxfftaBO7G4L+zg91UocxVmCiy51NpiP3n2treUPujL8xhOjYOzZYsQWANyRYlU4Y9Br6oHd5bDh0bCpSOixJiWx71YY09J5pM/WEbzFcDmHvwwBu2wnikg+lEj4mwBe5bC5h1OUqcwpdC60dxegRmR06TyjCF9G9z+qM2uCJmuMJmaNZaUrCSIi6X+jJIBBYtW5Cge7cd7sgoHDfDaAvKQGAlRZYc6ltJlMxX03UzlaRlBdQrzSCwksLRbOpHUSb7pcsnxCCwngvM2Rm/ugUCi84fycr4l2t8Bb6iqTxSCgNIAAAAAElFTkSuQmCC);
}
div.stars {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLlZLNS5RRFMafe9/3vjPOjI1jaKKEVH40tGgRBWEibfoPQoKkVdtoEQQF4T/QqkVtWrSTFrVsF1FgJbWpIAh1k2PNh+PrfL4f95zTQk0HHKkDD/cc7vP8uHCuEhF0q/KnmXNgGR248PZFN4/GISXMC8L89DBPV0Dp4/SsazJjrtfb9/vdxfn/BgjzY5M8Aq8nBya+V3h93vtnQHFxat4kszntJAAAxus1YvnZQV5V/jyTEZarwnwFLGeFZdT0ZFOJdD84qoCDOpQ7grZfRNj020JSEOKvwvxGiF+q0tL0N5PuO+Mk0nC0B0BDsYCCImyzAIktBBloMwKJLSgKYcMAcdhC2KpVlIig+H5qxcv0n0xmj4Gbq+BwC2wtJLbgHUlMEFJwUpMIGpto16u+kJzSACAk+WCzvNbe+AVljkOYIcQQou3TbvdOJo+g4aNdqzaF+PT43HJVA8DQpcVIiPPtaqlEUQzlDELsTpgYwgTAQIjQqlUCtpQfn1spdmxh+PJSQyw9CrbKgM7tvcISQAxlBhC3GuCYXk3cWP25m3M7dk88qbWBRDVApaATOSjPBdXXwYEP5QyCgvjE/kwHgInHtHYBnYA2owhrPiiuw0sOw3EZFEagIB7qChDiYaUcNIoFtP1KxCTPhWiDw7WbXk9vKpnOgsI4exjg6Mbq96YQPxm79uPOvqvbXx4O3KrF6w8osv2df17kr5YXJq7vnw/S0v3k7Ie7xtud/wAaRnP+Cw8iKQAAAABJRU5ErkJggg==)
}
table#para td.link { 
    width: 30%;
}
table#para td.bar { 
    width: 50%;
    height: 1px; 
}
table#para td.status { 
}
table#para {
    width: 90%;
    margin: auto;
}


</style>
</head>
    <body>

<div id="topbit"> 
<div class="widthLimit">
    <a href="index.php"><img src="images/icon128.png" id="logo"/></a>
    <p id="teachometer">Teachometer<br>
</div>
</div>

        <p><h1> Course list </h1></p>
        <div id="teacherDiv"></div>
        <table id="para"></table>

        <h2>Key</h2>
        <h3>Deadlines</h3>
        <p>
        ☀️: You have completed the quiz before the deadline or today is before the deadline<br>
        🌙: You did not complete the quiz before the deadline<br> 
        </p>
        <h3>Passmarks</h3>
        <p>
        ✔️: You have passed on at least one occasion<br>
        ❌: You have not passed on a single occasion<br>
        📖: You have visited the page. A passmark was not set.<br>
        📓: You have not visited the page.<br>
        </p>
        <script>

function dateString(d) {
    d = new Date(d); 
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + months[d.getMonth()];
}
function statusDescriptions(row) {
    switch(row.statusRank) {
        case 32: return `you passed on ${dateString(row.timestamp)} which was before the deadline (${dateString(row.deadline)}) - well done! The passmark was ${row["pass mark"]}`;
        case 22: return `you failed on all attempts but it is still before the deadline (${dateString(row.deadline)}). The passmark is ${row["pass mark"]}`;
        case 12: return `you visited the page on ${dateString(row.timestamp)} before the deadline (${dateString(row.deadline)}). no passmark was set.`;
        case 2:  return `you have not yet visited the page but it is still before the deadline (${dateString(row.deadline)}).`;
        case 31: return `you passed on ${dateString(row.timestamp)} after the deadline (${dateString(row.deadline)}). The passmark was ${row["pass mark"]}`;
        case 21: return `you failed on all attempts and it is after the deadline (${dateString(row.deadline)}). The passmark is ${row["pass mark"]}`;
        case 11: return `you first visited the page on ${dateString(row.timestamp)} after the deadline (${dateString(row.deadline)}). no passmark was set`;
        case 1:  return `you have not yet visited the page and it is after the deadline (${dateString(row.deadline)})`;
        case 30: return `you passed - well done! no deadline was set. The passmark was ${row["pass mark"]}`;
        case 20: return `you failed on all attempts. no deadline was set. The passmark is ${row["pass mark"]}`;
        case 10: return `you visited the page. no deadline was set.`;
        case 0:  return `you have not yet visited this page. no deadline was set.`;
    }
 };


var statusIcons = {
    32:"☀️✔️",
    22:"☀️❌",
    12:"☀️📖",
    2:"☀️📓",
    31:"🌙✔️",
    21:"🌙❌",
    11:"🌙📖",
    1:"🌙📓",
    30:"✔️",
    20:"❌",
    10:"📖",
    0:"📓",
}

function comboChange() {
    var object = {
        "action": "getCourseData", 
        "workbookSheetString" : "<?php echo $QUERY_STRING?>",
        "user" : document.getElementById("teacherCombo").value
    };
    sendRequestAndFail("<?php echo $API_URL ?>", object, fillTable, onFail);
}

function onFail() {

}

function init(sheets) {
        //console.log(sheets);
    if (sheets["usernames"]) { //teacher mode
        var teacherDiv = document.getElementById("teacherDiv");
        teacherDiv.innerHTML = `<select onchange="comboChange()" id="teacherCombo"> 
        ${sheets["usernames"].map((u) => {
            return `<option value="${u}">${u}</option>`;
        }).join(" ")}
        </select>`;
    }
    else { //student mode
        fillTable(sheets);
    }
}

function fillTable(sheets) {
    var table = document.getElementById("para");
    table.innerHTML = "";
    for (var i = 0; i < sheets.length; i++) {
        var row = table.insertRow(0);
        
        //cell 0
        var linkCell = row.insertCell(0);
        linkCell.classList.add("link");
        linkCell.innerHTML=`<a href="${sheets[i].url}" >${sheets[i].name}</a>`;
        
        //cell 1
        var barCell = row.insertCell(1);
        barCell.classList.add("bar");
        if (sheets[i]["% Correct"] == "") {
            barCell.innerHTML="<span style='font-size: small'> page not yet visited</span>";
        }
        else {
            let wrong = sheets[i]["% Attempted"] - sheets[i]["% Correct"];
            barCell.innerHTML=`
<div class="bar">
<div title="${sheets[i]["% Stars"]}% stars (correct first time)" class="stars" style="width:${sheets[i]["% Stars"]}%"></div>
<div title="${sheets[i]["% Correct"]-sheets[i]["% Stars"]}% correct (excluding stars)" class="correct" style="width:${sheets[i]["% Correct"]-sheets[i]["% Stars"]}%"></div>
<div title="${wrong}% wrong" class="wrong" style="width:${wrong}%"></div>
</div>
`;
        }


        //cell 2
        var statusCell = row.insertCell(2);
        statusCell.classList.add("status");
        statusCell.innerHTML=`<span title="${statusDescriptions(sheets[i])}">${statusIcons[sheets[i].statusRank]}</span>`;   
    }
}


    //Usage: sendObject(object,(data) => console.log(data));
function sendRequestAndFail(url, object, onSuccess, onFail) {
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

        </script>
        <script src="<?php echo $API_URL ?>?action=getCourseData&workbookSheetString=<?php echo $QUERY_STRING?>&user=<?php echo $USER?>&prefix=init"></script>
        
    </body>
</html>