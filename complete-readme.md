# Workout Management API Documentation

## Database Structure

### Tables

#### esercizi
```sql
CREATE TABLE esercizi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descrizione TEXT,
    gruppo_muscolare VARCHAR(100) NOT NULL,
    attrezzatura VARCHAR(255)
);
```

#### schede
```sql
CREATE TABLE schede (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descrizione TEXT,
    data_creazione DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### scheda_esercizi
```sql
CREATE TABLE scheda_esercizi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scheda_id INT NOT NULL,
    esercizio_id INT NOT NULL,
    serie INT NOT NULL,
    ripetizioni INT NOT NULL,
    peso DECIMAL(5,2),
    note TEXT,
    ordine INT NOT NULL,
    FOREIGN KEY (scheda_id) REFERENCES schede(id) ON DELETE CASCADE,
    FOREIGN KEY (esercizio_id) REFERENCES esercizi(id) ON DELETE CASCADE
);
```

#### allenamenti
```sql
CREATE TABLE allenamenti (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scheda_id INT NOT NULL,
    data_allenamento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    durata_totale INT,
    note TEXT,
    FOREIGN KEY (scheda_id) REFERENCES schede(id)
);
```

#### serie_completate
```sql
CREATE TABLE serie_completate (
    id INT PRIMARY KEY AUTO_INCREMENT,
    allenamento_id INT NOT NULL,
    scheda_esercizio_id INT NOT NULL,
    peso DECIMAL(5,2),
    ripetizioni INT NOT NULL,
    completata BOOLEAN DEFAULT true,
    tempo_recupero INT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (allenamento_id) REFERENCES allenamenti(id),
    FOREIGN KEY (scheda_esercizio_id) REFERENCES scheda_esercizi(id)
);
```

## API Endpoints

### Exercise Management (esercizi.php)

#### GET /api/esercizi.php
Returns all exercises

#### GET /api/esercizi.php?id={id}
Returns a specific exercise

#### POST /api/esercizi.php
Creates a new exercise
```json
{
    "nome": "string",
    "descrizione": "string",
    "gruppo_muscolare": "string",
    "attrezzatura": "string"
}
```

#### DELETE /api/esercizi.php?id={id}
Deletes an exercise

### Workout Plan Management (schede.php)

#### GET /api/schede.php
Returns all workout plans with their exercises

#### GET /api/schede.php?id={id}
Returns a specific workout plan with its exercises

#### POST /api/schede.php
Creates a new workout plan
```json
{
    "nome": "string",
    "descrizione": "string",
    "esercizi": [
        {
            "esercizio_id": "number",
            "serie": "number",
            "ripetizioni": "number",
            "peso": "number",
            "note": "string"
        }
    ]
}
```

#### PUT /api/schede.php?id={id}
Updates an existing workout plan

#### DELETE /api/schede.php?id={id}
Deletes a workout plan

### Workout Session Management (allenamenti.php)

#### GET /api/allenamenti.php
Returns all workout sessions

#### GET /api/allenamenti.php?id={id}
Returns a specific workout session

#### POST /api/allenamenti.php
Creates a new workout session
```json
{
    "scheda_id": "number",
    "data_allenamento": "datetime"
}
```

#### PUT /api/allenamenti.php?id={id}
Updates a workout session
```json
{
    "durata_totale": "number",
    "note": "string"
}
```

#### DELETE /api/allenamenti.php?id={id}
Deletes a workout session and its completed sets

### Completed Sets Management (serie_completate.php)

#### GET /api/serie_completate.php?allenamento_id={id}
Returns all completed sets for a workout session

#### GET /api/serie_completate.php?esercizio_id={id}
Returns exercise history (completed sets)

#### POST /api/serie_completate.php
Records a completed set
```json
{
    "allenamento_id": "number",
    "scheda_esercizio_id": "number",
    "peso": "number",
    "ripetizioni": "number",
    "tempo_recupero": "number",
    "note": "string"
}
```

## Frontend Components

### Core Components
- `App.js`: Main application component with routing and theme management
  - Implements dark/light theme toggle
  - Responsive navigation with mobile support
  - Routes: "/" (WorkoutSession) and "/admin" (AdminPanel)
- `AdminPanel.jsx`: Main admin interface
- `WorkoutSession.jsx`: Active workout session management
- `WorkoutHistory.jsx`: Workout history viewer

### Theme Management
- `ThemeProvider.jsx`: Context-based theme management
  - Persists theme preference in localStorage
  - Supports system theme detection
  - Provides isDark and toggleTheme functionality

### Exercise Management
- `ExerciseForm.jsx`: Form for adding/editing exercises
  - Supports all exercise fields (name, description, muscle group, equipment)
  - Real-time validation
  - Dark mode compatible
- `ExerciseList.jsx`: Exercise list display
  - Sortable list of exercises
  - Delete functionality
  - Responsive table layout
- `ExerciseProgress.jsx`: Exercise progress tracking

### Workout Plan Management
- `WorkoutForm.jsx`: Form for creating workout plans
  - Dynamic exercise addition/removal
  - Set/rep/weight configuration
  - Rest timer settings
- `WorkoutList.jsx`: Workout plan list display
  - Expandable workout details
  - Edit/Delete functionality
  - Exercise ordering
- `EditWorkoutForm.jsx`: Form for editing workout plans
  - Full workout plan modification
  - Exercise reordering
  - Update existing workouts

### Workout Session Management
- `WorkoutSession.jsx`: Active workout tracking
  - Real-time progress tracking
  - Exercise completion logging
  - Rest timer integration
  - Auto-cleanup of empty sessions
- `ExerciseProgress.jsx`: Individual exercise tracking
  - Set/rep tracking
  - Weight logging
  - Rest timer integration
- `WorkoutHistory.jsx`: Past workout viewer
  - Chronological workout history
  - Detailed set/rep/weight information
  - Performance tracking

### Utility Components
- `RestTimer.jsx`: Rest timer between sets
  - Configurable duration
  - Pause/Resume functionality
  - Visual and state feedback

## Features

### Exercise Management
- CRUD operations for exercises
- Exercise categorization by muscle group
- Equipment tracking
- Real-time validation
- Dark mode support

### Workout Plan Management
- Create and customize workout plans
- Add exercises with sets, reps, and weights
- Order exercises in workout plans
- Dynamic exercise management
- Rest timer configuration

### Workout Session
- Start workout from selected plan
- Track completed sets and weights
- Rest timer between sets
- Real-time progress tracking
- Automatic rest timer between sets
- Weight progression tracking
- Session duration tracking
- Note-taking capability
- Auto-cleanup of empty workout sessions
- Historical tracking of weights and performance

### History and Progress
- View workout history
- Track progress over time
- Review completed sets and weights
- Detailed exercise history
- Weight progression visualization
- Session duration tracking
- Exercise-specific performance metrics

## Installation

1. Database Setup:
   - Create database and tables using provided SQL
   - Configure database connection in `config.php`
   - Verify MySQL user permissions
   - Check database character set

2. Backend Setup:
   - Configure CORS in `.htaccess`
   - Ensure PHP has required extensions (mysqli)
   - Set up proper file permissions
   - Configure error logging

3. Frontend Setup:
   ```bash
   # Install dependencies
   npm install react-router-dom axios tailwindcss date-fns lucide-react @radix-ui/react-tabs class-variance-authority clsx tailwind-merge

   # Development
   npm start

   # Production build
   npm run build
   ```

## Environment Setup

### Development Environment
- Node.js and npm
- PHP 7.4+ with mysqli extension
- MySQL/MariaDB
- Apache with mod_rewrite enabled
- Local development server

### Production Environment
- Configure proper CORS headers
- Set up proper SSL/TLS
- Configure proper database security
- Set up proper error logging
- Production-grade web server (Apache/Nginx)
- Database backup strategy

## Common Issues

### CORS Issues
Check `.htaccess` configuration:
```apache
Header set Access-Control-Allow-Origin "http://localhost:3000"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```
Additional considerations:
- Ensure proper protocol (http/https) matching
- Check port configurations
- Verify Origin header handling

### Database Connection
Verify in `config.php`:
```php
$servername = "your_server";
$username = "your_username";
$password = "your_password";
$dbname = "your_database";
```
Additional troubleshooting:
- Verify MySQL user permissions
- Check database character set
- Ensure proper network access
- Test database connectivity

### Empty Workout Sessions
System automatically cleans up:
- When changing workout plans
- When closing the page
- When no sets are completed
- Session timeout handling
- Browser refresh handling
- Network disconnection recovery

## Security Considerations

- All database queries use prepared statements
- CORS is properly configured
- Input validation on both frontend and backend
- Proper error handling and logging
- No sensitive data exposure in API responses
- Secure password storage
- XSS prevention
- CSRF protection

## Performance Optimization

- Efficient database indexing
- Proper API response caching
- Optimized frontend bundle size
- Lazy loading of components
- Efficient state management
- Minimized API calls
- Image optimization
- Code splitting

## Mobile Responsiveness

The application is fully responsive with:
- Mobile-first design approach
- Touch-friendly interface
- Adaptive layouts
- Responsive tables
- Mobile navigation menu
- Optimized input fields
- Gesture support
- Flexible grid system