import { useState } from 'react';
import AssignComplaintModal from '../../components/AssignComplaintModal.jsx';

const AllComplaints = () => {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const complaints = [
        {
            id: 'CM-2024-156',
            citizenName: 'John Doe',
            sector: 'Road',
            location: 'Main Street, Sector 5',
            urgency: 'high',
            status: 'pending',
            date: '2024-01-15'
        },
        {
            id: 'CM-2024-155',
            citizenName: 'Jane Smith',
            sector: 'Water',
            location: 'Park Road, Sector 3',
            urgency: 'medium',
            status: 'pending',
            date: '2024-01-14'
        },
        {
            id: 'CM-2024-154',
            citizenName: 'Bob Johnson',
            sector: 'Garbage',
            location: 'Market Street, Sector 1',
            urgency: 'low',
            status: 'in-progress',
            date: '2024-01-12'
        },
        {
            id: 'CM-2024-153',
            citizenName: 'Alice Williams',
            sector: 'Electricity',
            location: 'School Road, Sector 4',
            urgency: 'high',
            status: 'pending',
            date: '2024-01-11'
        },
        {
            id: 'CM-2024-152',
            citizenName: 'Charlie Brown',
            sector: 'Drainage',
            location: 'Residential Area, Sector 2',
            urgency: 'medium',
            status: 'in-progress',
            date: '2024-01-10'
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

    const handleAssignClick = (complaintId) => {
        setSelectedComplaint(complaintId);
        setIsModalOpen(true);
    };

    const handleAssign = (complaintId, assignmentData) => {
        console.log('Assigning complaint:', complaintId, assignmentData);
        // In real app, this would make an API call
        alert(`Complaint ${complaintId} assigned to ${assignmentData.employee} in ${assignmentData.department}`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">All </span>
                        <span className="text-gradient">Complaints</span>
                    </h2>
                    <p className="text-white/70">
                        Manage and assign complaints to departments and employees.
                    </p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Complaint ID</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Citizen Name</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Sector</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm hidden md:table-cell">Location</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Urgency</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white font-mono text-sm">{complaint.id}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.citizenName}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm hidden md:table-cell">{complaint.location}</td>
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
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => handleAssignClick(complaint.id)}
                                                className="px-4 py-2 bg-[#3B82F6]/20 text-[#60A5FA] rounded-lg hover:bg-[#3B82F6]/30 transition-colors text-sm font-medium"
                                            >
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AssignComplaintModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedComplaint(null);
                    }}
                    complaintId={selectedComplaint}
                    onAssign={handleAssign}
                />
            </div>
        </div>
    );
};

export default AllComplaints;
