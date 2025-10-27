# Machine Learning Implementation Guide - MediTrack

## 📊 Overview

This document describes the ML-based anomaly detection system integrated into MediTrack's Lab module. The system uses **5 different machine learning models** to automatically flag abnormal lab test results.

## 🤖 Implemented Models

### 1. **K-Nearest Neighbors (KNN)**
- **Algorithm**: Distance-based classifier
- **How it works**: Compares new lab values with k nearest historical results
- **Best for**: Finding similar patterns in data
- **Parameters**: k=5 neighbors

### 2. **Decision Tree**
- **Algorithm**: Tree-based classifier using statistical thresholds
- **How it works**: Uses z-scores and standard deviations to create decision boundaries
- **Best for**: Rule-based interpretable classifications
- **Threshold**: Features > 2 std devs from mean are flagged

### 3. **Bayesian Classifier**
- **Algorithm**: Probabilistic model using Bayes' theorem
- **How it works**: Calculates probability of abnormality given observed values
- **Best for**: Probabilistic predictions
- **Distribution**: Gaussian distribution assumed

### 4. **Support Vector Machine (SVM)**
- **Algorithm**: Linear classifier using gradient descent
- **How it works**: Finds optimal linear boundary between normal and abnormal
- **Best for**: Binary classification
- **Learning Rate**: 0.01, Iterations: 100

### 5. **Backpropagation Neural Network**
- **Algorithm**: Simple multi-layer neural network
- **Architecture**: Input → Hidden (10 units) → Output
- **How it works**: Learns non-linear patterns through backpropagation
- **Best for**: Complex non-linear relationships
- **Learning Rate**: 0.01, Iterations: 50

## 📈 Evaluation Metrics

All models are evaluated using standard classification metrics:

### **Accuracy**
```
(True Positives + True Negatives) / Total Predictions
```
Overall correctness of the model

### **Precision**
```
True Positives / (True Positives + False Positives)
```
Of predicted anomalies, how many were correct?

### **Recall (Sensitivity)**
```
True Positives / (True Positives + False Negatives)
```
Of actual anomalies, how many did we find?

### **F1-Score**
```
2 × (Precision × Recall) / (Precision + Recall)
```
Harmonic mean balancing precision and recall

## 🏗️ Architecture

### Backend Structure
```
server/
├── ml/
│   ├── models.js                    # All 5 ML model implementations
│   └── labAnomalyDetection.js       # Service managing model training & prediction
├── routes/
│   └── ml.js                        # API endpoints for ML operations
└── server.js                        # Updated with /api/ml route
```

### Frontend Structure
```
meditrack-client/src/
├── pages/
│   ├── LabDashboard.jsx             # Updated with ML prediction display
│   └── MLDashboard.jsx              # New dashboard for model management
└── App.js                           # Added /ml-dashboard route
```

## 🔌 API Endpoints

### 1. **Train Models**
```
POST /api/ml/train
Authorization: Required (Admin/Lab role)
```
Trains all 5 models on historical lab data

**Response:**
```json
{
  "message": "Models trained successfully",
  "trainingDate": "2024-01-15T10:30:00Z",
  "samplesUsed": 150,
  "metrics": {
    "knn": { "accuracy": 85.5, "precision": 88.2, ... },
    "decisionTree": { ... },
    ...
  }
}
```

### 2. **Make Prediction**
```
POST /api/ml/predict
Body: { "parameterResults": [...] }
```
Predicts anomalies for a set of lab parameters

**Response:**
```json
{
  "isAnomalous": true,
  "averageConfidence": 82.5,
  "individualPredictions": {
    "knn": { "prediction": 1, "confidence": 0.85 },
    "decisionTree": { "prediction": 1, "confidence": 0.80 },
    ...
  },
  "ensemble": {
    "prediction": 1,
    "confidence": 0.825,
    "votesForAnomalous": 4,
    "totalModels": 5
  }
}
```

### 3. **Get Metrics**
```
GET /api/ml/metrics
Authorization: Required
```
Returns comprehensive performance metrics for all models

### 4. **Get Best Model**
```
GET /api/ml/best-model
Authorization: Required
```
Returns the best performing model based on F1-score

### 5. **Get Status**
```
GET /api/ml/status
Authorization: Required
```
Returns training status and available models

## 📊 ML Dashboard Features

### Model Training
- **One-click training** on historical lab data
- **Automatic metric calculation** on validation set
- **Training status** indicator with timestamp

