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
            'high': 'border-red-500/30 bg-red-500/10',
            'medium': 'border-yellow-500/30 bg-yellow-500/10',
            'low': 'border-blue-500/30 bg-blue-500/10'
        };
        return colors[priority] || 'border-gray-500/30 bg-gray-500/10';
    };

    return (
        <section id="notices" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        <span className="text-white">Public </span>
                        <span className="text-gradient">Notices</span>
                    </h2>
                    <p className="text-white/70 text-lg">
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
                                    : 'glass text-white/70 hover:bg-white/10 hover:text-white'
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
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                                    {notice.category}
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
                                <button className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors">
                                    Read More →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredNotices.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-white/50 text-lg">No notices found for this category.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Notices;
