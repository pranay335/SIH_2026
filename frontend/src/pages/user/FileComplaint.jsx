import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/button.jsx';

const FileComplaint = () => {
    const [formData, setFormData] = useState({
        description: '',
        sector: '',
        location: '',
        image: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const navigate = useNavigate();

    const sectors = [
        'Road',
        'Water',
        'Electricity',
        'Garbage',
        'Drainage'
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
            console.log('Complaint submitted:', formData);
            alert('Complaint submitted successfully!');
            setFormData({
                description: '',
                sector: '',
                location: '',
                image: null
            });
            setImagePreview(null);
            setIsSubmitting(false);
            navigate('/user/my-complaints');
        }, 2000);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        <span className="text-white">File a </span>
                        <span className="text-gradient">Complaint</span>
                    </h2>
                    <p className="text-white/70">
                        Help us improve your community by reporting issues that need attention.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 space-y-6">
                    {/* Sector */}
                    <div>
                        <label htmlFor="sector" className="block text-sm font-medium text-white/90 mb-2">
                            Sector *
                        </label>
                        <select
                            id="sector"
                            name="sector"
                            required
                            value={formData.sector}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
                        >
                            <option value="">Select a sector</option>
                            {sectors.map((sector) => (
                                <option key={sector} value={sector} className="bg-[#0B0F1A]">
                                    {sector}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-white/90 mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            required
                            rows="6"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300 resize-none"
                            placeholder="Provide detailed information about the issue..."
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-white/90 mb-2">
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
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-300"
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
                        <label className="block text-sm font-medium text-white/90 mb-2">
                            Photo Evidence
                        </label>
                        <div className="space-y-4">
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-64 object-cover rounded-lg border border-white/10"
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
                                        <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-all duration-300 text-center">
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
                    <div className="pt-4 flex gap-4">
                        <Button
                            type="button"
                            label="Cancel"
                            variant="secondary"
                            size="large"
                            onClick={() => navigate('/user-dashboard')}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            label={isSubmitting ? "Submitting..." : "Submit Complaint"}
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

export default FileComplaint;