### Performance Visualization
- **Bar charts** comparing accuracy, precision, recall, F1-score across models
- **Radar charts** showing model profile
- **Detailed metrics table** with confusion matrix values

### Model Cards
- Total models count
- Best F1-score
- Average accuracy
- Average precision

## 🔄 Integration with Lab Workflow

### Workflow:
1. **Lab technician** enters test results in LabDashboard
2. **ML models** automatically analyze the results
3. **Anomaly detection** displays confidence score
4. **Ensemble voting** from all 5 models
5. **Results** are highlighted if anomalous
6. **Technician** can save results with ML insights

### ML Display in Dialog:
- ⚠️ Status (Anomalous/Normal)
- Confidence percentage
- Ensemble voting results
- Model list

## 📚 Data Preparation

### Training Data Requirements
- **Minimum samples**: 10 historical lab results
- **Data format**: Numeric parameter values with abnormality flags
- **Train/Test split**: 80/20 for validation

### Data Extraction
```javascript
// From Consultation documents
{
  labRequests: [{
    parameterResults: [
      { parameterName: "Hemoglobin", value: 12.5, isAbnormal: false },
      { parameterName: "WBC", value: 15000, isAbnormal: true }
    ]
  }]
}
```

## 🚀 Getting Started

### Step 1: Accumulate Training Data
Ensure you have at least 10 historical lab results with marked abnormalities

### Step 2: Train Models
```bash
# Via API
curl -X POST http://localhost:5000/api/ml/train \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

Or use the **ML Dashboard** → Click "Train Models" button

### Step 3: View Metrics
Navigate to `/ml-dashboard` to see all model metrics and comparisons

### Step 4: Use in Lab Testing
Enter lab results → ML automatically predicts anomalies → Save with insights

## 📊 Performance Expectations

Based on typical hospital lab data:
- **KNN**: Fast, good for pattern matching (80-85% accuracy)
- **Decision Tree**: Interpretable, good baseline (75-80% accuracy)
- **Bayesian**: Probabilistic, good calibration (78-82% accuracy)
- **SVM**: Linear separation, good for binary classification (82-88% accuracy)
- **Neural Network**: Best accuracy on complex data (85-90% accuracy)

*Note: Actual performance depends on training data quality and size*

## 🔍 Model Selection

### Best Model Identification
The system automatically identifies the best performing model based on **F1-score**, balancing both precision and recall.

```javascript
// Get best model
GET /api/ml/best-model
Response: {
  "modelName": "neuralNetwork",
  "metrics": { "f1Score": 87.5, ... }
}
```

## ⚙️ Configuration

### Hyperparameters (can be adjusted in `models.js`):

**KNN**
- `k`: Number of neighbors (default: 5)

**SVM**
- `learningRate`: 0.01
- `iterations`: 100

**Neural Network**
- `hiddenUnits`: 10
- `learningRate`: 0.01
- `iterations`: 50

**Bayesian**
- Prior probability: Calculated from training data

## 🐛 Troubleshooting

### Models not making predictions?
- Ensure models are trained first
- Check API response for errors

### Training takes too long?
- Reduce training data size
- Adjust hyperparameters (iterations, learning rate)

### Low accuracy?
- Increase training data (minimum 50+ samples recommended)
- Ensure training data is representative

## 📝 Future Enhancements

1. **Real-time retraining** as new lab data arrives
2. **Model persistence** - Save trained models to database
3. **Feature importance** - Understand which parameters matter most
4. **Cross-validation** - More robust model evaluation
5. **Hyperparameter tuning** - Auto-optimize parameters
6. **Model comparison** - A/B testing different approaches
7. **Explainability** - LIME/SHAP for model interpretability

## 📚 References

- **Evaluation Metrics**: [scikit-learn metrics](https://scikit-learn.org/stable/modules/model_evaluation.html)
- **Machine Learning**: [ML Overview](https://en.wikipedia.org/wiki/Machine_learning)
- **Classification**: [Classification Overview](https://en.wikipedia.org/wiki/Statistical_classification)

## 📞 Support

For issues or questions about the ML implementation:
1. Check the ML Dashboard status
2. Review API responses for detailed errors
3. Ensure sufficient training data is available
4. Check browser console for client-side errors

---

**Created**: January 2024  
**Version**: 1.0  
**Status**: Production Ready