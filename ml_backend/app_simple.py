import os
import uuid
import random
from datetime import datetime
import warnings

warnings.filterwarnings('ignore')

import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io

# ==============================
# APP INIT
# ==============================
app = FastAPI(title="Urban Complaint ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# MOCK PREDICTION FUNCTIONS
# ==============================
def mock_nlp_prediction(description: str):
    """Mock NLP prediction for testing"""
    sectors = ["Road & Infrastructure", "Water & Sanitation", "Waste Management", "Street Lighting", "Public Safety"]
    severities = ["Low", "Medium", "High"]
    
    # Simple keyword-based mock prediction
    description_lower = description.lower()
    
    if "road" in description_lower or "pothole" in description_lower:
        sector = "Road & Infrastructure"
    elif "water" in description_lower or "pipe" in description_lower or "leak" in description_lower:
        sector = "Water & Sanitation"
    elif "garbage" in description_lower or "waste" in description_lower:
        sector = "Waste Management"
    elif "light" in description_lower or "street light" in description_lower:
        sector = "Street Lighting"
    else:
        sector = random.choice(sectors)
    
    if "dangerous" in description_lower or "urgent" in description_lower or "emergency" in description_lower:
        severity = "High"
    elif "minor" in description_lower or "small" in description_lower:
        severity = "Low"
    else:
        severity = random.choice(severities)
    
    return {
        "predicted_sector": sector,
        "predicted_severity": severity,
        "sector_confidence": round(random.uniform(0.7, 0.95), 2),
        "severity_confidence": round(random.uniform(0.7, 0.95), 2)
    }

def mock_cnn_prediction():
    """Mock CNN prediction for testing"""
    classes = ["Pothole", "Broken Street Light", "Water Leak", "Garbage Accumulation", "Blocked Drain"]
    predicted_class = random.choice(classes)
    
    return {
        "predicted_class": predicted_class,
        "confidence": round(random.uniform(0.7, 0.95), 2)
    }

# ==============================
# API ENDPOINTS
# ==============================
@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "ML Backend is running (Mock Mode)",
        "models_loaded": {
            "nlp_model": False,
            "cnn_model": False,
            "note": "Running in mock mode - actual models not loaded"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict")
async def predict_complaint(
    description: str = Form(...),
    image: UploadFile = File(...)
):
    """
    Predict complaint details from description and image
    Returns mock predictions for testing
    """
    try:
        # Validate inputs
        if not description:
            raise HTTPException(status_code=400, detail="Description is required")
        
        if not image or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Valid image file is required")
        
        # Read image (for validation, not used in mock prediction)
        image_content = await image.read()
        try:
            img = Image.open(io.BytesIO(image_content))
            img.verify()  # Verify image is valid
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Generate mock predictions
        nlp_result = mock_nlp_prediction(description)
        cnn_result = mock_cnn_prediction()
        
        # Generate complaint ID
        complaint_id = f"CM-{datetime.now().year}-{random.randint(1000, 9999)}"
        
        # Determine status based on severity
        severity = nlp_result["predicted_severity"]
        if severity == "High":
            status = "pending"
        elif severity == "Medium":
            status = "pending"
        else:
            status = "pending"
        
        # Return response
        response = {
            "complaint": {
                "complaint_id": complaint_id,
                "description": description,
                "nlp_result": nlp_result,
                "cnn_result": cnn_result,
                "status": status,
                "timestamp": datetime.now().isoformat()
            },
            "message": "Complaint analyzed successfully (Mock Mode)"
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ==============================
# RUN SERVER
# ==============================
if __name__ == "__main__":
    print("🚀 Starting ML Backend (Mock Mode)...")
    print("📝 Note: Running in mock mode - actual ML models not loaded")
    print("🔗 API will be available at: http://localhost:8000")
    print("📖 API docs at: http://localhost:8000/docs")
    
    uvicorn.run(
        "app_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
