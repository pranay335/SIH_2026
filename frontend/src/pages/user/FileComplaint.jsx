import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';
import { predictionService, complaintService } from '../../services/apiService.js';

const FileComplaint = () => {
    const [formData, setFormData] = useState({
        description: '',
        image: null,
        location: ''
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [predictionResult, setPredictionResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { user } = useAuth();

    /* -------------------- Handlers -------------------- */

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData(prev => ({ ...prev, image: file }));

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setFormData(prev => ({
                    ...prev,
                    location: `${latitude}, ${longitude}`
                }));
            },
            () => setError('Failed to fetch location')
        );
    };

    /* -------------------- FIXED SUBMIT LOGIC -------------------- */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.description || !formData.image || !formData.location) {
            setError('Description, image and location are required');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setPredictionResult(null);

        try {
            /* 1️⃣ Call ML backend */
            const predictionResponse =
                await predictionService.predictComplaint(
                    formData.description,
                    formData.image
                );

            console.log('ML Backend Response:', predictionResponse);

            /* 2️⃣ Normalize ML response */
            const mlComplaint =
                predictionResponse.complaint || predictionResponse;

            /* ✅ GUARANTEED sector */
            const sector =
                mlComplaint?.nlp_result?.predicted_sector ?? 'General';

            /* 3️⃣ Build payload for main backend */
            const complaintPayload = {
                complaint_id: `CMP-${Date.now()}`,
                description: formData.description,
                location: formData.location,
                image: imagePreview,               // base64 image
                sector: String(sector),             // 🔥 FIX
                priority: 'Medium',
                status: 'Pending',
                nlp_result: mlComplaint?.nlp_result || {},
                cnn_result: mlComplaint?.cnn_result || {},
                user_id: user.id
            };

            console.log('Final Payload:', complaintPayload);

            /* 4️⃣ Save complaint */
            const savedComplaint =
                await complaintService.fileComplaint(complaintPayload);

            setPredictionResult({
                message: savedComplaint.message,
                complaint: savedComplaint.complaint
            });

        } catch (err) {
            console.error('Prediction/Filing error:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({ description: '', image: null, location: '' });
        setImagePreview(null);
        setPredictionResult(null);
        setError(null);
    };

    /* -------------------- UI -------------------- */

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-white">
                File a Complaint
            </h2>

            <form onSubmit={handleSubmit} className="glass p-6 rounded-xl space-y-6">

                {/* Description */}
                <textarea
                    name="description"
                    placeholder="Describe the issue..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded bg-white/5 text-white"
                    rows={5}
                    required
                />

                {/* Location */}
                <div className="flex gap-2">
                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Location"
                        className="flex-1 p-3 rounded bg-white/5 text-white"
                        required
                    />
                    <Button
                        type="button"
                        label="📍 Auto"
                        variant="secondary"
                        onClick={handleGetLocation}
                    />
                </div>

                {/* Image */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-white"
                    required
                />

                {imagePreview && (
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-lg border border-white/10"
                    />
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-500/20 text-red-300 p-3 rounded">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        label="Cancel"
                        variant="secondary"
                        onClick={() => navigate('/user-dashboard')}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        label={isSubmitting ? 'Submitting...' : 'File Complaint'}
                        variant="primary"
                        disabled={isSubmitting}
                        className="flex-1"
                    />
                </div>
            </form>

            {/* Success */}
            {predictionResult && (
                <div className="mt-6 bg-green-500/20 text-green-300 p-4 rounded">
                    ✅ {predictionResult.message}
                </div>
            )}
        </div>
    );
};

export default FileComplaint;
