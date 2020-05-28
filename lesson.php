<?php 
// DEV SETTINGS
$MARKBOOK_GET_API = "https://script.google.com/macros/s/AKfycbylQm3yW95G8C6vmZKwQ88Id_LIPzeSr6heWCEjwlEuESgD9Emy/exec";
$USER = "teststudent3";

/*
// LIVE SETTINGS
$MARKBOOK_GET_API = "https://script.google.com/macros/s/AKfycbyZWwwBQjojbakLUe6EYICYbSFO3rOxuLz3RFmq8g/exec";

if (!isset($_COOKIE['user'])) {
  include('user.php');
  exit();
}

$USER = $_COOKIE['user'];
*/


?>

<!DOCTYPE html>
<html>
<head> 
	<meta charset="UTF-8"> 
  <LINK href="http://www.teachometer.co.uk/user/css/assignment.css" title="main" rel="stylesheet" type="text/css">

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
</head>
<body>

<div id="topbit"> 
<div class="widthLimit">
    <a href="index.php"><img src="images/icon128.png" id="logo"/></a>
    <p id="teachometer">Teachometer<br>
</div>
<p><a href="https://teachometer.co.uk/user/course.php?' . $_SERVER['QUERY_STRING'])?>" target="_blank">Go to Course page</a></p>
</div>


<body onload="doStuff()">

	<div id="assignment"></div>
  
  <script> 

  function doStuff() { 
	//DEV
	let workbookSheetString = "eyJ3IjoiMVlURmw4aEJxaWxDVDVQOUZFR29HRGFSaTUwZy1GRDRENnRxMkhPaXAwclUiLCJzIjoiMTc5NjkyMDkwMSJ9"; //DEV MARKSHEET

	/*
	//LIVE
	let workbookSheetString = "<?php echo $_SERVER['QUERY_STRING']?>";
	*/
	
	let user = "<?php echo $USER ?>";
	let url = "<?php echo $MARKBOOK_GET_API ?>"; //DEV
	let onFail = function(settings) { 
		document.getElementById("assignment").innerHTML = settings.error;
		
		if (settings.resetCookie) {
			//delete user cookie is username does not match 
			var img = document.createElement('img'); 
			img.src = "set-cookie.php"; 
			img.style.display = "none";
			document.body.appendChild(img); 
		
			setTimeout(() => {location.reload(true)}, 3000); 
		}
	};
	let onSuccess = function(data) {
		console.log(data);
		window.assignment = new Assignment(document.getElementById("assignment"),data);
	};
	Settings.getSettingsFromMarkbook(url, workbookSheetString, user, onSuccess, onFail);
  }
	  
  </script>

</body>
</html>

