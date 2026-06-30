<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

// In case the db_connect uses $mysqli instead of $conn
if (!isset($conn) && isset($mysqli)) {
    $conn = $mysqli;
}

// Base query
$query = "SELECT * FROM tasks WHERE 1=1";
$params = [];
$types = "";

// Filter by category if provided
if (isset($_GET['category']) && trim($_GET['category']) !== '') {
    $query .= " AND category = ?";
    // ADDED: htmlspecialchars and trim for sanitization
    $params[] = htmlspecialchars(trim($_GET['category']));
    $types .= "s";
}

// Filter by status if provided
if (isset($_GET['completed']) && trim($_GET['completed']) !== '') {
    $query .= " AND completed = ?";
    // ADDED: trim for sanitization
    $params[] = (int)trim($_GET['completed']);
    $types .= "i";
}

$query .= " ORDER BY created_at DESC";

// Prepare the statement
$stmt = $conn->prepare($query);
if ($stmt === false) {
    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
    exit;
}

// Bind parameters dynamically
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

// Execute the query
if ($stmt->execute()) {
    $result = $stmt->get_result();
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    echo json_encode(["success" => true, "data" => $tasks]);
} else {
    echo json_encode(["success" => false, "error" => "Execute failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
