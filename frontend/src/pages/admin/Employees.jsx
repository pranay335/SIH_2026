import React, { useState, useEffect } from 'react';
import { userService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

const Employees = () => {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await userService.getEmployees();
            // Filter employees by admin's municipality
            const filteredEmployees = response.data.filter(employee => 
                employee.municipalityCode === user.municipalityCode
            );
            setEmployees(filteredEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    // Mock complaints data - in real app this would come from API
    const complaintsData = {
        1: [ // John Smith's assigned complaints
            {
                id: 'CM-2024-156',
                citizenName: 'John Doe',
                citizenPhone: '+9876543210',
                sector: 'Road',
                location: 'Main Street, Sector 5',
                description: 'Large pothole causing traffic hazards and potential damage to vehicles. The hole is approximately 2 feet wide and 6 inches deep.',
                image: 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Pothole+Damage',
                urgency: 'high',
                status: 'in-progress',
                date: '2024-01-15',
                assignedDate: '2024-01-15'
            },
            {
                id: 'CM-2024-153',
                citizenName: 'Alice Williams',
                citizenPhone: '+9876543211',
                sector: 'Road',
                location: 'School Road, Sector 4',
                description: 'Broken traffic signal not working for 3 days, causing confusion at intersection near school.',
                image: 'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Broken+Signal',
                urgency: 'high',
                status: 'pending',
                date: '2024-01-11',
                assignedDate: '2024-01-12'
            }
        ],
        2: [ // Sarah Johnson's assigned complaints
            {
                id: 'CM-2024-158',
                citizenName: 'Mike Davis',
                citizenPhone: '+9876543212',
                sector: 'Road',
                location: 'Highway 101, Mile 15',
                description: 'Street lights not working on major highway, creating dangerous night driving conditions.',
                image: 'https://via.placeholder.com/400x300/333333/FFFFFF?text=Dark+Street',
                urgency: 'medium',
                status: 'in-progress',
                date: '2024-01-16',
                assignedDate: '2024-01-16'
            }
        ],
        3: [ // Emily Brown's assigned complaints
            {
                id: 'CM-2024-155',
                citizenName: 'Jane Smith',
                citizenPhone: '+9876543213',
                sector: 'Water',
                location: 'Park Road, Sector 3',
                description: 'Water pipe burst causing flooding in residential area. Water contamination concerns.',
                image: 'https://via.placeholder.com/400x300/0066CC/FFFFFF?text=Water+Leak',
                urgency: 'medium',
                status: 'resolved',
                date: '2024-01-14',
                assignedDate: '2024-01-14'
            },
            {
                id: 'CM-2024-160',
                citizenName: 'Robert Johnson',
                citizenPhone: '+9876543214',
                sector: 'Water',
                location: 'Garden Street, Sector 7',
                description: 'No water supply for past 48 hours affecting entire neighborhood.',
                image: 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=No+Water',
                urgency: 'high',
                status: 'in-progress',
                date: '2024-01-17',
                assignedDate: '2024-01-17'
            }
        ]
    };

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

    const handleViewDetails = (employee) => {
        setSelectedEmployee(employee);
        setShowDetailsModal(true);
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-8">
                        <p className="text-white/70">Loading employees...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-8">
                        <p className="text-red-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const employeeComplaints = selectedEmployee ? [] : []; // TODO: Fetch real complaints from API

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">Employee </span>
                        <span className="text-gradient">Management</span>
                    </h2>
                    <p className="text-white/70">
                        View and manage municipal employees and their assigned complaints for {user?.municipalityCode?.toUpperCase() || 'your municipality'}.
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
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8">
                                            <p className="text-white/50">No employees found for {user?.municipalityCode?.toUpperCase() || 'your municipality'}.</p>
                                            <p className="text-white/30 text-sm mt-2">Add employees through the Employee Management page.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((employee) => (
                                        <tr
                                            key={employee._id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
                                        >
                                            <td className="py-4 px-4 text-white font-medium">{employee.name}</td>
                                            <td className="py-4 px-4 text-white/70">{employee.department}</td>
                                            <td className="py-4 px-4 text-white/60 text-sm hidden md:table-cell">{employee.email}</td>
                                            <td className="py-4 px-4 text-white/60 text-sm hidden lg:table-cell">{employee.phone}</td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                    {employee.availabilityStatus || 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <button 
                                                    onClick={() => handleViewDetails(employee)}
                                                    className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Employee Details Modal */}
                {showDetailsModal && selectedEmployee && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{selectedEmployee.name}</h3>
                                        <p className="text-white/70">{selectedEmployee.department}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="p-2 hover:bg-gray-800 rounded-lg text-white transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                {/* Employee Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Email</p>
                                        <p className="text-white font-medium">{selectedEmployee.email}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Phone</p>
                                        <p className="text-white font-medium">{selectedEmployee.phone || 'Not provided'}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Employee ID</p>
                                        <p className="text-white font-medium">{selectedEmployee.employeeId || 'Not assigned'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Department</p>
                                        <p className="text-white font-medium">{selectedEmployee.department}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Designation</p>
                                        <p className="text-white font-medium">{selectedEmployee.designation || 'Field Officer'}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Availability</p>
                                        <p className="text-white font-medium">{selectedEmployee.availabilityStatus || 'AVAILABLE'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Current Workload</p>
                                        <p className="text-white font-medium">{selectedEmployee.currentWorkload || 0}/{selectedEmployee.maxConcurrentComplaints || 10} complaints</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-white/60 text-sm mb-1">Municipality</p>
                                        <p className="text-white font-medium">{selectedEmployee.municipalityCode?.toUpperCase() || 'Not assigned'}</p>
                                    </div>
                                </div>

                                {/* Complaints List */}
                                <div className="space-y-4">
                                    <h4 className="text-xl font-semibold text-white">Assigned Complaints</h4>
                                    
                                    {employeeComplaints.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-white/50">No complaints assigned to this employee yet.</p>
                                            <p className="text-white/30 text-sm mt-2">Assigned complaints will appear here once complaints are filed and auto-assigned.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                            {/* TODO: Replace with real complaints data from API */}
                                            <div className="text-center py-8">
                                                <p className="text-white/50">Complaints data will be loaded from API</p>
                                            </div>
                                        </div>
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

export default Employees;
