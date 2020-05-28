<?php 
$MARKBOOK_GET_API = "https://script.google.com/macros/s/AKfycbyZWwwBQjojbakLUe6EYICYbSFO3rOxuLz3RFmq8g/exec";
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
   <p id="errorMessage" style="color:red;"></p>
   <br>
   <button onclick="storeUserName()">OK</button>
    </p>
    
    <script>

    document.getElementById("userNameInput").addEventListener("keyup", function(event) {
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        storeUserName();
      }
    });

    function callback(result) {
        if (result) { //if user not found result == null

            //set cookie
            var img = document.createElement('img'); 
            img.src = "set-cookie.php?" + document.getElementById("userNameInput").value; 
            img.style.display = "none";
            document.body.appendChild(img); 

            setTimeout(function() {location.reload(true);}, 1000); //small delay to allow cookie to be set
        }
        else {
            document.getElementById("errorMessage").innerHTML += "user not found<br>";
        }
    }

    function storeUserName() {
        var user = document.getElementById("userNameInput").value;
        if (user) {
            var s = document.createElement("script");
            //get markbook settings then call callback()
            s.src = "<?php echo $MARKBOOK_GET_API ?>?action=getMarkbookSettings&workbookSheetString=<?php echo $_SERVER['QUERY_STRING']?>&user=" + encodeURIComponent(user) + "&prefix=callback";
            document.body.appendChild(s);
        }
      }

    </script>
  </body>
</html>


