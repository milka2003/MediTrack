from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
import os

app = FastAPI(title="MediTrack Disease Risk Prediction Service")

# Model paths
ANEMIA_MODEL_PATH = "models/disease_risk_model.pkl"
ANEMIA_FEATURES_PATH = "models/features.pkl"

KIDNEY_MODEL_PATH = "models/kidney_model.pkl"
KIDNEY_FEATURES_PATH = "models/kidney_features.pkl"
KIDNEY_ENCODERS_PATH = "models/kidney_encoders.pkl"

anemia_model = None
anemia_features = None

kidney_model = None
kidney_features = None
kidney_encoders = None

# Load models at startup
if os.path.exists(ANEMIA_MODEL_PATH):
    anemia_model = joblib.load(ANEMIA_MODEL_PATH)
if os.path.exists(ANEMIA_FEATURES_PATH):
    anemia_features = joblib.load(ANEMIA_FEATURES_PATH)

if os.path.exists(KIDNEY_MODEL_PATH):
    kidney_model = joblib.load(KIDNEY_MODEL_PATH)
if os.path.exists(KIDNEY_FEATURES_PATH):
    kidney_features = joblib.load(KIDNEY_FEATURES_PATH)
if os.path.exists(KIDNEY_ENCODERS_PATH):
    kidney_encoders = joblib.load(KIDNEY_ENCODERS_PATH)

class ParameterResult(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None

class PredictionRequest(BaseModel):
    patientId: str
    parameters: List[ParameterResult]
    gender: Optional[str] = "Male"
    age: Optional[int] = 40

class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    prediction: str
    confidence: float
    recommendations: List[str]

@app.get("/")
async def root():
    return {
        "message": "Disease Prediction Service is running",
        "anemia_model_loaded": anemia_model is not None,
        "kidney_model_loaded": kidney_model is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_anemia(request: PredictionRequest):
    try:
        input_data = {p.name.strip(): p.value for p in request.parameters}
        gender_val = 1 if request.gender == "Male" else 0
        input_data["Gender"] = gender_val

        if anemia_model is not None and anemia_features is not None:
            try:
                feature_mapping = {
                    "Hemoglobin": ["Hemoglobin", "HB", "HGB"],
                    "MCH": ["MCH"],
                    "MCHC": ["MCHC"],
                    "MCV": ["MCV"]
                }
                
                ordered_features = []
                for feat_name in anemia_features:
                    if feat_name == "Gender":
                        ordered_features.append(gender_val)
                    else:
                        found = False
                        for alias in feature_mapping.get(feat_name, [feat_name]):
                            if alias in input_data:
                                ordered_features.append(input_data[alias])
                                found = True
                                break
                            for k, v in input_data.items():
                                if k.lower() == alias.lower():
                                    ordered_features.append(v)
                                    found = True
                                    break
                            if found: break
                        if not found:
                            ordered_features.append(0.0)

                pred_class = int(anemia_model.predict([ordered_features])[0])
                pred_proba = anemia_model.predict_proba([ordered_features])[0]
                confidence = float(np.max(pred_proba))
                
                risk_level = "High" if pred_class == 1 else "Low"
                risk_score = float(pred_proba[1])
                prediction = "Positive for Anemia symptoms based on hematological indices." if pred_class == 1 else "Negative for Anemia patterns."
                
                recs = ["Complete blood count (CBC) follow-up"]
                if pred_class == 1:
                    recs.extend(["Consult a hematologist", "Review dietary iron, B12, and folate intake"])
                else:
                    recs.append("Maintain balanced nutrition")
                    
                return PredictionResponse(
                    risk_score=risk_score,
                    risk_level=risk_level,
                    prediction=prediction,
                    confidence=confidence,
                    recommendations=recs
                )
            except Exception as e:
                print(f"Anemia Prediction Error: {str(e)}")
        
        # Fallback
        hb = input_data.get("Hemoglobin", 14)
        is_anemic = (request.gender == "Male" and hb < 13.5) or (request.gender == "Female" and hb < 12.0)
        return PredictionResponse(
            risk_score=0.8 if is_anemic else 0.2,
            risk_level="High" if is_anemic else "Low",
            prediction="Anemia indicated by low hemoglobin levels (Fallback)." if is_anemic else "Hemoglobin levels within range (Fallback).",
            confidence=0.7,
            recommendations=["Follow standard medical advice"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/kidney", response_model=PredictionResponse)
async def predict_kidney(request: PredictionRequest):
    try:
        input_data = {p.name.strip().lower(): p.value for p in request.parameters}
        
        if kidney_model is not None and kidney_features is not None:
            try:
                ordered_features = []
                for feat in kidney_features:
                    # Map common names to feature names
                    val = 0.0
                    if feat == 'age': val = float(request.age or 40)
                    elif feat in input_data: val = input_data[feat]
                    # Handle some categorical defaults if missing (mode encoding)
                    elif feat in ['sg', 'al', 'su']: val = 0.0
                    
                    ordered_features.append(val)

                pred_class = int(kidney_model.predict([ordered_features])[0])
                pred_proba = kidney_model.predict_proba([ordered_features])[0]
                confidence = float(np.max(pred_proba))
                
                # In kidney dataset, classification was likely encoded as 0 for ckd, 1 for notckd or vice versa
                # Based on train_kidney.py: le_target.fit_transform(['ckd', 'notckd']) -> ckd=0, notckd=1
                is_ckd = (pred_class == 0)
                
                risk_level = "High" if is_ckd else "Low"
                risk_score = float(pred_proba[0]) # Prob of being class 0 (CKD)
                
                prediction = "High risk of Chronic Kidney Disease detected." if is_ckd else "Low risk of Chronic Kidney Disease detected."
                
                recs = ["Regular kidney function monitoring (KFT)"]
                if is_ckd:
                    recs.extend([
                        "Consult a nephrologist immediately",
                        "Monitor blood pressure and blood sugar closely",
                        "Follow a kidney-friendly diet (low protein/sodium)"
                    ])
                else:
                    recs.append("Maintain hydration and healthy lifestyle")
                    
                return PredictionResponse(
                    risk_score=risk_score,
                    risk_level=risk_level,
                    prediction=prediction,
                    confidence=confidence,
                    recommendations=recs
                )
            except Exception as e:
                print(f"Kidney Prediction Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Kidney Prediction Error: {str(e)}")
        
        raise HTTPException(status_code=404, detail="Kidney model not loaded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
