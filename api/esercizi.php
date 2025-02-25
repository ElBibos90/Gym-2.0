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

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM esercizi WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            echo json_encode($result->fetch_assoc());
        } else {
            $result = $conn->query("SELECT * FROM esercizi");
            $esercizi = array();
            while($row = $result->fetch_assoc()) {
                $esercizi[] = $row;
            }
            echo json_encode($esercizi);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if(!$data) {
            http_response_code(400);
            echo json_encode(["message" => "Dati non validi"]);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO esercizi (nome, descrizione, immagine_url, gruppo_muscolare, attrezzatura) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", 
            $data['nome'], 
            $data['descrizione'], 
            $data['immagine_url'],
            $data['gruppo_muscolare'], 
            $data['attrezzatura']
        );
        
        if($stmt->execute()) {
            echo json_encode(["id" => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Errore nel salvataggio"]);
        }
        break;

    case 'PUT':
        if(!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "ID mancante"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if(!$data) {
            http_response_code(400);
            echo json_encode(["message" => "Dati non validi"]);
            exit;
        }

        $id = $_GET['id'];
        $stmt = $conn->prepare("UPDATE esercizi SET nome = ?, descrizione = ?, immagine_url = ?, gruppo_muscolare = ?, attrezzatura = ? WHERE id = ?");
        $stmt->bind_param("sssssi", 
            $data['nome'], 
            $data['descrizione'], 
            $data['immagine_url'],
            $data['gruppo_muscolare'], 
            $data['attrezzatura'],
            $id
        );

        if($stmt->execute()) {
            echo json_encode(["message" => "Esercizio aggiornato"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Errore nell'aggiornamento"]);
        }
        break;

    case 'DELETE':
        if(!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "ID mancante"]);
            exit;
        }
        
        $id = $_GET['id'];
        if($conn->query("DELETE FROM esercizi WHERE id = $id")) {
            echo json_encode(["message" => "Esercizio eliminato"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Errore nell'eliminazione"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Metodo non consentito"]);
}

$conn->close();
?>