<?php
include('doNotUpload.php');
?>

<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>
  <h1>We haven't seen you here before. Please enter your username</h1>
  <p>
    Please enter the username assigned by your teacher<input type="text" id="userNameInput"/>
    <br>
    <p> HINT: <span id="userNameHint"></span></p>
    <p id="errorMessage" style="color:red;"></p>
    <br>
    <button onclick="checkUserName()">OK</button>
  </p>
    
    <script>

    document.getElementById("userNameInput").addEventListener("keyup", function(event) {
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        checkUserName();
      }
    });

    function init(result) {
      console.log(result);
      document.getElementById("userNameHint").innerHTML = result["userHint"];
      window["isInHashes"] = function(hashes) {
        var hashes = hashes;
        return function(userHash) {
          return hashes.indexOf(userHash) != -1;
        }
      }(result["userHashes"]);
    }


    function checkUserName(user) {
      var user = document.getElementById("userNameInput").value;
      var result = isInHashes(stringToHash(user));
      if (result) { //if user not found result == null

        //set cookie
        var img = document.createElement('img'); 
        img.src = "set-cookie.php?" + user; 
        img.style.display = "none";
        document.body.appendChild(img); 

        setTimeout(function() {location.reload(true);}, 1000); //small delay to allow cookie to be set
      }
      else {
        document.getElementById("errorMessage").innerHTML += "user not found<br>";
      }
    }


    function stringToHash(str) {
      let hash = 34898410941;
      if (str.length == 0) {
          return hash;
      }
      for (var i = 0; i < str.length; i++) {
          var char = str.charCodeAt(i);
          hash = ((hash<<5)-hash)+char;
          hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    } 
    </script>
    <script src="<?php echo $API_URL ?>?action=getUserHashesAndHint&workbookSheetString=<?php echo $QUERY_STRING ?>&prefix=init"></script>

  </body>
</html>


