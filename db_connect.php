<?php
// Database configuration for local XAMPP environment
$host = 'localhost';
$user = 'root';
$password = ''; // Default XAMPP password is an empty string
$database = 'taskapp';

// Create a connection using mysqli
$conn = new mysqli($host, $user, $password, $database);

// Check the connection
if ($conn->connect_error) {
    // Die with an error message if the connection fails
    die('Connect Error (' . $conn->connect_errno . ') ' . $conn->connect_error);
}

// Set charset to utf8
if (!$conn->set_charset('utf8')) {
    // Die with an error message if setting charset fails
    die('Error loading character set utf8: ' . $conn->error);
}

// If this file is included, $conn will be available to other scripts
?>
