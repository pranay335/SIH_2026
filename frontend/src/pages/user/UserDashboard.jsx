import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const stats = [
        { label: 'Total Complaints', value: '24', icon: '📋', color: 'from-blue-500 to-cyan-500', link: '/user/my-complaints' },
        { label: 'In Progress', value: '8', icon: '⏳', color: 'from-yellow-500 to-orange-500', link: '/user/my-complaints?status=in-progress' },
        { label: 'Resolved', value: '14', icon: '✅', color: 'from-green-500 to-emerald-500', link: '/user/my-complaints?status=resolved' }
    ];

    const recentComplaints = [
        {
            id: 'CM-2024-001',
            sector: 'Road',
            date: '2024-01-15',
            status: 'in-progress',
            title: 'Pothole on Main Street'
        },
        {
            id: 'CM-2024-002',
            sector: 'Water',
            date: '2024-01-14',
            status: 'pending',
            title: 'Water Leakage Issue'
        },
        {
            id: 'CM-2024-003',
            sector: 'Garbage',
            date: '2024-01-12',
            status: 'resolved',
            title: 'Garbage Collection Delay'
        },
        {
            id: 'CM-2024-004',
            sector: 'Electricity',
            date: '2024-01-10',
            status: 'resolved',
            title: 'Street Light Not Working'
        }
    ];

    const getStatusBadge = (status) => {
        const styles = {
            'in-progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'pending': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

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

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Complaint ID</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Sector</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Date</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentComplaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white font-mono text-sm">{complaint.id}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm">{complaint.date}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Link
                                                to={`/user/my-complaints?view=${complaint.id}`}
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
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
