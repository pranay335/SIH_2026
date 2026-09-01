import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AssignComplaintModal from '../../components/AssignComplaintModal.jsx';

const AllComplaints = () => {
    const { getToken, user } = useAuth();
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch all complaint groups
    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const token = getToken();
                const municipalityParam = user?.municipalityCode ? `?municipalityCode=${user.municipalityCode}` : '';

                const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/groups${municipalityParam}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setComplaints(data.groups || []);
                } else {
                    throw new Error('Failed to fetch complaints');
                }
            } catch (err) {
                console.error('Failed to fetch complaints:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchComplaints();
        }
    }, [user, getToken]);

    const getStatusBadge = (status) => {
        const styles = {
            'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'Resolved': 'bg-green-100 text-green-700 border-green-200',
            'Pending': 'bg-red-100 text-red-700 border-red-200',
            'Assigned': 'bg-blue-100 text-blue-700 border-blue-200'
        };
        return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getUrgencyBadge = (priority) => {
        const styles = {
            'High': 'bg-red-100 text-red-700',
            'Critical': 'bg-red-200 text-red-800',
            'Medium': 'bg-yellow-100 text-yellow-700',
            'Low': 'bg-blue-100 text-blue-700'
        };
        return styles[priority] || 'bg-gray-100 text-gray-600';
    };

    const handleAssignClick = (complaint) => {
        setSelectedComplaint(complaint);
        setIsModalOpen(true);
    };

    const handleAssign = async (groupId, assignmentData) => {
        try {
            const token = getToken();
            const response = await fetch(`http://${window.location.hostname}:5000/api/complaints/groups/${groupId}/assign`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employeeId: assignmentData.employee
                })
            });

            if (response.ok) {
                // Refresh complaints list
                const municipalityParam = user?.municipalityCode ? `?municipalityCode=${user.municipalityCode}` : '';
                const refreshResponse = await fetch(`http://${window.location.hostname}:5000/api/complaints/groups${municipalityParam}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    setComplaints(data.groups || []);
                }

                setIsModalOpen(false);
                setSelectedComplaint(null);
            } else {
                throw new Error('Failed to assign complaint');
            }
        } catch (err) {
            console.error('Failed to assign complaint:', err);
            alert('Failed to assign complaint: ' + err.message);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-gray-900">All </span>
                        <span className="text-gradient">Complaints</span>
                    </h2>
                    <p className="text-gray-600">
                        Manage and assign complaints to departments and employees.
                    </p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Complaint ID</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Citizen Name</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Sector</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm hidden md:table-cell">Location</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Urgency</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium text-sm">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-gray-500">
                                            Loading complaints...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-red-600">
                                            Error: {error}
                                        </td>
                                    </tr>
                                ) : complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-gray-500">
                                            No complaints found
                                        </td>
                                    </tr>
                                ) : complaints.map((complaint) => (
                                    <tr
                                        key={complaint._id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-gray-900 font-mono text-sm">{complaint.group_id}</td>
                                        <td className="py-4 px-4 text-gray-600">{complaint.affected_users?.[0]?.name || 'Citizen'}</td>
                                        <td className="py-4 px-4 text-gray-600">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-gray-500 text-sm hidden md:table-cell">{complaint.address?.city || complaint.address?.area || 'N/A'}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(complaint.priority)}`}>
                                                {complaint.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => handleAssignClick(complaint)}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                disabled={complaint.status === 'Resolved'}
                                            >
                                                {complaint.assigned_to ? 'Reassign' : 'Assign'}
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
                    complaintId={selectedComplaint?._id}
                    onAssign={handleAssign}
                />
            </div>
        </div>
    );
};

export default AllComplaints;
