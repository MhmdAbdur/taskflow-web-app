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

$query = "DELETE FROM tasks WHERE id = ?";
$stmt = $conn->prepare($query);

if ($stmt === false) {
    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
    exit;
}

// Bind the ID parameter
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => "Execute failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
