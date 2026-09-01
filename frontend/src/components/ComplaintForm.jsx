import { useState } from 'react';
import Button from './button.jsx';

const ComplaintForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        location: '',
        image: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const categories = [
        'Road & Infrastructure',
        'Water & Sanitation',
        'Waste Management',
        'Street Lighting',
        'Parks & Recreation',
        'Public Safety',
        'Other'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => handleImageChange(e);
        input.click();
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({
                        ...prev,
                        location: `${latitude}, ${longitude}`
                    }));
                },
                (error) => {
                    alert('Unable to retrieve location. Please enter manually.');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate API call
        setTimeout(() => {
            console.log('Form submitted:', formData);
            alert('Complaint submitted successfully!');
            setFormData({
                title: '',
                category: '',
                description: '',
                location: '',
                image: null
            });
            setImagePreview(null);
            setIsSubmitting(false);
        }, 2000);
    };

    return (
        <section id="complaint-form" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        <span className="text-gray-900">Report a </span>
                        <span className="text-gradient">Civic Issue</span>
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Help us improve your community by reporting issues that need attention.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Issue Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                            placeholder="e.g., Pothole on Main Street"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            id="category"
                            name="category"
                            required
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            required
                            rows="4"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300 resize-none"
                            placeholder="Provide detailed information about the issue..."
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="location"
                                name="location"
                                required
                                value={formData.location}
                                onChange={handleInputChange}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                                placeholder="Address or coordinates"
                            />
                            <Button
                                type="button"
                                label="📍 Auto"
                                variant="secondary"
                                size="small"
                                onClick={handleGetLocation}
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photo Evidence
                        </label>
                        <div className="space-y-4">
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setFormData(prev => ({ ...prev, image: null }));
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 text-center">
                                            📁 Upload Image
                                        </div>
                                    </label>
                                    <Button
                                        type="button"
                                        label="📷 Camera"
                                        variant="secondary"
                                        onClick={handleCameraCapture}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            label={isSubmitting ? "Submitting..." : "Submit Complaint"}
                            variant="primary"
                            size="large"
                            disabled={isSubmitting}
                            className="w-full"
                        />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default ComplaintForm;
