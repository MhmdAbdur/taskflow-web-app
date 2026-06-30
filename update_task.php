<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($conn) && isset($mysqli)) {
    $conn = $mysqli;
}

// ADDED: Sanitize user input using trim
$id = isset($_POST['id']) ? (int)trim($_POST['id']) : null;

if (!$id) {
    echo json_encode(["success" => false, "error" => "Task ID is required."]);
    exit;
}

$updates = [];
$params = [];
$types = "";

// Check if text needs to be updated
if (isset($_POST['text']) && trim($_POST['text']) !== '') {
    $updates[] = "text = ?";
    // ADDED: htmlspecialchars and trim for sanitization
    $params[] = htmlspecialchars(trim($_POST['text']));
    $types .= "s";
}

// Check if completed status needs to be toggled
if (isset($_POST['completed'])) {
    $updates[] = "completed = ?";
    $params[] = (int)trim($_POST['completed']);
    $types .= "i";
}

if (empty($updates)) {
    echo json_encode(["success" => false, "error" => "No fields to update."]);
    exit;
}

$query = "UPDATE tasks SET " . implode(", ", $updates) . " WHERE id = ?";
$params[] = $id;
$types .= "i"; // id is integer

$stmt = $conn->prepare($query);

if ($stmt === false) {
    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
    exit;
}

// Bind parameters dynamically
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => "Execute failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
