const AdminDashboard = () => {
    const stats = [
        { label: 'Total Complaints', value: '156', icon: '📋', color: 'from-blue-500 to-cyan-500' },
        { label: 'Pending', value: '42', icon: '⏸️', color: 'from-red-500 to-pink-500' },
        { label: 'In Progress', value: '68', icon: '⏳', color: 'from-yellow-500 to-orange-500' },
        { label: 'Resolved', value: '46', icon: '✅', color: 'from-green-500 to-emerald-500' },
        { label: 'Urgent', value: '12', icon: '🚨', color: 'from-red-600 to-red-500' }
    ];

    // Mock data for chart visualization (using Tailwind bars)
    const chartData = [
        { sector: 'Road', pending: 15, inProgress: 20, resolved: 25 },
        { sector: 'Water', pending: 10, inProgress: 15, resolved: 18 },
        { sector: 'Electricity', pending: 8, inProgress: 12, resolved: 15 },
        { sector: 'Garbage', pending: 6, inProgress: 10, resolved: 12 },
        { sector: 'Drainage', pending: 3, inProgress: 11, resolved: 8 }
    ];

    const recentComplaints = [
        {
            id: 'CM-2024-156',
            citizen: 'John Doe',
            sector: 'Road',
            location: 'Main Street',
            urgency: 'high',
            status: 'pending'
        },
        {
            id: 'CM-2024-155',
            citizen: 'Jane Smith',
            sector: 'Water',
            location: 'Park Road',
            urgency: 'medium',
            status: 'in-progress'
        },
        {
            id: 'CM-2024-154',
            citizen: 'Bob Johnson',
            sector: 'Garbage',
            location: 'Market Street',
            urgency: 'low',
            status: 'resolved'
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

    const getUrgencyBadge = (urgency) => {
        const styles = {
            'high': 'bg-red-500/20 text-red-400',
            'medium': 'bg-yellow-500/20 text-yellow-400',
            'low': 'bg-blue-500/20 text-blue-400'
        };
        return styles[urgency] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Admin Dashboard 📊
                    </h2>
                    <p className="text-white/70">
                        Overview of all complaints and system statistics.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="glass glass-hover rounded-xl p-6 transform transition-all duration-300 ease-in-out hover:scale-105"
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
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Complaints by Sector */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-6">Complaints by Sector</h3>
                        <div className="space-y-4">
                            {chartData.map((item, index) => {
                                const total = item.pending + item.inProgress + item.resolved;
                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/80 font-medium">{item.sector}</span>
                                            <span className="text-white/60">{total} total</span>
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
                                        <div className="flex gap-4 text-xs text-white/60">
                                            <span>Pending: {item.pending}</span>
                                            <span>In Progress: {item.inProgress}</span>
                                            <span>Resolved: {item.resolved}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-6">Status Distribution</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">Pending</span>
                                    <span className="text-white/60">42 (27%)</span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500/50" style={{ width: '27%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">In Progress</span>
                                    <span className="text-white/60">68 (44%)</span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500/50" style={{ width: '44%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">Resolved</span>
                                    <span className="text-white/60">46 (29%)</span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500/50" style={{ width: '29%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Complaints */}
                <div className="glass rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">Recent Complaints</h3>
                        <a
                            href="/admin/complaints"
                            className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors"
                        >
                            View All →
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Complaint ID</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Citizen</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Sector</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Location</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Urgency</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentComplaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white font-mono text-sm">{complaint.id}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.citizen}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm">{complaint.location}</td>
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
