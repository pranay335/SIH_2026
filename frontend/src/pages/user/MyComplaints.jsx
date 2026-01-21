import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/button.jsx';

const MyComplaints = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const complaints = [
        {
            id: 'CM-2024-001',
            sector: 'Road',
            date: '2024-01-15',
            status: 'in-progress',
            title: 'Pothole on Main Street',
            description: 'Large pothole causing traffic issues and potential vehicle damage. The pothole is approximately 2 feet in diameter and located in the middle of the road, making it difficult for vehicles to avoid safely.',
            location: 'Main Street, Sector 5',
            assignedTo: {
                name: 'John Smith',
                department: 'Road & Infrastructure',
                phone: '+1234567890',
                email: 'john.smith@municipal.gov'
            },
            image: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Pothole+Damage',
            priority: 'high',
            estimatedResolution: '2024-01-22',
            citizen: {
                name: 'Rahul Kumar',
                phone: '+9876543210',
                email: 'rahul.k@email.com'
            }
        },
        {
            id: 'CM-2024-002',
            sector: 'Water',
            date: '2024-01-14',
            status: 'pending',
            title: 'Water Leakage Issue',
            description: 'Continuous water leakage from main pipe causing water wastage and creating slippery conditions on the road. The leak has been ongoing for 3 days and is getting worse.',
            location: 'Park Road, Sector 3',
            assignedTo: {
                name: 'Sarah Johnson',
                department: 'Water & Sanitation',
                phone: '+1234567891',
                email: 'sarah.j@municipal.gov'
            },
            image: 'https://via.placeholder.com/400x300/60A5FA/FFFFFF?text=Water+Leak',
            priority: 'high',
            estimatedResolution: '2024-01-20',
            citizen: {
                name: 'Priya Sharma',
                phone: '+9876543211',
                email: 'priya.s@email.com'
            }
        },
        {
            id: 'CM-2024-003',
            sector: 'Garbage',
            date: '2024-01-12',
            status: 'resolved',
            title: 'Garbage Collection Delay',
            description: 'Garbage not collected for 3 days causing foul smell and potential health hazards. Multiple bins are overflowing in the area.',
            location: 'Residential Area, Sector 2',
            assignedTo: {
                name: 'Mike Wilson',
                department: 'Waste Management',
                phone: '+1234567892',
                email: 'mike.w@municipal.gov'
            },
            image: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Garbage+Overflow',
            priority: 'medium',
            estimatedResolution: '2024-01-18',
            resolvedDate: '2024-01-16',
            citizen: {
                name: 'Amit Patel',
                phone: '+9876543212',
                email: 'amit.p@email.com'
            }
        },
        {
            id: 'CM-2024-004',
            sector: 'Electricity',
            date: '2024-01-10',
            status: 'resolved',
            title: 'Street Light Not Working',
            description: 'Street light pole #45 not functioning for the past week, creating safety concerns for pedestrians and vehicles during night hours.',
            location: 'Market Street, Sector 1',
            assignedTo: {
                name: 'David Lee',
                department: 'Electrical Maintenance',
                phone: '+1234567893',
                email: 'david.l@municipal.gov'
            },
            image: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Street+Light',
            priority: 'medium',
            estimatedResolution: '2024-01-17',
            resolvedDate: '2024-01-14',
            citizen: {
                name: 'Sneha Reddy',
                phone: '+9876543213',
                email: 'sneha.r@email.com'
            }
        },
        {
            id: 'CM-2024-005',
            sector: 'Drainage',
            date: '2024-01-08',
            status: 'in-progress',
            title: 'Blocked Drain',
            description: 'Drain blocked causing waterlogging during rain. Water accumulates on the road making it difficult for vehicles and pedestrians to pass safely.',
            location: 'School Road, Sector 4',
            assignedTo: {
                name: 'Lisa Chen',
                department: 'Drainage & Sanitation',
                phone: '+1234567894',
                email: 'lisa.c@municipal.gov'
            },
            image: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Blocked+Drain',
            priority: 'high',
            estimatedResolution: '2024-01-19',
            citizen: {
                name: 'Rohit Verma',
                phone: '+9876543214',
                email: 'rohit.v@email.com'
            }
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

    const handleViewDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setShowDetailsModal(true);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'text-red-400 bg-red-500/20 border-red-500/30',
            'medium': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
            'low': 'text-green-400 bg-green-500/20 border-green-500/30'
        };
        return colors[priority] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
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
                                        <button 
                                            onClick={() => handleViewDetails(complaint)}
                                            className="px-4 py-2 bg-[#3B82F6]/20 text-[#60A5FA] rounded-lg hover:bg-[#3B82F6]/30 transition-colors text-sm font-medium"
                                        >
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

                {/* Complaint Details Modal */}
                {showDetailsModal && selectedComplaint && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 md:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            {selectedComplaint.title}
                                        </h3>
                                        <p className="text-white/60 text-sm font-mono">
                                            {selectedComplaint.id}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedComplaint.status)}`}>
                                            {selectedComplaint.status.replace('-', ' ')}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                                            {selectedComplaint.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                                        </span>
                                        <button
                                            onClick={() => setShowDetailsModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Complaint Image */}
                                {selectedComplaint.image && (
                                    <div className="mb-6">
                                        <img
                                            src={selectedComplaint.image}
                                            alt="Complaint evidence"
                                            className="w-full h-64 object-cover rounded-lg border border-white/10"
                                        />
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-white/80 text-sm font-medium mb-2">Complaint Details</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Sector:</span>
                                                    <span className="text-white">{selectedComplaint.sector}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Date Filed:</span>
                                                    <span className="text-white">{selectedComplaint.date}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Location:</span>
                                                    <span className="text-white">{selectedComplaint.location}</span>
                                                </div>
                                                {selectedComplaint.estimatedResolution && (
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Est. Resolution:</span>
                                                        <span className="text-white">{selectedComplaint.estimatedResolution}</span>
                                                    </div>
                                                )}
                                                {selectedComplaint.resolvedDate && (
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Resolved Date:</span>
                                                        <span className="text-white">{selectedComplaint.resolvedDate}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-white/80 text-sm font-medium mb-2">Description</h4>
                                            <p className="text-white/70 text-sm leading-relaxed">
                                                {selectedComplaint.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Assigned Employee Details */}
                                        {selectedComplaint.assignedTo && (
                                            <div>
                                                <h4 className="text-white/80 text-sm font-medium mb-2">Assigned To</h4>
                                                <div className="glass rounded-lg p-4 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                                            {selectedComplaint.assignedTo.name?.charAt(0) || 'E'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{selectedComplaint.assignedTo.name}</p>
                                                            <p className="text-white/60 text-sm">{selectedComplaint.assignedTo.department}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span className="text-white/70 text-sm">{selectedComplaint.assignedTo.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-white/70 text-sm">{selectedComplaint.assignedTo.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Citizen Details */}
                                        {selectedComplaint.citizen && (
                                            <div>
                                                <h4 className="text-white/80 text-sm font-medium mb-2">Filed By</h4>
                                                <div className="glass rounded-lg p-4 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#60A5FA] flex items-center justify-center text-white font-semibold">
                                                            {selectedComplaint.citizen.name?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{selectedComplaint.citizen.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span className="text-white/70 text-sm">{selectedComplaint.citizen.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-white/70 text-sm">{selectedComplaint.citizen.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t border-white/10">
                                    <Button
                                        label="Close"
                                        variant="secondary"
                                        onClick={() => setShowDetailsModal(false)}
                                        className="flex-1"
                                    />
                                    {selectedComplaint.status === 'in-progress' && (
                                        <Button
                                            label="Follow Up"
                                            variant="primary"
                                            className="flex-1"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyComplaints;
