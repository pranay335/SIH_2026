import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/user-dashboard', label: 'Home', icon: '🏠' },
        { path: '/user/complaint', label: 'File Complaint', icon: '📝' },
        { path: '/user/my-complaints', label: 'My Complaints', icon: '📋' },
        { path: '/user/notices', label: 'Notices', icon: '📢' },
        { path: '/user/profile', label: 'Profile', icon: '👤' }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[#0B0F1A] flex">
            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white/5 backdrop-blur-md border-r border-white/10
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10">
                        <Link to="/user-dashboard" className="text-2xl font-bold text-gradient">
                            CivicMind
                        </Link>
                        <p className="text-white/60 text-sm mt-1">Citizen Portal</p>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-white/60 text-xs truncate">
                                    {user?.email || 'user@example.com'}
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
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
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
                <header className="glass border-b border-white/10 sticky top-0 z-30">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
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
                            <div className="flex-1 lg:flex-none">
                                <h1 className="text-xl font-semibold text-white">
                                    {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                                </h1>
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

export default UserLayout;
