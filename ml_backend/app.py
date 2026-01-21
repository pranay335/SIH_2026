import os
import re
import pickle
import uuid
import numpy as np
from pathlib import Path
from datetime import datetime
import warnings

warnings.filterwarnings('ignore')

import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

import torch
import torch.nn as nn
from torchvision import models, transforms
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
# GLOBALS
# ==============================
nlp_model = None
tokenizer = None
sector_encoder = None
severity_encoder = None
cnn_model = None
cnn_class_names = None
cnn_transform = None

MAX_LEN = 50

# ==============================
# PATHS
# ==============================
CURRENT_DIR = Path(__file__).parent
ML_MODELS_DIR = CURRENT_DIR / "ML_models"

NLP_MODEL_PATH = ML_MODELS_DIR / "NLP.h5"
TOKENIZER_PATH = ML_MODELS_DIR / "tokenizer.pkl"
SECTOR_ENCODER_PATH = ML_MODELS_DIR / "sector_encoder.pkl"
SEVERITY_ENCODER_PATH = ML_MODELS_DIR / "severity_encoder.pkl"
CNN_MODEL_PATH = ML_MODELS_DIR / "cnn.pth"

print("\n========== MODEL PATHS ==========")
print(f"ML folder: {ML_MODELS_DIR}")
print(f"NLP exists: {NLP_MODEL_PATH.exists()}")
print(f"Tokenizer exists: {TOKENIZER_PATH.exists()}")
print(f"Sector encoder exists: {SECTOR_ENCODER_PATH.exists()}")
print(f"Severity encoder exists: {SEVERITY_ENCODER_PATH.exists()}")
print(f"CNN exists: {CNN_MODEL_PATH.exists()}")
print("=================================\n")

# ==============================
# TEXT CLEANING
# ==============================
def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z ]", "", text)
    return text

# ==============================
# LOAD NLP
# ==============================
def load_nlp_model():
    global nlp_model, tokenizer, sector_encoder, severity_encoder

    print("[NLP] Loading model...")

    if not NLP_MODEL_PATH.exists():
        print("[NLP] ❌ Model file missing")
        return False

    nlp_model = load_model(str(NLP_MODEL_PATH))

    with open(TOKENIZER_PATH, "rb") as f:
        tokenizer = pickle.load(f)

    with open(SECTOR_ENCODER_PATH, "rb") as f:
        sector_encoder = pickle.load(f)

    with open(SEVERITY_ENCODER_PATH, "rb") as f:
        severity_encoder = pickle.load(f)

    print("[NLP] ✅ Loaded successfully")
    return True

# ==============================
# LOAD CNN
# ==============================
def load_cnn_model():
    global cnn_model, cnn_class_names, cnn_transform

    if not CNN_MODEL_PATH.exists():
        print("[CNN] ❌ Model missing — CNN disabled")
        return False

    print("[CNN] Loading model...")

    checkpoint = torch.load(str(CNN_MODEL_PATH), map_location="cpu")

    if isinstance(checkpoint, dict) and "model_state" in checkpoint:
        model_state = checkpoint["model_state"]
        cnn_class_names = checkpoint.get("class_names", ["issue_0", "issue_1"])
    else:
        model_state = checkpoint
        cnn_class_names = ["issue_0", "issue_1"]

    cnn_model = models.resnet50(pretrained=False)
    cnn_model.fc = nn.Linear(cnn_model.fc.in_features, len(cnn_class_names))
    cnn_model.load_state_dict(model_state, strict=False)
    cnn_model.eval()

    cnn_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    print("[CNN] ✅ Loaded successfully")
    return True

# ==============================
# NLP PREDICTION
# ==============================
def predict_issue_nlp(text: str) -> dict:
    cleaned = clean_text(text)
    print(f"\n[NLP] Original: {text}")
    print(f"[NLP] Cleaned: {cleaned}")

    seq = tokenizer.texts_to_sequences([cleaned])
    pad = pad_sequences(seq, maxlen=MAX_LEN)

    sev_pred, sec_pred = nlp_model.predict(pad, verbose=0)

    severity_idx = np.argmax(sev_pred[0])
    sector_idx = np.argmax(sec_pred[0])

    severity = severity_encoder.inverse_transform([severity_idx])[0]
    sector = sector_encoder.inverse_transform([sector_idx])[0]

    result = {
        "predicted_sector": str(sector),
        "predicted_severity": str(severity),
        "sector_confidence": float(np.max(sec_pred[0])),
        "severity_confidence": float(np.max(sev_pred[0])),
    }

    print("[NLP RESULT]:", result)
    return result

# ==============================
# CNN PREDICTION
# ==============================
def predict_issue_cnn(image_file: UploadFile) -> dict:
    image_bytes = image_file.file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    print(f"\n[CNN] Image size: {image.size}")

    image_tensor = cnn_transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = cnn_model(image_tensor)
        probs = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted_idx = torch.max(probs, 0)

    predicted_class = cnn_class_names[predicted_idx.item()]

    result = {
        "predicted_class": predicted_class,
        "confidence": float(confidence.item())
    }

    print("[CNN RESULT]:", result)
    return result

# ==============================
# STARTUP
# ==============================
@app.on_event("startup")
async def startup_event():
    print("\n🚀 Starting ML API ...")
    load_nlp_model()
    load_cnn_model()
    print("✅ API Ready\n")

# ==============================
# HEALTH CHECK
# ==============================
@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "nlp_loaded": nlp_model is not None,
        "cnn_loaded": cnn_model is not None
    }

# ==============================
# COMPLAINT ID
# ==============================
def generate_complaint_id():
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    uid = str(uuid.uuid4())[:8]
    return f"COMP-{ts}-{uid}"

# ==============================
# MAIN PREDICT ENDPOINT
# ==============================
@app.post("/predict")
async def predict(
    description: str = Form(...),
    image: UploadFile = File(...)
):
    print("\n========== NEW REQUEST ==========")

    nlp_result = predict_issue_nlp(description)
    cnn_result = predict_issue_cnn(image)

    complaint_id = generate_complaint_id()

    complaint = {
        "complaint_id": complaint_id,
        "nlp_result": nlp_result,
        "cnn_result": cnn_result,
        "status": "Pending"
    }

    print("\n🔥 FINAL COMPLAINT OBJECT:")
    print(complaint)
    print("=================================\n")

    return JSONResponse({
        "message": "Complaint filed successfully",
        "complaint": complaint
    })

# ==============================
# RUN SERVER
# ==============================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
