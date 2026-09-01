import { useState, useEffect } from 'react';
import Button from '../../components/button.jsx';
import { useAuth } from '../../context/AuthContext';

const AdminNotices = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        priority: 'medium'
    });
    
    const { getToken } = useAuth();


    const departments = ['Infrastructure', 'Utilities', 'Events', 'Recreation', 'Waste Management'];

    // Fetch notices from backend
    const fetchNotices = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/notices', {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch notices');
            }
            
            const data = await response.json();
            setNotices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/notices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create notice');
            }
            
            // Reset form and refresh notices
            setFormData({ title: '', department: '', description: '', priority: 'medium' });
            setIsCreating(false);
            await fetchNotices();
            alert('Notice created successfully!');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDelete = async (noticeId) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/notices/${noticeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete notice');
            }
            
            await fetchNotices();
            alert('Notice deleted successfully!');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'border-red-300 bg-red-50',
            'medium': 'border-yellow-300 bg-yellow-50',
            'low': 'border-blue-300 bg-blue-50'
        };
        return colors[priority] || 'border-gray-300 bg-gray-50';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">
                            <span className="text-gray-900">Manage </span>
                            <span className="text-gradient">Notices</span>
                        </h2>
                        <p className="text-gray-600">
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
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Notice</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    placeholder="Enter notice title"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Department *
                                    </label>
                                    <select
                                        name="department"
                                        required
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    >
                                        <option value="">Select department</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept} className="bg-white">
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority *
                                    </label>
                                    <select
                                        name="priority"
                                        required
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                                    >
                                        <option value="low" className="bg-white">Low</option>
                                        <option value="medium" className="bg-white">Medium</option>
                                        <option value="high" className="bg-white">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    rows="4"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none"
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
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-600">Loading notices...</div>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-red-600">Error: {error}</div>
                    </div>
                ) : notices.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-600">No notices found. Create your first notice!</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notices.map((notice) => (
                            <div
                                key={notice._id}
                                className={`glass glass-hover rounded-xl p-6 border-l-4 ${getPriorityColor(notice.priority)} transform transition-all duration-300 ease-in-out hover:scale-105`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                        {notice.department}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(notice.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {notice.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    {notice.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        notice.priority === 'high' ? 'text-red-600' :
                                        notice.priority === 'medium' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    }`}>
                                        {notice.priority.toUpperCase()} Priority
                                    </span>
                                    <div className="flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(notice._id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNotices;
