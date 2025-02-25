import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, LogOut, User, BarChart2, Dumbbell } from 'lucide-react';
import WorkoutSession from './components/WorkoutSession';
import LoginPage from './components/LoginPage';
import UserManagement from './components/UserManagement';
import UserDashboard from './components/UserDashboard';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './components/AuthContext';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import ProtectedAdminPanel from './components/admin/ProtectedAdminPanel';  // Nuovo import


const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
};

const Navigation = () => {
    const { currentUser, logout, isAdmin } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
                                Gym 2.0
                            </Link>
                        </div>
                        {/* Menu Desktop */}
                        {currentUser && (
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {!isAdmin() && (
                                    <Link
                                        to="/dashboard"
                                        className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                                    >
                                        <BarChart2 className="h-5 w-5 mr-1" />
                                        Dashboard
                                    </Link>
                                )}

                                <Link
                                    to="/"
                                    className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                                >
                                    <Dumbbell className="h-5 w-5 mr-1" />
                                    Allenamento
                                </Link>

                                {isAdmin() && (
                                    <Link
                                        to="/admin"
                                        className="inline-flex items-center px-1 pt-1 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                                    >
                                        Admin Panel
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center">
                        <ThemeToggle />

                        {currentUser && (
                            <div className="hidden sm:ml-4 sm:flex sm:items-center">
                                <div className="ml-3 relative">
                                    <div className="text-sm text-gray-500 dark:text-gray-300 mr-4">
                                        <span className="hidden md:inline">Benvenuto, </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{currentUser.username}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="hidden md:inline">Logout</span>
                                </button>
                            </div>
                        )}

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="ml-2 sm:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Menu"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Menu Mobile */}
                <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden transition-all duration-300 ease-in-out pb-3`}>
                    {currentUser ? (
                        <div className="pt-2 space-y-1">
                            <div className="px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center">
                                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {currentUser.username}
                                    </span>
                                </div>
                            </div>

                            {!isAdmin() && (
                                <Link
                                    to="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                                >
                                    Dashboard
                                </Link>
                            )}

                            <Link
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                            >
                                Allenamento
                            </Link>

                            {isAdmin() && (
                                <Link
                                    to="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                                >
                                    Admin Panel
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="pt-2">
                            <Link
                                to="/login"
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const AppContent = () => {
    const { currentUser, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <Navigation />

            <main>
            <Routes>
                    <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />

                    {/* Dashboard route per utenti normali */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                {isAdmin() ? <Navigate to="/" replace /> : <UserDashboard />}
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <WorkoutSession />
                            </ProtectedRoute>
                        }
                    />

                    {/* Modifica qui: usa ProtectedAdminPanel invece di AdminRoute */}
                    <Route
                        path="/admin/*"
                        element={<ProtectedAdminPanel />}
                    />

                    {/* Redirect dal root a login se non autenticato */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <Router basename="/gym-2.0">
            <ThemeProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;