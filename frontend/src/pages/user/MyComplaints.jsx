import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const MyComplaints = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

    const complaints = [
        {
            id: 'CM-2024-001',
            sector: 'Road',
            date: '2024-01-15',
            status: 'in-progress',
            title: 'Pothole on Main Street',
            description: 'Large pothole causing traffic issues',
            location: 'Main Street, Sector 5'
        },
        {
            id: 'CM-2024-002',
            sector: 'Water',
            date: '2024-01-14',
            status: 'pending',
            title: 'Water Leakage Issue',
            description: 'Continuous water leakage from main pipe',
            location: 'Park Road, Sector 3'
        },
        {
            id: 'CM-2024-003',
            sector: 'Garbage',
            date: '2024-01-12',
            status: 'resolved',
            title: 'Garbage Collection Delay',
            description: 'Garbage not collected for 3 days',
            location: 'Residential Area, Sector 2'
        },
        {
            id: 'CM-2024-004',
            sector: 'Electricity',
            date: '2024-01-10',
            status: 'resolved',
            title: 'Street Light Not Working',
            description: 'Street light pole #45 not functioning',
            location: 'Market Street, Sector 1'
        },
        {
            id: 'CM-2024-005',
            sector: 'Drainage',
            date: '2024-01-08',
            status: 'in-progress',
            title: 'Blocked Drain',
            description: 'Drain blocked causing waterlogging',
            location: 'School Road, Sector 4'
        }
    ];

    const statusFilters = [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' }
    ];

    const filteredComplaints = statusFilter === 'all'
        ? complaints
        : complaints.filter(complaint => complaint.status === statusFilter);

    const getStatusBadge = (status) => {
        const styles = {
            'in-progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'pending': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        if (value === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ status: value });
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">My </span>
                        <span className="text-gradient">Complaints</span>
                    </h2>
                    <p className="text-white/70">
                        Track and manage all your submitted complaints.
                    </p>
                </div>

                {/* Filters */}
                <div className="glass rounded-xl p-6 mb-6">
                    <div className="flex flex-wrap gap-3">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => handleFilterChange(filter.value)}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                    statusFilter === filter.value
                                        ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Complaints List */}
                {filteredComplaints.length > 0 ? (
                    <div className="space-y-4">
                        {filteredComplaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                className="glass glass-hover rounded-xl p-6 transform transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">
                                                    {complaint.title}
                                                </h3>
                                                <p className="text-white/60 text-sm font-mono mb-2">
                                                    {complaint.id}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-white/60">Sector: </span>
                                                <span className="text-white">{complaint.sector}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/60">Date: </span>
                                                <span className="text-white">{complaint.date}</span>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <span className="text-white/60">Location: </span>
                                                <span className="text-white">{complaint.location}</span>
                                            </div>
                                        </div>
                                        <p className="text-white/70 text-sm mt-3">
                                            {complaint.description}
                                        </p>
                                    </div>
                                    <div className="flex md:flex-col gap-2">
                                        <button className="px-4 py-2 bg-[#3B82F6]/20 text-[#60A5FA] rounded-lg hover:bg-[#3B82F6]/30 transition-colors text-sm font-medium">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass rounded-xl p-12 text-center">
                        <p className="text-white/50 text-lg mb-4">No complaints found for this filter.</p>
                        <p className="text-white/40 text-sm">Try selecting a different status filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyComplaints;
