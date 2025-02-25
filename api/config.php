<?php
$servername = "192.168.1.113";
$username = "ElBibo";
$password = "Groot00";
$dbname = "Workout";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>