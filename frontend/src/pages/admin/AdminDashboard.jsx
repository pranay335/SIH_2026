import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const { getToken, user } = useAuth();
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    // Real data states
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        urgent: 0
    });
    const [sectorStats, setSectorStats] = useState([]);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = getToken();
                const municipalityParam = user?.municipalityCode ? `?municipalityCode=${user.municipalityCode}` : '';

                const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/admin-stats${municipalityParam}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data.stats);
                    setSectorStats(data.sectorStats);
                    setRecentComplaints(data.recentComplaints);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user, getToken]);

    const handleSendBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) {
            setFeedback({ type: 'error', msg: 'Please fill in both fields' });
            return;
        }

        setIsSending(true);
        setFeedback({ type: '', msg: '' });

        try {
            const token = getToken();
            const response = await fetch(`http://${window.location.hostname}:5000/api/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: broadcastTitle,
                    message: broadcastMessage,
                    isBroadcast: true,
                    municipality: user.municipalityCode
                })
            });

            if (response.ok) {
                setFeedback({ type: 'success', msg: 'Broadcast sent successfully!' });
                setBroadcastTitle('');
                setBroadcastMessage('');
            } else {
                throw new Error('Failed to send broadcast');
            }
        } catch (err) {
            setFeedback({ type: 'error', msg: err.message });
        } finally {
            setIsSending(false);
        }
    };

    const statsCards = [
        { label: 'Total Complaints', value: stats.total, icon: '📋', color: 'from-blue-500 to-cyan-500' },
        { label: 'Pending', value: stats.pending, icon: '⏸️', color: 'from-red-500 to-pink-500' },
        { label: 'In Progress', value: stats.inProgress, icon: '⏳', color: 'from-yellow-500 to-orange-500' },
        { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'from-green-500 to-emerald-500' },
        { label: 'Urgent', value: stats.urgent, icon: '🚨', color: 'from-red-600 to-red-500' }
    ];

    const getStatusBadge = (status) => {
        const styles = {
            'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'resolved': 'bg-green-100 text-green-700 border-green-200',
            'pending': 'bg-red-100 text-red-700 border-red-200'
        };
        return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getUrgencyBadge = (urgency) => {
        const styles = {
            'high': 'bg-red-100 text-red-700',
            'medium': 'bg-yellow-100 text-yellow-700',
            'low': 'bg-blue-100 text-blue-700'
        };
        return styles[urgency] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Admin Dashboard 📊
                    </h2>
                    <p className="text-gray-600">
                        Overview of all complaints and system statistics.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {statsCards.map((stat, index) => (
                        <div
                            key={index}
                            className="glass glass-hover rounded-xl p-6 transform transition-all duration-300 ease-in-out hover:scale-105"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`text-3xl bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                    {stat.icon}
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                    <div className="text-sm text-gray-500">{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Complaints by Sector */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Complaints by Sector</h3>
                        <div className="space-y-4">
                            {sectorStats.length > 0 ? sectorStats.map((item, index) => {
                                const total = item.pending + item.inProgress + item.resolved;
                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">{item.sector}</span>
                                            <span className="text-gray-500">{total} total</span>
                                        </div>
                                        <div className="flex h-6 rounded-lg overflow-hidden">
                                            <div
                                                className="bg-red-500/30"
                                                style={{ width: `${(item.pending / total) * 100}%` }}
                                            />
                                            <div
                                                className="bg-yellow-500/30"
                                                style={{ width: `${(item.inProgress / total) * 100}%` }}
                                            />
                                            <div
                                                className="bg-green-500/30"
                                                style={{ width: `${(item.resolved / total) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>Pending: {item.pending}</span>
                                            <span>In Progress: {item.inProgress}</span>
                                            <span>Resolved: {item.resolved}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-gray-500 text-sm">No sector data available</p>
                            )}
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Status Distribution</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Pending</span>
                                    <span className="text-gray-500">{stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500/50" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">In Progress</span>
                                    <span className="text-gray-500">{stats.inProgress} ({stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500/50" style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Resolved</span>
                                    <span className="text-gray-500">{stats.resolved} ({stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%)</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500/50" style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messaging Panel */}
                <div className="glass rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Messaging Center ✉️</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Send Broadcast */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Broadcast Alert</h4>
                            <div className="space-y-3">
                                {feedback.msg && (
                                    <div className={`p-2 rounded text-xs ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {feedback.msg}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="Alert Title (e.g., Water Supply Update)"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    className="w-full px-4 py-2 glass border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <textarea
                                    placeholder="Enter message for all citizens in BMC..."
                                    rows="3"
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    className="w-full px-4 py-2 glass border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                ></textarea>
                                <button
                                    onClick={handleSendBroadcast}
                                    disabled={isSending}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isSending ? 'Sending...' : 'Send Broadcast'}
                                </button>
                            </div>
                        </div>

                        {/* Direct Message (Recent Users) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Direct Message</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    { name: 'John Doe', sector: 'Road' },
                                    { name: 'Jane Smith', sector: 'Water' },
                                    { name: 'Bob Johnson', sector: 'Waste' }
                                ].map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 glass glass-hover rounded-lg group">
                                        <div>
                                            <div className="text-gray-900 text-sm font-medium">{u.name}</div>
                                            <div className="text-gray-400 text-[10px]">{u.sector} Complaint</div>
                                        </div>
                                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-blue-600 text-xs rounded-full border border-gray-200 transition-colors">
                                            Message
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Complaints */}
                <div className="glass rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Recent Complaints</h3>
                        <a
                            href="/admin/complaints"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                        >
                            View All →
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Complaint ID</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Citizen</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Sector</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Location</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Urgency</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentComplaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="border-b border-gray-100 hover:bg-gray-100 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-gray-900 font-mono text-sm">{complaint.id}</td>
                                        <td className="py-4 px-4 text-gray-600">{complaint.citizen}</td>
                                        <td className="py-4 px-4 text-gray-600">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-gray-500 text-sm">{complaint.location}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(complaint.urgency)}`}>
                                                {complaint.urgency}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
