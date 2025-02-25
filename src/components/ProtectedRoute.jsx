import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Componente per proteggere le rotte che richiedono autenticazione
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, loading, hasRole } = useAuth();
  const location = useLocation();

  // Mostra indicatore di caricamento durante la verifica del token
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // Redirect alla pagina di login se non autenticato
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica il ruolo se richiesto
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Accesso negato
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Non hai i permessi necessari per accedere a questa pagina.
            È richiesto il ruolo di <strong>{requiredRole}</strong>.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  // Utente autenticato e con i permessi corretti
  return children;
};

// Per proteggere rotte che richiedono ruolo admin
export const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};

export default ProtectedRoute;