import { useState } from 'react';
import Button from '../../components/button.jsx';

const AdminNotices = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        priority: 'medium'
    });

    const notices = [
        {
            id: 1,
            title: 'Road Maintenance Schedule',
            department: 'Infrastructure',
            date: '2024-01-15',
            description: 'Scheduled maintenance work on Main Street from Jan 20-25.',
            priority: 'high'
        },
        {
            id: 2,
            title: 'Water Supply Interruption',
            department: 'Utilities',
            date: '2024-01-14',
            description: 'Water supply will be interrupted in Sector 5 on Jan 18.',
            priority: 'high'
        }
    ];

    const departments = ['Infrastructure', 'Utilities', 'Events', 'Recreation', 'Waste Management'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Creating notice:', formData);
        alert('Notice created successfully!');
        setFormData({ title: '', department: '', description: '', priority: 'medium' });
        setIsCreating(false);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'border-red-500/30 bg-red-500/10',
            'medium': 'border-yellow-500/30 bg-yellow-500/10',
            'low': 'border-blue-500/30 bg-blue-500/10'
        };
        return colors[priority] || 'border-gray-500/30 bg-gray-500/10';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">
                            <span className="text-white">Manage </span>
                            <span className="text-gradient">Notices</span>
                        </h2>
                        <p className="text-white/70">
                            Create and manage public notices for citizens.
                        </p>
                    </div>
                    <Button
                        label={isCreating ? "Cancel" : "+ Create Notice"}
                        variant={isCreating ? "secondary" : "primary"}
                        onClick={() => setIsCreating(!isCreating)}
                    />
                </div>

                {/* Create Notice Form */}
                {isCreating && (
                    <div className="glass rounded-xl p-6 mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Create New Notice</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    placeholder="Enter notice title"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/90 mb-2">
                                        Department *
                                    </label>
                                    <select
                                        name="department"
                                        required
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    >
                                        <option value="">Select department</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept} className="bg-[#0B0F1A]">
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/90 mb-2">
                                        Priority *
                                    </label>
                                    <select
                                        name="priority"
                                        required
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    >
                                        <option value="low" className="bg-[#0B0F1A]">Low</option>
                                        <option value="medium" className="bg-[#0B0F1A]">Medium</option>
                                        <option value="high" className="bg-[#0B0F1A]">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    rows="4"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none"
                                    placeholder="Enter notice description"
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    label="Cancel"
                                    variant="secondary"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setFormData({ title: '', department: '', description: '', priority: 'medium' });
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    type="submit"
                                    label="Create Notice"
                                    variant="primary"
                                    className="flex-1"
                                />
                            </div>
                        </form>
                    </div>
                )}

                {/* Existing Notices */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map((notice) => (
                        <div
                            key={notice.id}
                            className={`glass glass-hover rounded-xl p-6 border-l-4 ${getPriorityColor(notice.priority)} transform transition-all duration-300 ease-in-out hover:scale-105`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                                    {notice.department}
                                </span>
                                <span className="text-xs text-white/50">{notice.date}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                {notice.title}
                            </h3>
                            <p className="text-white/70 text-sm leading-relaxed mb-4">
                                {notice.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    notice.priority === 'high' ? 'text-red-400' :
                                    notice.priority === 'medium' ? 'text-yellow-400' :
                                    'text-blue-400'
                                }`}>
                                    {notice.priority.toUpperCase()} Priority
                                </span>
                                <div className="flex gap-2">
                                    <button className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors">
                                        Edit
                                    </button>
                                    <button className="text-red-400 hover:text-red-500 text-sm font-medium transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminNotices;
