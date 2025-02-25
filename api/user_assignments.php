<?php
// Abilita il reporting degli errori per il debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS headers - accetta richieste da localhost:3000
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost:3000'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache per 1 giorno
    }
}

// Gestione richieste OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    exit(0);
}

header('Content-Type: application/json');

include 'config.php';
require_once 'auth_functions.php';

$method = $_SERVER['REQUEST_METHOD'];

// Verifica autenticazione
$userData = authMiddleware($conn);
if (!$userData) {
    exit();
}

// Solo gli amministratori possono gestire tutte le assegnazioni 
$isAdmin = hasRole($userData, 'admin');

switch($method) {
    case 'GET':
        if (isset($_GET['user_id'])) {
            // Verifica permessi: solo admin può vedere assegnazioni di altri utenti
            $requestedUserId = intval($_GET['user_id']);
            if (!$isAdmin && $requestedUserId != $userData['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Non hai i permessi per visualizzare le assegnazioni di altri utenti']);
                exit();
            }
            getUserAssignments($conn, $requestedUserId);
        } else {
            // Utenti normali vedono solo le proprie assegnazioni
            if ($isAdmin) {
                getAllAssignments($conn);
            } else {
                getUserAssignments($conn, $userData['user_id']);
            }
        }
        break;
        
    case 'POST':
        // Solo admin può creare assegnazioni
        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(['error' => 'Solo gli amministratori possono creare assegnazioni']);
            exit();
        }
        createAssignment($conn);
        break;
        
    case 'PUT':
        // Solo admin può modificare assegnazioni
        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(['error' => 'Solo gli amministratori possono modificare assegnazioni']);
            exit();
        }
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID assegnazione mancante']);
            exit();
        }
        updateAssignment($conn, $_GET['id']);
        break;
        
    case 'DELETE':
        // Solo admin può eliminare assegnazioni
        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(['error' => 'Solo gli amministratori possono eliminare assegnazioni']);
            exit();
        }
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID assegnazione mancante']);
            exit();
        }
        deleteAssignment($conn, $_GET['id']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo non consentito']);
}

function getAllAssignments($conn) {
    try {
        $result = $conn->query("
            SELECT a.*, u.username, u.email, s.nome as scheda_nome
            FROM user_workout_assignments a
            JOIN users u ON a.user_id = u.id
            JOIN schede s ON a.scheda_id = s.id
            ORDER BY a.assigned_date DESC
        ");

        $assignments = [];
        while ($row = $result->fetch_assoc()) {
            $assignments[] = $row;
        }
        
        echo json_encode($assignments);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nel recupero delle assegnazioni: ' . $e->getMessage()]);
    }
}

function getUserAssignments($conn, $userId) {
    try {
        $stmt = $conn->prepare("
            SELECT a.*, s.nome as scheda_nome, s.descrizione as scheda_descrizione
            FROM user_workout_assignments a
            JOIN schede s ON a.scheda_id = s.id
            WHERE a.user_id = ?
            ORDER BY a.active DESC, a.assigned_date DESC
        ");
        
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $assignments = [];
        while ($row = $result->fetch_assoc()) {
            $assignments[] = $row;
        }
        
        echo json_encode($assignments);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nel recupero delle assegnazioni: ' . $e->getMessage()]);
    }
}

function createAssignment($conn) {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validazione dati
        if (!isset($data['user_id']) || !isset($data['scheda_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id e scheda_id sono obbligatori']);
            return;
        }
        
        // Verifica che l'utente esista
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->bind_param("i", $data['user_id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Utente non trovato']);
            return;
        }
        
        // Verifica che la scheda esista
        $stmt = $conn->prepare("SELECT id FROM schede WHERE id = ?");
        $stmt->bind_param("i", $data['scheda_id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Scheda non trovata']);
            return;
        }
        
        // Verifica se esiste già un'assegnazione per questo utente e scheda
        $stmt = $conn->prepare("
            SELECT id FROM user_workout_assignments 
            WHERE user_id = ? AND scheda_id = ?
        ");
        $stmt->bind_param("ii", $data['user_id'], $data['scheda_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $existingId = $result->fetch_assoc()['id'];
            // Aggiorna l'assegnazione esistente invece di crearne una nuova
            $stmt = $conn->prepare("
                UPDATE user_workout_assignments 
                SET active = ?, expiry_date = ?, notes = ?
                WHERE id = ?
            ");
            
            $active = isset($data['active']) ? (int)$data['active'] : 1;
            $expiryDate = isset($data['expiry_date']) ? $data['expiry_date'] : null;
            $notes = isset($data['notes']) ? $data['notes'] : '';
            
            $stmt->bind_param("issi", $active, $expiryDate, $notes, $existingId);
            
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            
            echo json_encode([
                'message' => 'Assegnazione aggiornata con successo',
                'id' => $existingId,
                'updated' => true
            ]);
            return;
        }
        
        // Inserisci la nuova assegnazione
        $stmt = $conn->prepare("
            INSERT INTO user_workout_assignments 
            (user_id, scheda_id, active, expiry_date, notes)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $active = isset($data['active']) ? (int)$data['active'] : 1;
        $expiryDate = isset($data['expiry_date']) ? $data['expiry_date'] : null;
        $notes = isset($data['notes']) ? $data['notes'] : '';
        
        $stmt->bind_param("iiiss", 
            $data['user_id'], 
            $data['scheda_id'],
            $active,
            $expiryDate,
            $notes
        );
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        $newId = $stmt->insert_id;
        
        echo json_encode([
            'message' => 'Assegnazione creata con successo',
            'id' => $newId
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nella creazione dell\'assegnazione: ' . $e->getMessage()]);
    }
}

function updateAssignment($conn, $id) {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Verifica che l'assegnazione esista
        $stmt = $conn->prepare("SELECT id FROM user_workout_assignments WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Assegnazione non trovata']);
            return;
        }
        
        // Costruisci la query di aggiornamento in base ai campi forniti
        $updates = [];
        $params = [];
        $types = "";
        
        if (isset($data['active'])) {
            $updates[] = "active = ?";
            $params[] = (int)$data['active'];
            $types .= "i";
        }
        
        if (isset($data['expiry_date'])) {
            $updates[] = "expiry_date = ?";
            $params[] = $data['expiry_date'];
            $types .= "s";
        }
        
        if (isset($data['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $data['notes'];
            $types .= "s";
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nessun campo da aggiornare']);
            return;
        }
        
        $query = "UPDATE user_workout_assignments SET " . implode(", ", $updates) . " WHERE id = ?";
        $params[] = $id;
        $types .= "i";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        echo json_encode([
            'message' => 'Assegnazione aggiornata con successo',
            'id' => $id
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nell\'aggiornamento dell\'assegnazione: ' . $e->getMessage()]);
    }
}

function deleteAssignment($conn, $id) {
    try {
        // Verifica che l'assegnazione esista
        $stmt = $conn->prepare("SELECT id FROM user_workout_assignments WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Assegnazione non trovata']);
            return;
        }
        
        // Elimina l'assegnazione
        $stmt = $conn->prepare("DELETE FROM user_workout_assignments WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        echo json_encode(['message' => 'Assegnazione eliminata con successo']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nell\'eliminazione dell\'assegnazione: ' . $e->getMessage()]);
    }
}

$conn->close();
?>