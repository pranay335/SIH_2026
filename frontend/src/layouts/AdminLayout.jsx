import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const { logout, user, getToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = getToken();
            const response = await fetch(`http://${window.location.hostname}:5000/api/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const unread = data.filter(m => !m.read).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const menuItems = [
        { path: '/admin-dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/reassignment', label: 'Management', icon: '🔄' },
        { path: '/admin/complaints', label: 'All Complaints', icon: '📋' },
        { path: '/admin/flagged', label: 'Flagged Complaints', icon: '🚩' },
        { path: '/admin/notices', label: 'Notices', icon: '📢' },
        { path: '/admin/employee-management', label: 'Employee Management', icon: '➕' },
        { path: '/admin/feedback', label: 'Feedback Review', icon: '📝' }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-200
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200">
                        <Link to="/admin-dashboard" className="text-2xl font-bold text-gradient">
                            CivicMind
                        </Link>
                        <p className="text-gray-500 text-sm mt-1">Admin Portal</p>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 font-medium text-sm truncate">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="text-gray-500 text-xs truncate">
                                    Municipal Admin
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`
                                    flex items-center space-x-3 px-4 py-3 rounded-lg
                                    transition-all duration-300
                                    ${isActive(item.path)
                                        ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                                `}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                        >
                            <span className="text-xl">🚪</span>
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="glass border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isSidebarOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                            <div className="flex-1 lg:flex-none flex items-center justify-between lg:justify-start lg:space-x-4">
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                                </h1>

                                <Link to="/admin-dashboard" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                                    <span className="text-xl">🔔</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
