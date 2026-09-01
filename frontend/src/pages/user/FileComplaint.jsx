import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/button.jsx';
import { complaintService } from '../../services/apiService.js';

const FileComplaint = () => {
    const [formData, setFormData] = useState({
        description: '',
        image: null,
        location: ''
    });

    const [readableAddress, setReadableAddress] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [predictionResult, setPredictionResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { user } = useAuth();

    /* -------------------- Handlers -------------------- */

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));

            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsFetchingLocation(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const locString = `${lat}, ${lng}`;

                setFormData((prev) => ({ ...prev, location: locString }));

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    );
                    const data = await response.json();
                    setReadableAddress(data.display_name || locString);
                } catch {
                    setReadableAddress(locString);
                } finally {
                    setIsFetchingLocation(false);
                }
            },
            () => {
                setError('Unable to retrieve your location');
                setIsFetchingLocation(false);
            }
        );
    };

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
            /* Build complaint payload — Groq Multimodal AI performs classification on backend */
            const complaintPayload = {
                complaint_id: `CMP-${Date.now()}`,
                description: formData.description,
                location: formData.location,
                image: imagePreview,
                municipalityCode: user?.municipalityCode || 'BMC',
                user_id: user?._id
            };

            console.log('Final Complaint Payload:', complaintPayload);

            /* Save complaint via Express backend */
            const savedComplaint =
                await complaintService.fileComplaint(complaintPayload);

            console.log('✅ Full Backend API Response:', savedComplaint);

            setPredictionResult({
                message: savedComplaint.message,
                complaint: savedComplaint.complaint,
                deduplication: savedComplaint.deduplication,
                rawResponse: savedComplaint
            });

        } catch (err) {
            console.error('Filing error:', err);
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
        setReadableAddress('');
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
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Location (Coordinates)"
                            className="flex-1 p-3 rounded bg-white/5 text-white"
                            required
                        />
                        <Button
                            type="button"
                            label={isFetchingLocation ? '⌛...' : '📍 Auto'}
                            variant="secondary"
                            onClick={handleGetLocation}
                            disabled={isFetchingLocation}
                        />
                    </div>
                    {readableAddress && (
                        <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-100 flex items-start gap-2">
                            <span className="text-lg">📍</span>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-blue-300 font-semibold mb-1">Detected Address</p>
                                <p className="text-sm font-medium">{readableAddress}</p>
                            </div>
                        </div>
                    )}
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
                        className="rounded-lg border border-white/10 max-h-64 object-cover w-full"
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
                        label="Reset"
                        variant="secondary"
                        onClick={handleReset}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        label={isSubmitting ? 'Analyzing & Filing...' : 'File Complaint'}
                        variant="primary"
                        disabled={isSubmitting}
                        className="flex-1"
                    />
                </div>
            </form>

            {/* Result & API Output Card */}
            {predictionResult && (
                <div className={`mt-6 p-6 rounded-xl border ${predictionResult.complaint?.status === 'Rejected' ? 'bg-red-950/40 border-red-500/30 text-red-200' : predictionResult.complaint?.status === 'Flagged' ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-200' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">
                            {predictionResult.complaint?.status === 'Rejected' ? '❌' : predictionResult.complaint?.status === 'Flagged' ? '⚠️' : '✅'}
                        </span>
                        <div>
                            <h3 className="text-lg font-bold">
                                {predictionResult.complaint?.status === 'Rejected' ? 'Complaint Rejected (Suspicious Content)' : predictionResult.message}
                            </h3>
                            <p className="text-xs text-white/60">ID: {predictionResult.complaint?.complaint_id}</p>
                        </div>
                    </div>

                    {(predictionResult.complaint?.status === 'Flagged' || predictionResult.complaint?.status === 'Rejected') && (
                       <p className="mt-2 text-sm p-3 rounded bg-white/5 border border-white/10 font-medium">
                         <b>Notice:</b> {predictionResult.complaint?.flagReason}
                       </p>
                    )}

                    {/* Groq AI Classification Breakdown */}
                    {predictionResult.complaint?.aiClassification && (
                        <div className="mt-4 p-4 rounded-lg bg-black/40 border border-white/10 space-y-2">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">🤖 Groq Multimodal AI Output</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                    {predictionResult.complaint.aiClassification.provider} ({predictionResult.complaint.aiClassification.model})
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-white/50">Defect Class:</span> <b className="text-white font-mono">{predictionResult.complaint.aiClassification.defectClass}</b></div>
                                <div><span className="text-white/50">Priority/Severity:</span> <b className="text-white">{predictionResult.complaint.priority}</b></div>
                                <div><span className="text-white/50">Confidence:</span> <b className="text-white">{(predictionResult.complaint.aiClassification.confidence * 100).toFixed(1)}% ({predictionResult.complaint.aiClassification.confidenceTier})</b></div>
                                <div><span className="text-white/50">Status:</span> <b className="text-white">{predictionResult.complaint.status}</b></div>
                            </div>
                            {predictionResult.complaint.aiClassification.detectedIssue && (
                                <div className="text-xs pt-1">
                                    <span className="text-white/50">Detected Issue:</span> <span className="text-white font-medium">{predictionResult.complaint.aiClassification.detectedIssue}</span>
                                </div>
                            )}
                            {predictionResult.complaint.aiClassification.evidence && (
                                <div className="text-xs pt-1">
                                    <span className="text-white/50">AI Evidence:</span> <span className="text-white/80 italic">{predictionResult.complaint.aiClassification.evidence}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expandable Raw JSON Response Viewer */}
                    <details className="mt-4 text-xs">
                        <summary className="cursor-pointer font-mono text-emerald-400 hover:underline select-none">
                            🔍 View Full Raw API Response (JSON)
                        </summary>
                        <pre className="mt-2 p-3 rounded bg-black/80 text-emerald-300 overflow-x-auto max-h-64 font-mono text-[11px]">
                            {JSON.stringify(predictionResult.rawResponse, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
};

export default FileComplaint;
