<?php
//setcookie("user", $_SERVER['QUERY_STRING'], time() + (86400 * 365 * 5));
//setcookie("user", "teachometer@gmail.com", time() + (86400 * 365 * 5));

if ($_SERVER['QUERY_STRING'] == "") {
    setcookie ( "user" ,"", time() - 3600);
    echo "cookie reset";
}
else {
    setcookie ( "user" ,$_SERVER['QUERY_STRING'], time() + (86400 * 365 * 5));
    echo "cookie has been set to " . $_SERVER['QUERY_STRING'];
}
?>