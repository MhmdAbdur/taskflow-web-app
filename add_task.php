<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($conn) && isset($mysqli)) {
    $conn = $mysqli;
}

// ADDED: Sanitize user input using htmlspecialchars and trim
$text = isset($_POST['text']) ? htmlspecialchars(trim($_POST['text'])) : '';
$category = isset($_POST['category']) ? htmlspecialchars(trim($_POST['category'])) : 'Personal';
$priority = isset($_POST['priority']) ? htmlspecialchars(trim($_POST['priority'])) : 'Medium';

// Validate text is not empty
if (empty($text)) {
    echo json_encode(["success" => false, "error" => "Task text cannot be empty."]);
    exit;
}

$query = "INSERT INTO tasks (text, category, priority) VALUES (?, ?, ?)";
$stmt = $conn->prepare($query);

if ($stmt === false) {
    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
    exit;
}

// Bind parameters (s = string)
$stmt->bind_param("sss", $text, $category, $priority);

if ($stmt->execute()) {
    // Return success and the inserted ID
    echo json_encode(["success" => true, "id" => $stmt->insert_id]);
} else {
    echo json_encode(["success" => false, "error" => "Execute failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
