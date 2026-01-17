import { useState } from 'react';

const CitizenDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const stats = [
        { label: 'Total Complaints', value: '24', icon: '📋', color: 'from-blue-500 to-cyan-500' },
        { label: 'In Progress', value: '8', icon: '⏳', color: 'from-yellow-500 to-orange-500' },
        { label: 'Resolved', value: '14', icon: '✅', color: 'from-green-500 to-emerald-500' },
        { label: 'Pending', value: '2', icon: '⏸️', color: 'from-red-500 to-pink-500' }
    ];

    const complaints = [
        {
            id: 1,
            title: 'Pothole on Main Street',
            category: 'Road & Infrastructure',
            status: 'in-progress',
            date: '2024-01-15',
            priority: 'high'
        },
        {
            id: 2,
            title: 'Broken Street Light',
            category: 'Street Lighting',
            status: 'resolved',
            date: '2024-01-10',
            priority: 'medium'
        },
        {
            id: 3,
            title: 'Garbage Collection Issue',
            category: 'Waste Management',
            status: 'pending',
            date: '2024-01-12',
            priority: 'high'
        },
        {
            id: 4,
            title: 'Water Leakage',
            category: 'Water & Sanitation',
            status: 'resolved',
            date: '2024-01-08',
            priority: 'high'
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

    const getPriorityBadge = (priority) => {
        const styles = {
            'high': 'bg-red-500/20 text-red-400',
            'medium': 'bg-yellow-500/20 text-yellow-400',
            'low': 'bg-blue-500/20 text-blue-400'
        };
        return styles[priority] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <section id="dashboard" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        <span className="text-white">Citizen </span>
                        <span className="text-gradient">Dashboard</span>
                    </h2>
                    <p className="text-white/70 text-lg">
                        Track your complaints and stay updated on community issues.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

                {/* Complaints Table */}
                <div className="glass rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h3 className="text-2xl font-semibold text-white mb-4 sm:mb-0">Your Complaints</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                    activeTab === 'overview'
                                        ? 'bg-[#3B82F6] text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                    activeTab === 'all'
                                        ? 'bg-[#3B82F6] text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                            >
                                All
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-white/80 font-medium">Title</th>
                                    <th className="text-left py-4 px-4 text-white/80 font-medium hidden md:table-cell">Category</th>
                                    <th className="text-left py-4 px-4 text-white/80 font-medium">Status</th>
                                    <th className="text-left py-4 px-4 text-white/80 font-medium hidden lg:table-cell">Priority</th>
                                    <th className="text-left py-4 px-4 text-white/80 font-medium hidden lg:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white">{complaint.title}</td>
                                        <td className="py-4 px-4 text-white/70 hidden md:table-cell">{complaint.category}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 hidden lg:table-cell">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(complaint.priority)}`}>
                                                {complaint.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-white/60 hidden lg:table-cell">{complaint.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CitizenDashboard;
