import { useState } from 'react';
import Button from '../../components/button.jsx';

const UserNotices = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const notices = [
        {
            id: 1,
            title: 'Road Maintenance Schedule',
            department: 'Infrastructure',
            date: '2024-01-15',
            description: 'Scheduled maintenance work on Main Street from Jan 20-25. Expect minor traffic delays. The maintenance includes resurfacing of the main carriageway, repair of damaged sidewalks, and replacement of street lighting fixtures.',
            fullDescription: 'The Municipal Corporation will be conducting comprehensive road maintenance work on Main Street between January 20-25, 2024. This essential maintenance includes: 1) Complete resurfacing of the main carriageway to repair potholes and smooth the road surface, 2) Repair and replacement of damaged sidewalks and curbs, 3) Installation of new street lighting fixtures for better visibility, 4) Road marking and signage improvements. Traffic will be diverted through alternate routes. Residents are advised to plan their commute accordingly and use public transport where possible. Emergency services will have access throughout the maintenance period.',
            priority: 'high',
            contactPerson: 'John Smith',
            contactPhone: '+1234567890',
            affectedAreas: ['Main Street', 'Sector 5', 'Commercial Complex'],
            estimatedDuration: '5 days'
        },
        {
            id: 2,
            title: 'Water Supply Interruption',
            department: 'Utilities',
            date: '2024-01-14',
            description: 'Water supply will be interrupted in Sector 5 on Jan 18, 10 AM - 2 PM for pipeline repairs.',
            fullDescription: 'Essential pipeline repair work will be conducted on January 18, 2024, affecting water supply in Sector 5. The interruption will last from 10:00 AM to 2:00 PM. This work is necessary to replace aging pipes and prevent future leaks. Residents are advised to store sufficient water for their daily needs. Water tankers will be available at designated locations: Community Center, Sector 5 Park, and Main Market. We apologize for the inconvenience and appreciate your cooperation.',
            priority: 'high',
            contactPerson: 'Sarah Johnson',
            contactPhone: '+1234567891',
            affectedAreas: ['Sector 5', 'Sector 5A', 'Sector 5B'],
            estimatedDuration: '4 hours'
        },
        {
            id: 3,
            title: 'Community Cleanup Drive',
            department: 'Events',
            date: '2024-01-12',
            description: 'Join us for a community cleanup drive on Jan 20. Volunteers welcome!',
            fullDescription: 'Be part of the change! Join our Community Cleanup Drive on January 20, 2024, starting at 8:00 AM. We will be cleaning public spaces, planting trees, and spreading awareness about waste management. Volunteers will receive certificates and refreshments. Meeting point: Community Center, Sector 3. Bring your enthusiasm - we\'ll provide gloves, masks, and cleaning equipment. Let\'s work together to make our city cleaner and greener!',
            priority: 'medium',
            contactPerson: 'Mike Wilson',
            contactPhone: '+1234567892',
            affectedAreas: ['Sector 3', 'Community Park', 'Market Area'],
            estimatedDuration: '6 hours'
        },
        {
            id: 4,
            title: 'New Park Opening',
            department: 'Recreation',
            date: '2024-01-10',
            description: 'The new community park in Sector 3 will open on Jan 22. All residents invited!',
            fullDescription: 'We are excited to announce the grand opening of our new community park in Sector 3 on January 22, 2024! The park features: 1) Children\'s play area with modern equipment, 2) Jogging and walking tracks, 3) Outdoor gym equipment, 4) Beautiful landscaping with native plants, 5) Seating areas and picnic spots, 6) 24/7 security and lighting. Opening ceremony at 10:00 AM with special cultural programs. Come and be part of this wonderful addition to our community!',
            priority: 'low',
            contactPerson: 'David Lee',
            contactPhone: '+1234567893',
            affectedAreas: ['Sector 3', 'Park Area'],
            estimatedDuration: 'Ongoing'
        },
        {
            id: 5,
            title: 'Waste Collection Update',
            department: 'Waste Management',
            date: '2024-01-08',
            description: 'Waste collection schedule updated. Check new timings on our website.',
            fullDescription: 'Effective January 15, 2024, waste collection schedules have been revised for better efficiency: Morning collection: 6:00 AM - 9:00 AM, Evening collection: 4:00 PM - 7:00 PM. Segregated waste collection: Every Tuesday and Friday. Please ensure waste is properly segregated and placed in designated bins by collection time. For any queries or missed collections, contact our 24/7 helpline. Your cooperation helps us serve you better!',
            priority: 'medium',
            contactPerson: 'Lisa Chen',
            contactPhone: '+1234567894',
            affectedAreas: ['All Sectors'],
            estimatedDuration: 'Ongoing'
        }
    ];

    const departments = ['all', 'Infrastructure', 'Utilities', 'Events', 'Recreation', 'Waste Management'];

    const filteredNotices = selectedFilter === 'all'
        ? notices
        : notices.filter(notice => notice.department === selectedFilter);

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'border-red-500/30 bg-red-500/10',
            'medium': 'border-yellow-500/30 bg-yellow-500/10',
            'low': 'border-blue-500/30 bg-blue-500/10'
        };
        return colors[priority] || 'border-gray-500/30 bg-gray-500/10';
    };

    const handleReadMore = (notice) => {
        setSelectedNotice(notice);
        setShowDetailsModal(true);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">Public </span>
                        <span className="text-gradient">Notices</span>
                    </h2>
                    <p className="text-white/70">
                        Stay informed about important updates and announcements in your community.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {departments.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setSelectedFilter(dept)}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 capitalize ${
                                selectedFilter === dept
                                    ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                                    : 'glass text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {dept}
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
                                <button 
                                    onClick={() => handleReadMore(notice)}
                                    className="text-[#60A5FA] hover:text-[#3B82F6] text-sm font-medium transition-colors"
                                >
                                    Read More →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredNotices.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-white/50 text-lg">No notices found for this department.</p>
                    </div>
                )}

                {/* Notice Details Modal */}
                {showDetailsModal && selectedNotice && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 md:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            {selectedNotice.title}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                                                {selectedNotice.department}
                                            </span>
                                            <span className="text-xs text-white/50">{selectedNotice.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            selectedNotice.priority === 'high' ? 'text-red-400 bg-red-500/20 border-red-500/30' :
                                            selectedNotice.priority === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                                            'text-blue-400 bg-blue-500/20 border-blue-500/30'
                                        }`}>
                                            {selectedNotice.priority.toUpperCase()} PRIORITY
                                        </span>
                                        <button
                                            onClick={() => setShowDetailsModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Notice Content */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-white/80 text-lg font-medium mb-3">Full Details</h4>
                                        <p className="text-white/70 leading-relaxed">
                                            {selectedNotice.fullDescription || selectedNotice.description}
                                        </p>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-white/80 text-sm font-medium mb-3">Contact Information</h4>
                                            <div className="glass rounded-lg p-4 space-y-3">
                                                {selectedNotice.contactPerson && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white text-sm font-semibold">
                                                            {selectedNotice.contactPerson?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{selectedNotice.contactPerson}</p>
                                                            <p className="text-white/60 text-xs">Contact Person</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedNotice.contactPhone && (
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span className="text-white/70 text-sm">{selectedNotice.contactPhone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-white/80 text-sm font-medium mb-3">Impact Information</h4>
                                            <div className="glass rounded-lg p-4 space-y-3">
                                                {selectedNotice.estimatedDuration && (
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60 text-sm">Duration:</span>
                                                        <span className="text-white text-sm">{selectedNotice.estimatedDuration}</span>
                                                    </div>
                                                )}
                                                {selectedNotice.affectedAreas && selectedNotice.affectedAreas.length > 0 && (
                                                    <div>
                                                        <span className="text-white/60 text-sm block mb-2">Affected Areas:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedNotice.affectedAreas.map((area, index) => (
                                                                <span key={index} className="px-2 py-1 bg-white/10 rounded text-white text-xs">
                                                                    {area}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t border-white/10">
                                    <Button
                                        label="Close"
                                        variant="secondary"
                                        onClick={() => setShowDetailsModal(false)}
                                        className="flex-1"
                                    />
                                    {selectedNotice.priority === 'high' && (
                                        <Button
                                            label="Set Reminder"
                                            variant="primary"
                                            className="flex-1"
                                        />
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

export default UserNotices;
