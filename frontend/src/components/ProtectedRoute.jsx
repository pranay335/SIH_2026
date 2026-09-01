import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-900">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (role === 'user') {
            return <Navigate to="/user-dashboard" replace />;
        } else if (role === 'employee') {
            return <Navigate to="/employee-dashboard" replace />;
        } else if (role === 'admin') {
            return <Navigate to="/admin-dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
