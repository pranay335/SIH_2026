import { useState } from 'react';

const Notices = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');

    const notices = [
        {
            id: 1,
            title: 'Road Maintenance Schedule',
            category: 'Infrastructure',
            date: '2024-01-15',
            description: 'Scheduled maintenance work on Main Street from Jan 20-25. Expect minor traffic delays.',
            priority: 'high'
        },
        {
            id: 2,
            title: 'Water Supply Interruption',
            category: 'Utilities',
            date: '2024-01-14',
            description: 'Water supply will be interrupted in Sector 5 on Jan 18, 10 AM - 2 PM for pipeline repairs.',
            priority: 'high'
        },
        {
            id: 3,
            title: 'Community Cleanup Drive',
            category: 'Events',
            date: '2024-01-12',
            description: 'Join us for a community cleanup drive on Jan 20. Volunteers welcome!',
            priority: 'medium'
        },
        {
            id: 4,
            title: 'New Park Opening',
            category: 'Recreation',
            date: '2024-01-10',
            description: 'The new community park in Sector 3 will open on Jan 22. All residents invited!',
            priority: 'low'
        },
        {
            id: 5,
            title: 'Waste Collection Update',
            category: 'Waste Management',
            date: '2024-01-08',
            description: 'Waste collection schedule updated. Check the new timings on our website.',
            priority: 'medium'
        }
    ];

    const categories = ['all', 'Infrastructure', 'Utilities', 'Events', 'Recreation', 'Waste Management'];

    const filteredNotices = selectedFilter === 'all'
        ? notices
        : notices.filter(notice => notice.category === selectedFilter);

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'border-red-400 bg-red-50',
            'medium': 'border-yellow-400 bg-yellow-50',
            'low': 'border-blue-400 bg-blue-50'
        };
        return colors[priority] || 'border-gray-300 bg-gray-50';
    };

    return (
        <section id="notices" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        <span className="text-gray-900">Public </span>
                        <span className="text-gradient">Notices</span>
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Stay informed about important updates and announcements in your community.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedFilter(category)}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 capitalize ${
                                selectedFilter === category
                                    ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                                    : 'glass text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Notices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotices.map((notice) => (
                        <div
                            key={notice.id}
                            className={`glass glass-hover rounded-xl p-6 border-l-4 ${getPriorityColor(notice.priority)} transform transition-all duration-300 ease-in-out hover:scale-105`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#3B82F6] border border-blue-200">
                                    {notice.category}
                                </span>
                                <span className="text-xs text-gray-400">{notice.date}</span>
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
                                <button className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium transition-colors">
                                    Read More →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredNotices.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No notices found for this category.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Notices;
