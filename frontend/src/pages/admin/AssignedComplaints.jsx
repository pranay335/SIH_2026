const AssignedComplaints = () => {
    const assignedComplaints = [
        {
            id: 'CM-2024-154',
            citizenName: 'Bob Johnson',
            sector: 'Garbage',
            location: 'Market Street, Sector 1',
            assignedTo: 'Jessica Lee',
            department: 'Waste Management',
            status: 'in-progress',
            assignedDate: '2024-01-12'
        },
        {
            id: 'CM-2024-152',
            citizenName: 'Charlie Brown',
            sector: 'Drainage',
            location: 'Residential Area, Sector 2',
            assignedTo: 'James White',
            department: 'Drainage',
            status: 'in-progress',
            assignedDate: '2024-01-10'
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
                                {assignedComplaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white font-mono text-sm">{complaint.id}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.citizenName}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.sector}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm hidden md:table-cell">{complaint.department}</td>
                                        <td className="py-4 px-4 text-white/70">{complaint.assignedTo}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-white/60 text-sm">{complaint.assignedDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {assignedComplaints.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-white/50 text-lg">No assigned complaints found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignedComplaints;
