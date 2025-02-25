import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

const AdminLayout = () => {
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Admin Panel
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Logged in as {currentUser?.username}
                    </p>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;