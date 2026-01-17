const Employees = () => {
    const employees = [
        {
            id: 1,
            name: 'John Smith',
            department: 'Road & Infrastructure',
            email: 'john.smith@municipal.gov',
            phone: '+1234567890',
            status: 'active'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            department: 'Road & Infrastructure',
            email: 'sarah.j@municipal.gov',
            phone: '+1234567891',
            status: 'active'
        },
        {
            id: 3,
            name: 'Emily Brown',
            department: 'Water & Sanitation',
            email: 'emily.b@municipal.gov',
            phone: '+1234567892',
            status: 'active'
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">Employee </span>
                        <span className="text-gradient">Management</span>
                    </h2>
                    <p className="text-white/70">
                        View and manage municipal employees.
                    </p>
                </div>

                <div className="glass rounded-xl p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Name</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Department</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm hidden md:table-cell">Email</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm hidden lg:table-cell">Phone</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                    >
                                        <td className="py-4 px-4 text-white font-medium">{employee.name}</td>
                                        <td className="py-4 px-4 text-white/70">{employee.department}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm hidden md:table-cell">{employee.email}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm hidden lg:table-cell">{employee.phone}</td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors">
                                                View Details
                                            </button>
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

export default Employees;
