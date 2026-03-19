import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const normalizeStatus = (status = '') => status.toString().trim().toLowerCase();

const isInProgressStatus = (status = '') => {
    const normalized = normalizeStatus(status);
    return ['assigned', 'in progress', 'under review'].includes(normalized);
};

const isResolvedStatus = (status = '') => {
    const normalized = normalizeStatus(status);
    return ['resolved', 'closed'].includes(normalized);
};

const UserDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' or 'messages'
    const [error, setError] = useState('');
    const { user, getToken } = useAuth();

    useEffect(() => {
        if (user?._id || user?.id) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchComplaints(), fetchMessages()]);
        setLoading(false);
    };

    const fetchComplaints = async () => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const userId = user?._id || user?.id;
            if (!userId) {
                throw new Error('User information is missing. Please login again.');
            }

            const response = await fetch(`http://localhost:5000/api/complaints/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch complaints');
            }

            const data = await response.json();
            setComplaints(data);
            console.log(`✅ Fetched ${data.length} complaints for dashboard`);
        } catch (err) {
            console.error('❌ Error fetching dashboard data:', err);
            setError(err.message);
        } finally {
            // setLoading(false); // Handled by Promise.all
        }
    };

    const fetchMessages = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/messages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
                console.log(`✅ Fetched ${data.length} messages`);
            }
        } catch (err) {
            console.error('❌ Error fetching messages:', err);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/messages/${messageId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, read: true } : m));
            }
        } catch (err) {
            console.error('❌ Error marking message as read:', err);
        }
    };

    // Calculate stats from real data
    const totalComplaints = complaints.length;
    const inProgressComplaints = complaints.filter(c => isInProgressStatus(c.status)).length;
    const resolvedComplaints = complaints.filter(c => isResolvedStatus(c.status)).length;

    const stats = [
        { label: 'Total Complaints', value: totalComplaints.toString(), icon: '📋', color: 'from-blue-500 to-cyan-500', link: '/user/my-complaints' },
        { label: 'In Progress', value: inProgressComplaints.toString(), icon: '⏳', color: 'from-yellow-500 to-orange-500', link: '/user/my-complaints?status=Under Review' },
        { label: 'Resolved', value: resolvedComplaints.toString(), icon: '✅', color: 'from-green-500 to-emerald-500', link: '/user/my-complaints?status=Resolved' }
    ];

    // Get recent complaints (last 4)
    const recentComplaints = [...complaints]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

    const getStatusBadge = (status) => {
        const styles = {
            'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Pending': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-white/50">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Welcome Back! 👋
                    </h2>
                    <p className="text-white/70">
                        Track your complaints and stay updated on community issues.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <Link
                            key={index}
                            to={stat.link}
                            className="glass glass-hover rounded-xl p-6 transform transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`text-3xl bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                    {stat.icon}
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                    <div className="text-sm text-white/60">{stat.label}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Tab Switcher */}
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setActiveTab('complaints')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'complaints' ? 'bg-blue-600 text-white' : 'glass text-white/60 hover:text-white'}`}
                    >
                        Complaints
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white' : 'glass text-white/60 hover:text-white'}`}
                    >
                        Messages {messages.filter(m => !m.read).length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-[10px] rounded-full">{messages.filter(m => !m.read).length}</span>}
                    </button>
                </div>

                {activeTab === 'complaints' ? (
                    <>
                        {/* Quick Actions */}
                        <div className="glass rounded-xl p-6 mb-8">
                            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/user/complaint"
                                    className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white rounded-lg font-medium hover:from-[#2563EB] hover:to-[#3B82F6] transition-all duration-300 shadow-lg shadow-[#3B82F6]/20"
                                >
                                    + File New Complaint
                                </Link>
                                <Link
                                    to="/user/my-complaints"
                                    className="px-6 py-3 glass text-white/90 hover:bg-white/10 rounded-lg font-medium transition-all duration-300"
                                >
                                    View All Complaints
                                </Link>
                            </div>
                        </div>

                        {/* Recent Complaints */}
                        <div className="glass rounded-xl p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">Recent Complaints</h3>
                                <Link
                                    to="/user/my-complaints"
                                    className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors"
                                >
                                    View All →
                                </Link>
                            </div>

                            {recentComplaints.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Complaint ID</th>
                                                <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Priority</th>
                                                <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Date</th>
                                                <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Status</th>
                                                <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentComplaints.map((complaint) => (
                                                <tr
                                                    key={complaint._id}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                                >
                                                    <td className="py-4 px-4 text-white font-mono text-sm">{complaint.complaint_id}</td>
                                                    <td className="py-4 px-4 text-white/70">{complaint.priority}</td>
                                                    <td className="py-4 px-4 text-white/60 text-sm">{new Date(complaint.createdAt).toLocaleDateString()}</td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                            {complaint.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Link
                                                            to={`/user/my-complaints?view=${complaint._id}`}
                                                            className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-white/50">No complaints filed yet.</p>
                                    <Link
                                        to="/user/complaint"
                                        className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white rounded-lg font-medium hover:from-[#2563EB] hover:to-[#3B82F6] transition-all duration-300"
                                    >
                                        File Your First Complaint
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {messages.length > 0 ? (
                            messages.map((m) => (
                                <div key={m._id} className={`glass p-6 rounded-xl relative transition-all ${!m.read ? 'border-l-4 border-blue-500' : 'opacity-80'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{m.title}</h4>
                                            <p className="text-white/70">{m.message}</p>
                                            <span className="text-xs text-white/40 block mt-2">{new Date(m.createdAt).toLocaleString()}</span>
                                        </div>
                                        {!m.read && (
                                            <button
                                                onClick={() => markAsRead(m._id)}
                                                className="text-blue-400 text-xs hover:text-blue-300"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 glass rounded-xl">
                                <p className="text-white/50">No official messages yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
