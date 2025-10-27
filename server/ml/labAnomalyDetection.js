// server/ml/labAnomalyDetection.js
// Lab Result Anomaly Detection Service

const {
  KNNModel,
  DecisionTreeModel,
  BayesianModel,
  SVMModel,
  NeuralNetworkModel
} = require('./models');

class LabAnomalyDetectionService {
  constructor() {
    this.models = {
      knn: new KNNModel(5),
      decisionTree: new DecisionTreeModel(),
      bayesian: new BayesianModel(),
      svm: new SVMModel(0.01, 100),
      neuralNetwork: new NeuralNetworkModel(10, 0.01, 50)
    };
    this.isTrained = false;
    this.lastTrainingDate = null;
    this.modelMetrics = {};
  }

  /**
   * Prepare data for ML training
   */
  prepareTrainingData(labResults) {
    return labResults
      .filter(r => r.parameterResults && r.parameterResults.length > 0)
      .map(result => {
        // Extract numeric values from parameters
        const values = result.parameterResults
          .filter(p => p.value && !isNaN(parseFloat(p.value)))
          .map(p => parseFloat(p.value));

        // Determine if abnormal (based on isAbnormal flag)
        const isAbnormal = result.parameterResults.some(p => p.isAbnormal);

        return { values, isAbnormal };
      })
      .filter(d => d.values.length > 0);
  }

  /**
   * Train all models on historical lab data
   */
  trainModels(labResults) {
    const trainingData = this.prepareTrainingData(labResults);

    if (trainingData.length < 10) {
      console.warn('Insufficient training data. Minimum 10 samples required.');
      return false;
    }

    // Split data for validation
    const trainSize = Math.floor(trainingData.length * 0.8);
    const trainData = trainingData.slice(0, trainSize);
    const testData = trainingData.slice(trainSize);

    // Train all models
    Object.values(this.models).forEach(model => {
      model.train(trainData);
    });

    // Calculate metrics
    this.calculateMetrics(testData);
    this.isTrained = true;
    this.lastTrainingDate = new Date();

    return true;
  }

  /**
   * Calculate performance metrics for all models
   */
  calculateMetrics(testData) {
    const modelNames = Object.keys(this.models);

    for (const name of modelNames) {
      const model = this.models[name];
      const predictions = testData.map(d => model.predict(d.values));

      // Calculate metrics
      let tp = 0, fp = 0, tn = 0, fn = 0;

      testData.forEach((d, i) => {
        const pred = predictions[i].prediction;
        const actual = d.isAbnormal ? 1 : 0;

        if (pred === 1 && actual === 1) tp++;
        else if (pred === 1 && actual === 0) fp++;
        else if (pred === 0 && actual === 0) tn++;
        else if (pred === 0 && actual === 1) fn++;
      });

      const accuracy = (tp + tn) / testData.length;
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;

      this.modelMetrics[name] = {
        accuracy: Math.round(accuracy * 10000) / 100,
        precision: Math.round(precision * 10000) / 100,
        recall: Math.round(recall * 10000) / 100,
        f1Score: Math.round(f1 * 10000) / 100,
        truePositives: tp,
        falsePositives: fp,
        trueNegatives: tn,
        falseNegatives: fn
      };
    }
  }

  /**
   * Predict anomalies for lab results
   */
  predictAnomalies(parameterResults) {
    if (!this.isTrained) {
      return { error: 'Models not trained yet' };
    }

    // Extract values
    const values = parameterResults
      .filter(p => p.value && !isNaN(parseFloat(p.value)))
      .map(p => parseFloat(p.value));

    if (values.length === 0) {
      return { error: 'No numeric values to analyze' };
    }

    // Get predictions from all models
    const predictions = {};
    for (const [name, model] of Object.entries(this.models)) {
      predictions[name] = model.predict(values);
    }

    // Ensemble prediction (majority voting)
    const abnormalVotes = Object.values(predictions).filter(p => p.prediction === 1).length;
    const isAnomalous = abnormalVotes > Object.keys(predictions).length / 2;

    // Average confidence
    const avgConfidence = Object.values(predictions).reduce((sum, p) => sum + p.confidence, 0) / 
                         Object.keys(predictions).length;

    return {
      isAnomalous,
      averageConfidence: Math.round(avgConfidence * 10000) / 100,
      individualPredictions: predictions,
      ensemble: {
        prediction: isAnomalous ? 1 : 0,
        confidence: avgConfidence,
        votesForAnomalous: abnormalVotes,
        totalModels: Object.keys(predictions).length
      }
    };
  }

  /**
   * Get model performance metrics
   */
  getMetrics() {
    return {
      isTrained: this.isTrained,
      lastTrainingDate: this.lastTrainingDate,
      metrics: this.modelMetrics
    };
  }

  /**
   * Get best performing model
   */
  getBestModel() {
    if (!this.isTrained) return null;

    let bestModel = null;
    let bestF1 = -1;

    for (const [name, metrics] of Object.entries(this.modelMetrics)) {
      if (metrics.f1Score > bestF1) {
        bestF1 = metrics.f1Score;
        bestModel = name;
      }
    }

    return {
      modelName: bestModel,
      metrics: this.modelMetrics[bestModel]
    };
  }

  /**
   * Get comparison of all models
   */
  getModelComparison() {
    return {
      trained: this.isTrained,
      trainingDate: this.lastTrainingDate,
      models: Object.entries(this.modelMetrics).map(([name, metrics]) => ({
        name,
        ...metrics
      }))
    };
  }
}

module.exports = new LabAnomalyDetectionService();