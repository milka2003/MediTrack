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

LIVER_MODEL_PATH = "models/liver_model.pkl"
LIVER_FEATURES_PATH = "models/liver_features.pkl"
LIVER_ENCODERS_PATH = "models/liver_encoders.pkl"

SEPSIS_MODEL_PATH = "models/sepsis_model.pkl"
SEPSIS_FEATURES_PATH = "models/sepsis_features.pkl"
SEPSIS_MEANS_PATH = "models/sepsis_means.pkl"

CARDIO_MODEL_PATH = "models/cardio_model.pkl"
CARDIO_FEATURES_PATH = "models/cardio_features.pkl"

anemia_model = None
anemia_features = None

kidney_model = None
kidney_features = None
kidney_encoders = None

liver_model = None
liver_features = None
liver_encoders = None

sepsis_model = None
sepsis_features = None
sepsis_means = None

cardio_model = None
cardio_features = None

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

if os.path.exists(LIVER_MODEL_PATH):
    liver_model = joblib.load(LIVER_MODEL_PATH)
if os.path.exists(LIVER_FEATURES_PATH):
    liver_features = joblib.load(LIVER_FEATURES_PATH)
if os.path.exists(LIVER_ENCODERS_PATH):
    liver_encoders = joblib.load(LIVER_ENCODERS_PATH)

if os.path.exists(SEPSIS_MODEL_PATH):
    sepsis_model = joblib.load(SEPSIS_MODEL_PATH)
if os.path.exists(SEPSIS_FEATURES_PATH):
    sepsis_features = joblib.load(SEPSIS_FEATURES_PATH)
if os.path.exists(SEPSIS_MEANS_PATH):
    sepsis_means = joblib.load(SEPSIS_MEANS_PATH)

if os.path.exists(CARDIO_MODEL_PATH):
    cardio_model = joblib.load(CARDIO_MODEL_PATH)
if os.path.exists(CARDIO_FEATURES_PATH):
    cardio_features = joblib.load(CARDIO_FEATURES_PATH)

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
        "kidney_model_loaded": kidney_model is not None,
        "cardio_model_loaded": cardio_model is not None
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


@app.post("/predict/liver", response_model=PredictionResponse)
async def predict_liver(request: PredictionRequest):
    try:
        # Map parameters to feature names (case-insensitive and handling potential variations)
        input_data = {p.name.strip().lower().replace(" ", "_"): p.value for p in request.parameters}
        
        # Gender encoding: Female=0, Male=1 (from LabelEncoder in train_liver.py)
        gender_val = 1 if request.gender == "Male" else 0
        
        if liver_model is not None and liver_features is not None:
            try:
                feature_mapping = {
                    "age": ["age"],
                    "gender": ["gender"],
                    "total_bilirubin": ["total_bilirubin", "tb", "bilirubin_total"],
                    "direct_bilirubin": ["direct_bilirubin", "db", "bilirubin_direct"],
                    "alkaline_phosphotase": ["alkaline_phosphotase", "alp", "alkaline_phosphatase"],
                    "alamine_aminotransferase": ["alamine_aminotransferase", "sgpt", "alt"],
                    "aspartate_aminotransferase": ["aspartate_aminotransferase", "sgot", "ast"],
                    "total_protiens": ["total_protiens", "tp", "total_proteins", "protein_total"],
                    "albumin": ["albumin", "alb"],
                    "albumin_and_globulin_ratio": ["albumin_and_globulin_ratio", "ag_ratio", "a/g_ratio"]
                }
                
                ordered_features = []
                for feat in liver_features:
                    feat_lower = feat.lower()
                    if feat_lower == "age":
                        ordered_features.append(float(request.age or 40))
                    elif feat_lower == "gender":
                        ordered_features.append(float(gender_val))
                    else:
                        found = False
                        # Try mapping
                        for alias in feature_mapping.get(feat_lower, [feat_lower]):
                            if alias in input_data:
                                ordered_features.append(input_data[alias])
                                found = True
                                break
                        if not found:
                            # Try direct name match in input_data
                            if feat_lower in input_data:
                                ordered_features.append(input_data[feat_lower])
                                found = True
                        if not found:
                            # Use default value or mean (0.0 is safe fallback if mean isn't known)
                            ordered_features.append(0.0)

                pred_class = int(liver_model.predict([ordered_features])[0])
                pred_proba = liver_model.predict_proba([ordered_features])[0]
                confidence = float(np.max(pred_proba))
                
                # In train_liver.py: 1 for patient, 0 for non-patient
                is_patient = (pred_class == 1)
                
                risk_level = "High" if is_patient else "Low"
                risk_score = float(pred_proba[1]) # Prob of being class 1 (Patient)
                
                prediction = "High risk of Liver Disease detected." if is_patient else "Low risk of Liver Disease detected."
                
                recs = ["Complete Liver Function Test (LFT)"]
                if is_patient:
                    recs.extend([
                        "Consult a hepatologist or gastroenterologist",
                        "Avoid alcohol consumption",
                        "Maintain a healthy weight and monitor diet"
                    ])
                else:
                    recs.append("Maintain a healthy lifestyle and regular checkups")
                    
                return PredictionResponse(
                    risk_score=risk_score,
                    risk_level=risk_level,
                    prediction=prediction,
                    confidence=confidence,
                    recommendations=recs
                )
            except Exception as e:
                print(f"Liver Prediction Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Liver Prediction Error: {str(e)}")
        
        raise HTTPException(status_code=404, detail="Liver model not loaded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/sepsis", response_model=PredictionResponse)
