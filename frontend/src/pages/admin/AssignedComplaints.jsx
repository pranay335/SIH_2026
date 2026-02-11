import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AssignedComplaints = () => {
    const { getToken, user } = useAuth();
    const [assignedComplaints, setAssignedComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch assigned complaint groups
    useEffect(() => {
        const fetchAssignedComplaints = async () => {
            try {
                const token = getToken();
                const municipalityParam = user?.municipalityCode ? `?municipalityCode=${user.municipalityCode}&status=Assigned&status=In Progress` : '?status=Assigned&status=In Progress';

                const response = await fetch(`http://localhost:5000/api/complaints/groups${municipalityParam}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Filter only assigned complaints
                    const assigned = (data.groups || []).filter(c => c.assigned_to);
                    setAssignedComplaints(assigned);
                } else {
                    throw new Error('Failed to fetch assigned complaints');
                }
            } catch (err) {
                console.error('Failed to fetch assigned complaints:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAssignedComplaints();
        }
    }, [user, getToken]);

    const getStatusBadge = (status) => {
        const styles = {
            'In Progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Pending': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Assigned': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">Assigned </span>
                        <span className="text-gradient">Complaints</span>
                    </h2>
                    <p className="text-white/70">
                        View complaints that have been assigned to departments and employees.
                    </p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Complaint ID</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Citizen</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Sector</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm hidden md:table-cell">Department</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Assigned To</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Assigned Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-white/60">
                                            Loading assigned complaints...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-red-400">
                                            Error: {error}
                                        </td>
                                    </tr>
                                ) : assignedComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-white/60">
                                            No assigned complaints found.
                                        </td>
                                    </tr>
                                ) : assignedComplaints.map((complaint) => (
                                    <tr
                                        key={complaint._id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white font-mono text-sm">{complaint.group_id}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.affected_users?.[0]?.name || 'Citizen'}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm hidden md:table-cell">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.assigned_to?.name || 'N/A'}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-white/60 text-sm">{new Date(complaint.last_updated).toLocaleDateString()}</td>
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

export default AssignedComplaints;
