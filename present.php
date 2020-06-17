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

	<meta charset="utf-8">
	<link id="style" rel="stylesheet" type="text/css" href="css/assignment.css">
	<link id="style" rel="stylesheet" type="text/css" href="css/header.css">
	<link id="style" rel="stylesheet" type="text/css" href="css/reveal.css">
	<script src="js/assignment<?php echo $DOTMIN ?>.js"></script>
	<script async src="js/acorn_interpreter.js"></script>
	<script async src="js/reveal<?php echo $DOTMIN ?>.js"></script>
		
</html>