<?php 
include('doNotUpload.php');

if ($USER == "") {
	include('user.php');
	exit();
}


?>


<!DOCTYPE html>
<html>
<head> 
	<meta charset="UTF-8"> 
	<link id="style" rel="stylesheet" type="text/css" href="css/reveal.css">
	<link id="style" rel="stylesheet" type="text/css" href="css/header.css">
	<script async src="js/acorn_interpreter.js"></script>
	<script async src="js/assignment<?php echo $DOTMIN ?>.js"></script>
	<script async src="js/reveal<?php echo $DOTMIN ?>.js"></script>

</head>
<body onload="doStuff()">

<div id="assignment"></div>

<script> 

function doStuff() { 
  
let workbookSheetString = "<?php echo $QUERY_STRING ?>";
	let user = "<?php echo $USER ?>";
	let url = "<?php echo $API_URL ?>";

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
	//check for error data
	if ("error" in data) {
		document.getElementById("assignment").innerHTML = data.error;
		return;
	}

	//console.log(data);
	var settings = new Settings(data,3); //default to student
	window.assignment = new Assignment(document.getElementById("assignment"),settings);
};

let connection = new Connection(url, user, workbookSheetString);
Connection.instance.getMarkbookSettings(onSuccess,onFail);
}
  
</script>


</body>
</html>