async def predict_sepsis(request: PredictionRequest):
    try:
        input_data = {p.name.strip().lower(): p.value for p in request.parameters}
        gender_val = 1 if request.gender == "Male" else 0
        
        if sepsis_model is not None and sepsis_features is not None:
            try:
                ordered_features = []
                for feat in sepsis_features:
                    feat_lower = feat.lower()
                    if feat_lower == 'age':
                        ordered_features.append(float(request.age or 40))
                    elif feat_lower == 'gender':
                        ordered_features.append(float(gender_val))
                    elif feat_lower in input_data:
                        ordered_features.append(input_data[feat_lower])
                    else:
                        # Fallback for missing features - use mean values from dataset
                        val = 0.0
                        if sepsis_means and feat in sepsis_means:
                            val = float(sepsis_means[feat])
                        ordered_features.append(val)

                pred_class = int(sepsis_model.predict([ordered_features])[0])
                pred_proba = sepsis_model.predict_proba([ordered_features])[0]
                confidence = float(np.max(pred_proba))
                
                is_sepsis = (pred_class == 1)
                
                risk_level = "High" if is_sepsis else "Low"
                risk_score = float(pred_proba[1]) # Prob of being class 1 (Sepsis)
                
                prediction = "High risk of Sepsis detected. Immediate medical attention required." if is_sepsis else "Low risk of Sepsis detected."
                
                recs = ["Monitor vital signs (HR, BP, Temp, Resp)"]
                if is_sepsis:
                    recs.extend([
                        "Alert medical emergency team (Sepsis Protocol)",
                        "Start intravenous fluids and broad-spectrum antibiotics",
                        "Monitor lactate levels and organ function"
                    ])
                else:
                    recs.append("Continue regular monitoring of patient status")
                    
                return PredictionResponse(
                    risk_score=risk_score,
                    risk_level=risk_level,
                    prediction=prediction,
                    confidence=confidence,
                    recommendations=recs
                )
            except Exception as e:
                print(f"Sepsis Prediction Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Sepsis Prediction Error: {str(e)}")
        
        raise HTTPException(status_code=404, detail="Sepsis model not loaded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/cardio", response_model=PredictionResponse)
async def predict_cardio(request: PredictionRequest):
    try:
        input_data = {p.name.strip().lower(): p.value for p in request.parameters}
        gender_val = 1 if request.gender == "Male" else 0
        
        if cardio_model is not None and cardio_features is not None:
            try:
                ordered_features = []
                for feat in cardio_features:
                    feat_lower = feat.lower()
                    if feat_lower == 'male':
                        ordered_features.append(float(gender_val))
                    elif feat_lower == 'age':
                        ordered_features.append(float(request.age or 40))
                    elif feat_lower in input_data:
                        ordered_features.append(input_data[feat_lower])
                    else:
                        ordered_features.append(0.0)

                pred_class = int(cardio_model.predict([ordered_features])[0])
                pred_proba = cardio_model.predict_proba([ordered_features])[0]
                confidence = float(np.max(pred_proba))
                
                # In Framingham dataset, TenYearCHD is 1 for high risk, 0 for low
                is_cardio = (pred_class == 1)
                
                risk_level = "High" if is_cardio else "Low"
                risk_score = float(pred_proba[1]) # Prob of being class 1
                
                prediction = "High risk of Cardiovascular disease (CHD) in 10 years detected." if is_cardio else "Low risk of Cardiovascular disease (CHD) in 10 years detected."
                
                recs = ["Monitor blood pressure and cholesterol regularly"]
                if is_cardio:
                    recs.extend([
                        "Consult a cardiologist for a comprehensive evaluation",
                        "Adopt a heart-healthy diet (low saturated fats, high fiber)",
                        "Increase physical activity and manage stress",
                        "Quit smoking if applicable"
                    ])
                else:
                    recs.append("Maintain a healthy lifestyle and regular screenings")
                    
                return PredictionResponse(
                    risk_score=risk_score,
                    risk_level=risk_level,
                    prediction=prediction,
                    confidence=confidence,
                    recommendations=recs
                )
            except Exception as e:
                print(f"Cardio Prediction Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Cardio Prediction Error: {str(e)}")
        
        # Fallback if model not loaded
        sys_bp = input_data.get('sysbp', 120)
        dia_bp = input_data.get('diabp', 80)
        is_high_risk = sys_bp > 140 or dia_bp > 90
        
        return PredictionResponse(
            risk_score=0.75 if is_high_risk else 0.25,
            risk_level="High" if is_high_risk else "Low",
            prediction="Cardiovascular risk indicated by high blood pressure (Fallback)." if is_high_risk else "Blood pressure within normal range (Fallback).",
            confidence=0.6,
            recommendations=["Regular BP monitoring", "Consult a doctor for full screening"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
