import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import AdminPanel from './AdminPanel';
import AdminLayout from './AdminLayout';

const ProtectedAdminPanel = () => {
    const { currentUser, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!currentUser || !isAdmin()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route index element={<AdminPanel />} />
                {/* Qui puoi aggiungere altre route admin se necessario */}
            </Route>
        </Routes>
    );
};

export default ProtectedAdminPanel;