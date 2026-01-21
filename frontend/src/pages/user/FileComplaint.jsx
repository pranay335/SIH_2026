import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/button.jsx';
import { predictionService, complaintService } from '../../services/apiService.js';

const FileComplaint = () => {
    const [formData, setFormData] = useState({
        description: '',
        image: null,
        location: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [predictionResult, setPredictionResult] = useState(null);
    const [error, setError] = useState(null);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (showCameraModal && stream) {
            const video = document.getElementById('camera-video');
            if (video) {
                video.srcObject = stream;
            }
        }
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [showCameraModal, stream]);

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

    const startCamera = async () => {
        try {
            setCameraError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            setShowCameraModal(true);
        } catch (error) {
            console.error('Camera access error:', error);
            setCameraError('Unable to access camera. Please check permissions or use file upload.');
            
            // Fallback to basic file input with camera
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = (e) => handleImageChange(e);
            input.click();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCameraModal(false);
    };

    const capturePhoto = () => {
        const video = document.getElementById('camera-video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            stopCamera();
        }, 'image/jpeg', 0.95);
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
                    setError('Unable to retrieve location. Please enter manually.');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.description || !formData.image || !formData.location) {
            setError('Please provide description, image, and location');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setPredictionResult(null);

        try {
            // Call ML backend API for predictions
            const predictionResponse = await predictionService.predictComplaint(
                formData.description,
                formData.image
            );

            // Prepare complaint data to save in main backend
            const complaintData = {
                complaint_id: predictionResponse.complaint.complaint_id,
                description: formData.description,
                location: formData.location,
                image: imagePreview, // Store base64 image
                nlp_result: predictionResponse.complaint.nlp_result,
                cnn_result: predictionResponse.complaint.cnn_result,
                status: predictionResponse.complaint.status,
            };

            // Save complaint to main backend database
            const savedComplaint = await complaintService.fileComplaint(complaintData);

            // Set prediction result to display
            setPredictionResult({
                message: savedComplaint.message,
                complaint: savedComplaint.complaint,
            });
            
        } catch (err) {
            console.error('Prediction/Filing error:', err);
            setError(err.message || 'Failed to process complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            description: '',
            image: null,
            location: ''
        });
        setImagePreview(null);
        setPredictionResult(null);
        setError(null);
        setCameraError(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCameraModal(false);
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

                    {/* Image Upload/Camera */}
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                            Photo Evidence *
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
                                <Button
                                    type="button"
                                    label="📷 Camera"
                                    variant="secondary"
                                    onClick={startCamera}
                                    className="w-full"
                                />
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

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
                            label={isSubmitting ? "Analyzing..." : "File Complaint"}
                            variant="primary"
                            size="large"
                            disabled={isSubmitting || !formData.description || !formData.image || !formData.location}
                            className="flex-1"
                        />
                    </div>
                </form>

                {/* Prediction Results */}
                {predictionResult && predictionResult.complaint && (
                    <div className="mt-8 glass rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">
                                <span className="text-gradient">Prediction Results</span>
                            </h3>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm"
                            >
                                File Another Complaint
                            </button>
                        </div>

                        {/* Success Message */}
                        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                            <p className="font-medium text-lg">✓ {predictionResult.message}</p>
                            <p className="text-sm mt-1">Complaint ID: {predictionResult.complaint.complaint_id}</p>
                            <p className="text-sm mt-1">Location: {predictionResult.complaint.location}</p>
                        </div>

                        {/* Image Classification */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="text-2xl">🖼️</span>
                                Image Classification
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80">Identified Image Type:</span>
                                    <span className="text-white font-semibold text-lg">
                                        {predictionResult.complaint.cnn_result.predicted_class}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80">Confidence:</span>
                                    <span className="text-[#3B82F6] font-semibold">
                                        {(predictionResult.complaint.cnn_result.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${predictionResult.complaint.cnn_result.confidence * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NLP Predictions */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="text-2xl">📝</span>
                                Text Analysis Results
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Sector Prediction */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">Predicted Sector:</span>
                                        <span className="text-white font-semibold">
                                            {predictionResult.complaint.nlp_result.predicted_sector}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">Confidence:</span>
                                        <span className="text-[#10B981] font-semibold">
                                            {(predictionResult.complaint.nlp_result.sector_confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#10B981] to-[#3B82F6] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${predictionResult.complaint.nlp_result.sector_confidence * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Severity Prediction */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">Predicted Severity:</span>
                                        <span className={`font-semibold ${
                                            predictionResult.complaint.nlp_result.predicted_severity === 'High' || 
                                            predictionResult.complaint.nlp_result.predicted_severity === '2' ||
                                            predictionResult.complaint.nlp_result.predicted_severity === 2
                                                ? 'text-red-400' 
                                                : predictionResult.complaint.nlp_result.predicted_severity === 'Medium' ||
                                                  predictionResult.complaint.nlp_result.predicted_severity === '1' ||
                                                  predictionResult.complaint.nlp_result.predicted_severity === 1
                                                ? 'text-yellow-400'
                                                : 'text-green-400'
                                        }`}>
                                            {predictionResult.complaint.nlp_result.predicted_severity}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">Confidence:</span>
                                        <span className="text-[#F59E0B] font-semibold">
                                            {(predictionResult.complaint.nlp_result.severity_confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#F59E0B] to-[#EF4444] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${predictionResult.complaint.nlp_result.severity_confidence * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-white/80">Status:</span>
                                <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg font-semibold">
                                    {predictionResult.complaint.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-white">📷 Capture Photo</h3>
                                <button
                                    onClick={stopCamera}
                                    className="p-2 hover:bg-gray-800 rounded-lg text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {cameraError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-400 mb-4">❌ {cameraError}</div>
                                    <button
                                        onClick={stopCamera}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                                        <video
                                            id="camera-video"
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                            style={{ transform: 'scaleX(-1)' }}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={stopCamera}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={capturePhoto}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            📸 Capture Photo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileComplaint;
