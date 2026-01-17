import { useState } from 'react';
import Button from './button.jsx';

const AssignComplaintModal = ({ isOpen, onClose, complaintId, onAssign }) => {
    const [formData, setFormData] = useState({
        department: '',
        employee: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const departments = [
        'Road & Infrastructure',
        'Water & Sanitation',
        'Electricity',
        'Waste Management',
        'Drainage'
    ];

    const employees = {
        'Road & Infrastructure': ['John Smith', 'Sarah Johnson', 'Mike Davis'],
        'Water & Sanitation': ['Emily Brown', 'David Wilson', 'Lisa Anderson'],
        'Electricity': ['Tom Miller', 'Amy Taylor', 'Chris Martinez'],
        'Waste Management': ['Jessica Lee', 'Robert Garcia', 'Maria Rodriguez'],
        'Drainage': ['James White', 'Patricia Harris', 'Daniel Clark']
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'department') {
            setFormData(prev => ({ ...prev, employee: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            onAssign(complaintId, formData);
            setFormData({ department: '', employee: '' });
            setIsSubmitting(false);
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass rounded-2xl p-6 md:p-8 w-full max-w-md transform transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                        Assign Complaint
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-white/70 text-sm mb-2">Complaint ID:</p>
                    <p className="text-white font-mono font-semibold">{complaintId}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Department */}
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-white/90 mb-2">
                            Select Department *
                        </label>
                        <select
                            id="department"
                            name="department"
                            required
                            value={formData.department}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                        >
                            <option value="">Select a department</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept} className="bg-[#0B0F1A]">
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Employee */}
                    <div>
                        <label htmlFor="employee" className="block text-sm font-medium text-white/90 mb-2">
                            Select Employee *
                        </label>
                        <select
                            id="employee"
                            name="employee"
                            required
                            value={formData.employee}
                            onChange={handleInputChange}
                            disabled={!formData.department}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Select an employee</option>
                            {formData.department && employees[formData.department]?.map((emp) => (
                                <option key={emp} value={emp} className="bg-[#0B0F1A]">
                                    {emp}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            label="Cancel"
                            variant="secondary"
                            size="large"
                            onClick={onClose}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            label={isSubmitting ? "Assigning..." : "Assign"}
                            variant="primary"
                            size="large"
                            disabled={isSubmitting}
                            className="flex-1"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignComplaintModal;
