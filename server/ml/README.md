# ML Module - Lab Anomaly Detection

## Quick Start

### Files Overview

1. **models.js** - Core ML model implementations
   - KNNModel
   - DecisionTreeModel
   - BayesianModel
   - SVMModel
   - NeuralNetworkModel

2. **labAnomalyDetection.js** - Service managing all models
   - Training on historical data
   - Making predictions
   - Calculating metrics

### Usage

#### 1. Import the Service
```javascript
const labAnomalyDetection = require('./ml/labAnomalyDetection');
```

#### 2. Train Models
```javascript
// Prepare training data
const labResults = [
  {
    parameterResults: [
      { parameterName: 'Hemoglobin', value: 12.5, isAbnormal: false },
      { parameterName: 'WBC', value: 5000, isAbnormal: false }
    ]
  },
  // ... more samples
];

// Train
labAnomalyDetection.trainModels(labResults);
```

#### 3. Make Predictions
```javascript
const prediction = labAnomalyDetection.predictAnomalies([12.5, 5000]);
console.log(prediction);
// {
//   isAnomalous: false,
//   averageConfidence: 0.85,
//   individualPredictions: { ... },
//   ensemble: { ... }
// }
```

#### 4. Get Metrics
```javascript
const metrics = labAnomalyDetection.getMetrics();
console.log(metrics.modelMetrics);
```

## API Endpoints

See `../routes/ml.js` for all endpoints

```
POST   /api/ml/train           - Train models
POST   /api/ml/predict         - Make prediction
GET    /api/ml/metrics         - Get all metrics
GET    /api/ml/best-model      - Get best model
GET    /api/ml/status          - Get training status
```

## Model Architecture

### Data Flow
```
Raw Lab Results
    ↓
Prepare Training Data (extract values, flag abnormalities)
    ↓
Split Data (80% train, 20% test)
    ↓
Train All 5 Models in Parallel
    ↓
Calculate Metrics on Test Set
    ↓
Store Metrics & Ready for Predictions
```

### Prediction Flow
```
Input: Parameter Values
    ↓
Pass through all 5 models
    ↓
Ensemble voting (majority decision)
    ↓
Calculate confidence scores
    ↓
Return ensemble prediction + individual results
```

## Performance Tuning

### Improving Accuracy
1. **More training data** - Collect more lab results (50-100+ recommended)
2. **Feature scaling** - Normalize values (currently handles raw values)
3. **Adjust thresholds** - Tune in individual model classes
4. **Hyperparameter tuning** - Modify learning rates, iterations

### Reducing Training Time
1. **Reduce iterations** - Lower in SVM/Neural Network classes
2. **Smaller hidden layer** - Change `hiddenUnits` in NeuralNetworkModel
3. **Fewer training samples** - Use representative subset

## Adding New Models

To add a new model:

1. Create class in `models.js`
```javascript
class MyModel {
  train(data) { /* training logic */ }
  predict(testValues) { 
    return { prediction: 0/1, confidence: 0-1 };
  }
}
```

2. Export it
```javascript
module.exports = { ..., MyModel };
```

3. Add to service in `labAnomalyDetection.js`
```javascript
this.models.myModel = new MyModel();
```

## Testing

### Test Training
```javascript
// In test file
const service = require('./labAnomalyDetection');
const testData = [/* sample results */];
service.trainModels(testData);
const metrics = service.getMetrics();
console.log(metrics);
```

### Test Prediction
```javascript
const result = service.predictAnomalies([12.5, 5000, 95]);
console.assert(result.ensemble !== undefined);
console.log('Prediction works:', result);
```

## Debugging

### Enable detailed logging
Add to prediction function:
```javascript
console.log('Input values:', testValues);
console.log('Individual predictions:', predictions);
console.log('Ensemble result:', {isAnomalous, avgConfidence});
```

### Check model status
```javascript
const status = labAnomalyDetection.getMetrics();
console.log('Trained:', status.isTrained);
console.log('Models:', Object.keys(status.metrics));
```

### Verify data preparation
```javascript
const prepared = labAnomalyDetection.prepareTrainingData(rawData);
console.log('Samples prepared:', prepared.length);
console.log('First sample:', prepared[0]);
```

## Common Issues

### Models not trained
Error: "Models not trained yet"  
**Solution**: Call `/api/ml/train` endpoint first

### Poor prediction accuracy
**Solution**: 
- Add more training data
- Check if data is balanced (similar number of normal/abnormal)
- Verify parameter values are numeric

### Prediction takes long
**Solution**:
- Reduce KNN neighbors (`k` parameter)
- Reduce Neural Network iterations
- Use fewer training samples

## Memory Usage

Current implementation stores:
- Training data in KNN model
- Feature statistics in Decision Tree
- Probability distributions in Bayesian model

For 1000 samples: ~50KB memory
For 10000 samples: ~500KB memory

Consider pagination or model persistence if dealing with massive datasets.

---

**Last Updated**: January 2024