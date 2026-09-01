# CivicMind — AI Classification Migration Notice

The legacy Python FastAPI microservice (`app.py`, `app_simple.py`, ResNet50 CNN, and Keras NLP models) has been **decommissioned and migrated**.

## 🚀 Native Groq Multimodal AI Engine

AI classification for CivicMind is now performed by the official **Groq JavaScript SDK** directly integrated into the backend Node.js server (`backend/src/services/groqService.js`).

### Features of the New AI System:
- **Single Source of Truth**: 13-Class Canonical Municipal Defect Taxonomy ([`backend/src/config/taxonomy.js`](../backend/src/config/taxonomy.js)).
- **Multimodal Classification**: Processes both citizen text descriptions and visual image evidence in a single fast inference pass (<0.5s).
- **Authoritative Municipal Routing**: Deterministic routing resolver mapping defect classes to municipal departments ([`backend/src/config/routingResolver.js`](../backend/src/config/routingResolver.js)).
- **Confidence Safeguards**: 3-tier confidence model with automated admin review flagging for low-confidence (<0.60) classifications.
- **Production Failure Fallback**: Non-crashing graceful fallback preserving complaint submission during API outages.

### Historical Reference Materials
The Jupyter notebooks (`ML_models/CNN_running_code.ipynb`, `ML_models/NLP_runnning_code.ipynb`) and dataset (`complaints_extended.csv`) are retained in this directory strictly for historical ML research and model benchmarking reference.
