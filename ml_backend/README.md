# ML Backend - FastAPI Service

This FastAPI backend service provides unified predictions from both NLP and CNN models.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure model files are in place:
   - `../ML_models/NLP_Severity_&_Sector.h5`
   - `../ML_models/tokenizer.pkl`
   - `../ML_models/sector_encoder.pkl`
   - `../ML_models/severity_encoder.pkl`
   - `ml_backend/urban_issue_resnet50_final.pth` (CNN model)

3. Run the server:
```bash
python app.py
```

Or using uvicorn directly:
```bash
uvicorn app:app --reload --port 8000
```

## API Endpoints

### POST `/predict`
Accepts form-data with:
- `description` (string): Text description of the issue
- `image` (file): Image file of the issue

Returns:
```json
{
  "nlp_result": {
    "predicted_sector": "...",
    "predicted_severity": "...",
    "sector_confidence": 0.95,
    "severity_confidence": 0.87
  },
  "cnn_result": {
    "predicted_class": "...",
    "confidence": 0.92
  }
}
```

### GET `/`
Health check endpoint that shows model loading status.
