import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UserDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, getToken } = useAuth();

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`http://localhost:5000/api/complaints/user/${user.id}`, {
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
            setLoading(false);
        }
    };

    // Calculate stats from real data
    const totalComplaints = complaints.length;
    const inProgressComplaints = complaints.filter(c => c.status === 'Under Review').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;

    const stats = [
        { label: 'Total Complaints', value: totalComplaints.toString(), icon: '📋', color: 'from-blue-500 to-cyan-500', link: '/user/my-complaints' },
        { label: 'In Progress', value: inProgressComplaints.toString(), icon: '⏳', color: 'from-yellow-500 to-orange-500', link: '/user/my-complaints?status=Under Review' },
        { label: 'Resolved', value: resolvedComplaints.toString(), icon: '✅', color: 'from-green-500 to-emerald-500', link: '/user/my-complaints?status=Resolved' }
    ];

    // Get recent complaints (last 4)
    const recentComplaints = complaints
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
            </div>
        </div>
    );
};

export default UserDashboard;
