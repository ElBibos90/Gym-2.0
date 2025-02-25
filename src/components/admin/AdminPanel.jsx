import React, { useState, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import UserList from './UserList';
import UserForm from './UserForm';
import WorkoutManager from './WorkoutManager';

const AdminPanel = () => {
    // Stati per gestire i form e le modalità
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [workoutManagerState, setWorkoutManagerState] = useState({
        isOpen: false,
        selectedUser: null,
        selectedWorkout: null,
        mode: 'view'
    });

    // Handler per gestione utenti
    const handleCreateUser = () => {
        setEditingUser(null);
        setShowUserForm(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowUserForm(true);
    };

    const handleUserSaved = () => {
        setShowUserForm(false);
        setEditingUser(null);
    };

    // Handler per gestione schede
    const handleManageWorkouts = useCallback((user, action = 'view', workout = null) => {
        setWorkoutManagerState({
            isOpen: true,
            selectedUser: user,
            selectedWorkout: workout,
            mode: action
        });
    }, []);

    const handleWorkoutSaved = useCallback(() => {
        setWorkoutManagerState({
            isOpen: false,
            selectedUser: null,
            selectedWorkout: null,
            mode: 'view'
        });
    }, []);

    const handleCloseWorkoutManager = useCallback(() => {
        setWorkoutManagerState({
            isOpen: false,
            selectedUser: null,
            selectedWorkout: null,
            mode: 'view'
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Gestione Utenti e Schede
                    </h1>
                    <button
                        onClick={handleCreateUser}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Nuovo Utente
                    </button>
                </div>

                {/* Lista Utenti */}
                <UserList
                    onEditUser={handleEditUser}
                    onCreateWorkout={handleManageWorkouts}
                />

                {/* Form Utente Modal */}
                {showUserForm && (
                    <UserForm
                        user={editingUser}
                        onClose={() => setShowUserForm(false)}
                        onSuccess={handleUserSaved}
                    />
                )}

                {/* Workout Manager Modal */}
                {workoutManagerState.isOpen && workoutManagerState.selectedUser && (
                    <WorkoutManager
                        user={workoutManagerState.selectedUser}
                        mode={workoutManagerState.mode}
                        initialWorkout={workoutManagerState.selectedWorkout}
                        onClose={handleCloseWorkoutManager}
                        onSuccess={handleWorkoutSaved}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminPanel;