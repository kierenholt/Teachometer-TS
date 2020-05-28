<?php 
$MARKBOOK_GET_API = "https://script.google.com/macros/s/AKfycbylQm3yW95G8C6vmZKwQ88Id_LIPzeSr6heWCEjwlEuESgD9Emy/exec";

if (!isset($_COOKIE['user'])) {
  include('user-dev.php');
  exit();
}

$USER = $_COOKIE['user'];
?>

<!DOCTYPE html>
<html>
<head> 
	<meta charset="UTF-8"> 
  <LINK href="include/lessonstyle.css" title="main" rel="stylesheet" type="text/css">
    <title> Student report for <?php echo $USER?></title>

  <style>
div#topbit {
    width: 100%;
    background-image: url(stripeBG.gif);
    height: 50px;
}
div#topbit p {
    clear: none;
}


p#teachometer {
    display: block;
    float: right;
    color: #373748;
    font-size: 30px;
    margin: 9px 10px 0 0;
  text-shadow: 2px 2px 5px #fff;
}

img#logo {
    float: right;
    height: 50px;
}
</style>

<script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0"></script>

</head>
<body>

<div id="topbit"> 
<div class="widthLimit">
    <a href="index.php"><img src="images/icon128.png" id="logo"/></a>
    <p id="teachometer">Teachometer<br>
</div>
</div>
	
  <p><h1 id="titleH1"></h1></p>
  <div style="width: 800px; height: 600px; margin: auto">
    <canvas id="myChart"></canvas>
  </div>

  
<script>


function init(reportData) { //this is how it likes to be used. it doesnt like strings for data or arrays for scores

  //bad username
  if (reportData == null) {
    //delete user cookie

    var img = document.createElement('img'); 
    img.src = "set-cookie.php"; 
    img.style.display = "none";
    document.body.appendChild(img); 

    location.reload(true);
  }


  //plot chart https://www.chartjs.org/docs/latest/getting-started/
  //https://www.chartjs.org/docs/latest/charts/line.html
var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: Object.keys(reportData),
        datasets: [
            
            {
            label: 'Correct %',
            backgroundColor: '#0f0',
            borderColor: '#0f0',
            data: Object.values(reportData).map(f => f["% Correct"]),
            lineTension: 0,
            fill: false
            },

            {
            label: 'Stars %',
            backgroundColor: '#ff0',
            borderColor: '#ee0',
            data: Object.values(reportData).map(f => f["% Stars"]),
            lineTension: 0,
            fill: false
            },
            
            {
            label: 'Attempted %',
            backgroundColor: '#ccc',
            borderColor: '#ccc',
            data: Object.values(reportData).map(f => f["% Attempted"]),
            lineTension: 0,
            fill: false
            }
        ]
    },

    // Configuration options go here
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }]
        }
    }
});
            
}
    
</script>
<script src="<?php echo $MARKBOOK_GET_API ?>?action=getStudentReport&workbookSheetString=<?php echo $_SERVER['QUERY_STRING']?>&user=<?php echo urlencode($USER) ?>&prefix=init"></script>


</body>
</html>

