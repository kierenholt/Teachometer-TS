<?php 
$MARKBOOK_GET_API = "https://script.google.com/macros/s/AKfycbylQm3yW95G8C6vmZKwQ88Id_LIPzeSr6heWCEjwlEuESgD9Emy/exec";
?>
<html>
<head>
<meta charset="UTF-8"> 
  <LINK href="include/lessonstyle.css" title="main" rel="stylesheet" type="text/css">

  <style>
div#topbit {
    width: 100%;
    background-image: url(stripeBG.gif);
    height: 100px;
}
div#topbit p {
    clear: none;
}


p#teachometer {
    display: block;
    float: right;
    color: #373748;
    font-size: 30px;
    margin: 35px 10px 0 0;
  text-shadow: 2px 2px 5px #fff;
}

img#logo {
    float: right;
    height: 100px;
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

        <p><h1> Lessons </h1></p>
        <table id="para"></table>

        <script>

            function doStuff(sheets) {
                var table = document.getElementById("para");
                for (var i = 0; i < sheets.length; i++) {
                    var row = table.insertRow(0);
                    row.insertCell(0).innerHTML=`<a href="${sheets[i].url}" >${sheets[i].name}</a>`;
                }
            }

        </script>
        <script src="<?php echo $MARKBOOK_GET_API ?>?action=getSheetUrls&workbookSheetString=<?php echo $_SERVER['QUERY_STRING']?>&prefix=doStuff"></script>
        
    </body>
</html>