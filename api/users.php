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

// Verifica autenticazione e ruolo amministratore
$user = authMiddleware($conn, ['admin']);
if (!$user) {
    exit();
}

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getUserById($conn, $_GET['id']);
        } else {
            getAllUsers($conn);
        }
        break;
        
    case 'POST':
        createUser($conn);
        break;
        
    case 'PUT':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID utente mancante']);
            break;
        }
        updateUser($conn, $_GET['id']);
        break;
        
    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID utente mancante']);
            break;
        }
        deleteUser($conn, $_GET['id']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo non consentito']);
}

function getAllUsers($conn) {
    try {
        $result = $conn->query("
            SELECT u.id, u.username, u.email, u.name, u.role_id, 
                   u.active, u.last_login, u.created_at, r.name as role_name
            FROM users u
            JOIN user_role r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        ");

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        echo json_encode($users);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nel recupero degli utenti: ' . $e->getMessage()]);
    }
}

function getUserById($conn, $id) {
    try {
        $stmt = $conn->prepare("
            SELECT u.id, u.username, u.email, u.name, u.role_id, 
                   u.active, u.last_login, u.created_at, r.name as role_name
            FROM users u
            JOIN user_role r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'Utente non trovato']);
            return;
        }
        
        echo json_encode($user);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nel recupero dell\'utente: ' . $e->getMessage()]);
    }
}

function createUser($conn) {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Validazione dati
        $required = ['username', 'password', 'email', 'role_id'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo '$field' obbligatorio"]);
                return;
            }
        }
        
        // Verifica se lo username esiste già
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->bind_param("s", $data['username']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Username già in uso']);
            return;
        }
        
        // Verifica se l'email esiste già
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $data['email']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Email già in uso']);
            return;
        }
        
        // Verifica che il ruolo sia valido
        $stmt = $conn->prepare("SELECT id FROM user_role WHERE id = ?");
        $stmt->bind_param("i", $data['role_id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Ruolo non valido']);
            return;
        }
        
        // Hash della password
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
        
        // Inserimento utente
        $stmt = $conn->prepare("
            INSERT INTO users (username, password, email, name, role_id, active)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $name = isset($data['name']) ? $data['name'] : '';
        $active = isset($data['active']) ? (int)$data['active'] : 1;
        
        $stmt->bind_param("ssssis", 
            $data['username'], 
            $hashedPassword, 
            $data['email'], 
            $name, 
            $data['role_id'], 
            $active
        );
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        $newUserId = $stmt->insert_id;
        
        // Recupera l'utente appena creato
        $stmt = $conn->prepare("
            SELECT u.id, u.username, u.email, u.name, u.role_id, 
                   u.active, u.created_at, r.name as role_name
            FROM users u
            JOIN user_role r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        
        $stmt->bind_param("i", $newUserId);
        $stmt->execute();
        $newUser = $stmt->get_result()->fetch_assoc();
        
        http_response_code(201); // Created
        echo json_encode([
            'message' => 'Utente creato con successo',
            'user' => $newUser
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nella creazione dell\'utente: ' . $e->getMessage()]);
    }
}

function updateUser($conn, $id) {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Verifica che l'utente esista
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Utente non trovato']);
            return;
        }
        
        // Inizia la costruzione della query
        $query = "UPDATE users SET ";
        $params = [];
        $types = "";
        
        // Aggiorna i campi forniti
        if (isset($data['email'])) {
            // Verifica che l'email non sia già in uso da un altro utente
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->bind_param("si", $data['email'], $id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Email già in uso']);
                return;
            }
            
            $query .= "email = ?, ";
            $params[] = $data['email'];
            $types .= "s";
        }
        
        if (isset($data['name'])) {
            $query .= "name = ?, ";
            $params[] = $data['name'];
            $types .= "s";
        }
        
        if (isset($data['role_id'])) {
            // Verifica che il ruolo sia valido
            $stmt = $conn->prepare("SELECT id FROM user_role WHERE id = ?");
            $stmt->bind_param("i", $data['role_id']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Ruolo non valido']);
                return;
            }
            
            $query .= "role_id = ?, ";
            $params[] = $data['role_id'];
            $types .= "i";
        }
        
        if (isset($data['active'])) {
            $query .= "active = ?, ";
            $params[] = (int)$data['active'];
            $types .= "i";
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $query .= "password = ?, ";
            $params[] = $hashedPassword;
            $types .= "s";
        }
        
        // Rimuovi la virgola finale
        $query = rtrim($query, ", ");
        
        // Aggiungi la condizione WHERE
        $query .= " WHERE id = ?";
        $params[] = $id;
        $types .= "i";
        
        // Se non ci sono campi da aggiornare
        if (count($params) <= 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Nessun campo da aggiornare']);
            return;
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        // Recupera l'utente aggiornato
        $stmt = $conn->prepare("
            SELECT u.id, u.username, u.email, u.name, u.role_id, 
                   u.active, u.last_login, u.created_at, r.name as role_name
            FROM users u
            JOIN user_role r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $updatedUser = $stmt->get_result()->fetch_assoc();
        
        echo json_encode([
            'message' => 'Utente aggiornato con successo',
            'user' => $updatedUser
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nell\'aggiornamento dell\'utente: ' . $e->getMessage()]);
    }
}

function deleteUser($conn, $id) {
    try {
        // Previeni l'eliminazione di se stessi
        global $user;
        if ((int)$id === (int)$user['user_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'Non puoi eliminare il tuo account']);
            return;
        }
        
        // Verifica che l'utente esista
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Utente non trovato']);
            return;
        }
        
        // Elimina prima tutti i token dell'utente
        $stmt = $conn->prepare("DELETE FROM auth_tokens WHERE user_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        // Elimina l'utente
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        echo json_encode(['message' => 'Utente eliminato con successo']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Errore nell\'eliminazione dell\'utente: ' . $e->getMessage()]);
    }
}

$conn->close();
?>