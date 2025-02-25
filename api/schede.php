<?php
// Abilita il reporting degli errori
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

// Funzione di logging personalizzata
function debug_log($message, $data = null) {
    $log_file = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message";
    
    if ($data !== null) {
        $log_message .= "\nData: " . print_r($data, true);
    }
    
    $log_message .= "\n" . str_repeat('-', 80) . "\n";
    
    file_put_contents($log_file, $log_message, FILE_APPEND);
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            if(isset($_GET['id'])) {
                $id = $_GET['id'];
                // Usa prepared statement per sicurezza
                $stmt = $conn->prepare("SELECT * FROM schede WHERE id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $scheda = $result->fetch_assoc();
                
                if($scheda) {
                    // Usa prepared statement anche per gli esercizi
                    $stmt = $conn->prepare("
                        SELECT se.*, e.nome, e.descrizione, e.gruppo_muscolare, e.attrezzatura, e.immagine_url,
                            se.serie, se.ripetizioni, se.peso, se.note, se.tempo_recupero
                        FROM scheda_esercizi se
                        JOIN esercizi e ON se.esercizio_id = e.id
                        WHERE se.scheda_id = ?
                        ORDER BY se.ordine
                    ");
                    $stmt->bind_param("i", $id);
                    $stmt->execute();
                    $esercizi_result = $stmt->get_result();
                    
                    $esercizi = array();
                    while($row = $esercizi_result->fetch_assoc()) {
                        $esercizi[] = $row;
                    }
                    
                    $scheda['esercizi'] = $esercizi;
                }
                
                echo json_encode($scheda);
            } else {
                $schede = array();
                $result = $conn->query("SELECT * FROM schede ORDER BY data_creazione DESC");
                
                if (!$result) {
                    throw new Exception("Errore nella query: " . $conn->error);
                }
                
                while($scheda = $result->fetch_assoc()) {
                    $scheda_id = $scheda['id'];
                    $esercizi_result = $conn->query("
                        SELECT se.*, e.nome, e.descrizione, e.gruppo_muscolare, e.attrezzatura,
                               se.serie, se.ripetizioni, se.peso, se.note
                        FROM scheda_esercizi se
                        JOIN esercizi e ON se.esercizio_id = e.id
                        WHERE se.scheda_id = $scheda_id
                        ORDER BY se.ordine
                    ");
                    
                    if (!$esercizi_result) {
                        throw new Exception("Errore nella query esercizi: " . $conn->error);
                    }
                    
                    $esercizi = array();
                    while($esercizio = $esercizi_result->fetch_assoc()) {
                        $esercizi[] = $esercizio;
                    }
                    
                    $scheda['esercizi'] = $esercizi;
                    $schede[] = $scheda;
                }
                
                echo json_encode($schede);
            }
        } catch (Exception $e) {
            debug_log("Errore in GET", ["message" => $e->getMessage()]);
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        try {
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if(!$data) {
                throw new Exception("Dati non validi: " . json_last_error_msg());
            }
            
            // Inizia la transazione
            $conn->begin_transaction();
            
            // Inserisci la scheda
            $stmt = $conn->prepare("INSERT INTO schede (nome, descrizione, data_creazione) VALUES (?, ?, NOW())");
            $stmt->bind_param("ss", $data['nome'], $data['descrizione']);
            
            if(!$stmt->execute()) {
                throw new Exception("Errore nell'inserimento della scheda: " . $stmt->error);
            }
            
            $scheda_id = $stmt->insert_id;
            debug_log("Creata nuova scheda", ["id" => $scheda_id, "nome" => $data['nome']]);
            
            // Inserisci gli esercizi della scheda
            if(isset($data['esercizi']) && is_array($data['esercizi'])) {
                $stmt = $conn->prepare("
                    INSERT INTO scheda_esercizi 
                    (scheda_id, esercizio_id, serie, ripetizioni, peso, note, tempo_recupero, ordine) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                foreach($data['esercizi'] as $index => $esercizio) {
                    if(empty($esercizio['esercizio_id'])) {
                        throw new Exception("ID esercizio mancante per l'elemento in posizione " . $index);
                    }
                    
                    $tempo_recupero = isset($esercizio['tempo_recupero']) ? $esercizio['tempo_recupero'] : 90;
                    
                    $stmt->bind_param(
                        "iiiidsii",
                        $scheda_id,
                        $esercizio['esercizio_id'],
                        $esercizio['serie'],
                        $esercizio['ripetizioni'],
                        $esercizio['peso'],
                        $esercizio['note'],
                        $tempo_recupero,
                        $index
                    );
                    
                    if(!$stmt->execute()) {
                        throw new Exception("Errore nell'inserimento dell'esercizio: " . $stmt->error);
                    }
                }
            }
            
            $conn->commit();
            
            // Recupera la scheda creata per restituirla
            $stmt = $conn->prepare("SELECT * FROM schede WHERE id = ?");
            $stmt->bind_param("i", $scheda_id);
            $stmt->execute();
            $scheda = $stmt->get_result()->fetch_assoc();
            
            debug_log("Risposta POST", ["scheda" => $scheda]);
            echo json_encode($scheda);
            
        } catch(Exception $e) {
            $conn->rollback();
            debug_log("Errore in POST", ["message" => $e->getMessage()]);
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        try {
            $input = file_get_contents("php://input");
            debug_log("Dati ricevuti in PUT", ["input" => $input]);
            
            $data = json_decode($input, true);
            if(!$data) {
                throw new Exception("Dati non validi: " . json_last_error_msg());
            }
            
            if (!isset($_GET['id'])) {
                throw new Exception("ID mancante");
            }
            
            $scheda_id = (int)$_GET['id'];
            debug_log("Aggiornamento scheda", ["id" => $scheda_id, "nome" => $data['nome']]);
            
            // Inizia la transazione
            $conn->begin_transaction();
            
            // IMPORTANTE: Verifica che la scheda esista
            $stmt = $conn->prepare("SELECT id FROM schede WHERE id = ?");
            $stmt->bind_param("i", $scheda_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                throw new Exception("Scheda con ID $scheda_id non trovata");
            }
            
            debug_log("Scheda trovata, procedo con l'aggiornamento", ["id" => $scheda_id]);
            
            // Aggiorna i dati base della scheda
            $stmt = $conn->prepare("UPDATE schede SET nome = ?, descrizione = ? WHERE id = ?");
            $stmt->bind_param("ssi", $data['nome'], $data['descrizione'], $scheda_id);
            
            if (!$stmt->execute()) {
                throw new Exception("Errore nell'aggiornamento della scheda: " . $stmt->error);
            }
            
            debug_log("Aggiornamento dati base completato", ["affected_rows" => $stmt->affected_rows]);
            
            // Dopo aver aggiornato i dati base della scheda
            if ($stmt->affected_rows === 0) {
                debug_log("Attenzione: nessuna riga aggiornata", ["scheda_id" => $scheda_id]);
                // Verifica se l'ID esiste ancora
                $verify = $conn->prepare("SELECT id FROM schede WHERE id = ?");
                $verify->bind_param("i", $scheda_id);
                $verify->execute();
                $exists = $verify->get_result()->num_rows > 0;
                
                if (!$exists) {
                    throw new Exception("La scheda con ID $scheda_id non esiste più dopo l'aggiornamento");
                }
            }
            
            // Elimina tutti gli esercizi esistenti della scheda
            $stmt = $conn->prepare("DELETE FROM scheda_esercizi WHERE scheda_id = ?");
            $stmt->bind_param("i", $scheda_id);
            
            if (!$stmt->execute()) {
                throw new Exception("Errore nell'eliminazione degli esercizi esistenti: " . $stmt->error);
            }
            
            debug_log("Esercizi esistenti eliminati", ["scheda_id" => $scheda_id]);
            
            // Inserisci i nuovi esercizi
            if (isset($data['esercizi']) && is_array($data['esercizi']) && count($data['esercizi']) > 0) {
                $stmt = $conn->prepare("
                    INSERT INTO scheda_esercizi 
                    (scheda_id, esercizio_id, serie, ripetizioni, peso, note, tempo_recupero, ordine) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                debug_log("Inserimento nuovi esercizi", ["count" => count($data['esercizi'])]);
                
                foreach($data['esercizi'] as $index => $esercizio) {
                    if(empty($esercizio['esercizio_id'])) {
                        throw new Exception("ID esercizio mancante per l'elemento in posizione " . $index);
                    }
                    
                    $tempo_recupero = isset($esercizio['tempo_recupero']) ? $esercizio['tempo_recupero'] : 90;
                    $ordine = isset($esercizio['ordine']) ? $esercizio['ordine'] : $index;
                    
                    $stmt->bind_param(
                        "iiiidsii",
                        $scheda_id,
                        $esercizio['esercizio_id'],
                        $esercizio['serie'],
                        $esercizio['ripetizioni'],
                        $esercizio['peso'],
                        $esercizio['note'],
                        $tempo_recupero,
                        $ordine
                    );
                    
                    if(!$stmt->execute()) {
                        throw new Exception("Errore nell'inserimento dell'esercizio: " . $stmt->error);
                    }
                    
                    debug_log("Esercizio inserito", [
                        "index" => $index, 
                        "esercizio_id" => $esercizio['esercizio_id'],
                        "scheda_id" => $scheda_id
                    ]);
                }
            }
            
            // Commit della transazione
            $conn->commit();
            debug_log("Transazione completata con successo", ["scheda_id" => $scheda_id]);
            
            // Recupera la scheda aggiornata per restituirla
            $stmt = $conn->prepare("SELECT * FROM schede WHERE id = ?");
            $stmt->bind_param("i", $scheda_id);
            $stmt->execute();
            $scheda = $stmt->get_result()->fetch_assoc();
            
            // Recupera gli esercizi aggiornati
            $stmt = $conn->prepare("
                SELECT se.*, e.nome, e.descrizione, e.gruppo_muscolare, e.attrezzatura
                FROM scheda_esercizi se
                JOIN esercizi e ON se.esercizio_id = e.id
                WHERE se.scheda_id = ?
                ORDER BY se.ordine
            ");
            $stmt->bind_param("i", $scheda_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $esercizi = array();
            while($row = $result->fetch_assoc()) {
                $esercizi[] = $row;
            }
            
            $scheda['esercizi'] = $esercizi;
            
            debug_log("Risposta PUT", ["scheda_id" => $scheda['id'], "num_esercizi" => count($esercizi)]);
            echo json_encode($scheda);
            
        } catch (Exception $e) {
            $conn->rollback();
            debug_log("Errore in PUT", ["message" => $e->getMessage()]);
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        try {
            if(!isset($_GET['id'])) {
                throw new Exception("ID mancante");
            }
            
            $id = $_GET['id'];
            debug_log("Richiesta eliminazione scheda", ["id" => $id]);
            
            // Inizia la transazione
            $conn->begin_transaction();
            
            // Controlla se ci sono riferimenti alle assegnazioni utente
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM user_workout_assignments WHERE scheda_id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            
            if ($result['count'] > 0) {
                debug_log("Eliminazione assegnazioni utente", ["count" => $result['count']]);
                // Elimina prima le assegnazioni utente
                $stmt = $conn->prepare("DELETE FROM user_workout_assignments WHERE scheda_id = ?");
                $stmt->bind_param("i", $id);
                
                if(!$stmt->execute()) {
                    throw new Exception("Errore nell'eliminazione delle assegnazioni utente");
                }
            }
            
            // Controlla se ci sono allenamenti collegati a questa scheda
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM allenamenti WHERE scheda_id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            
            if ($result['count'] > 0) {
                debug_log("Eliminazione allenamenti collegati", ["count" => $result['count']]);
                // Elimina prima gli allenamenti collegati
                $stmt = $conn->prepare("
                    DELETE FROM serie_completate 
                    WHERE allenamento_id IN (SELECT id FROM allenamenti WHERE scheda_id = ?)
                ");
                $stmt->bind_param("i", $id);
                
                if(!$stmt->execute()) {
                    throw new Exception("Errore nell'eliminazione delle serie completate");
                }
                
                $stmt = $conn->prepare("DELETE FROM allenamenti WHERE scheda_id = ?");
                $stmt->bind_param("i", $id);
                
                if(!$stmt->execute()) {
                    throw new Exception("Errore nell'eliminazione degli allenamenti");
                }
            }
            
            // Elimina gli esercizi della scheda
            $stmt = $conn->prepare("DELETE FROM scheda_esercizi WHERE scheda_id = ?");
            $stmt->bind_param("i", $id);
            
            if(!$stmt->execute()) {
                throw new Exception("Errore nell'eliminazione degli esercizi");
            }
            
            debug_log("Esercizi eliminati", ["scheda_id" => $id]);
            
            // Infine elimina la scheda
            $stmt = $conn->prepare("DELETE FROM schede WHERE id = ?");
            $stmt->bind_param("i", $id);
            
            if(!$stmt->execute()) {
                throw new Exception("Errore nell'eliminazione della scheda");
            }
            
            debug_log("Scheda eliminata", ["id" => $id]);
            
            // Commit della transazione
            $conn->commit();
            echo json_encode(["message" => "Scheda eliminata"]);
            
        } catch(Exception $e) {
            $conn->rollback();
            debug_log("Errore in DELETE", ["message" => $e->getMessage()]);
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Metodo non consentito"]);
}

$conn->close();
?>