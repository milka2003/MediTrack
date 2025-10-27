// server/ml/models.js
// Machine Learning Models for Lab Result Anomaly Detection

/**
 * KNN (K-Nearest Neighbors) Model
 * Identifies anomalies based on similarity to normal results
 */
class KNNModel {
  constructor(k = 5) {
    this.k = k;
    this.trainingData = [];
  }

  train(data) {
    // Store all training data for KNN
    this.trainingData = data.map(d => ({
      values: d.values,
      isAbnormal: d.isAbnormal
    }));
  }

  euclideanDistance(point1, point2) {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  predict(testValues) {
    if (this.trainingData.length === 0) return { prediction: 0.5, confidence: 0 };

    // Find k nearest neighbors
    const distances = this.trainingData.map((d, i) => ({
      distance: this.euclideanDistance(testValues, d.values),
      isAbnormal: d.isAbnormal
    }));

    distances.sort((a, b) => a.distance - b.distance);
    const kNeighbors = distances.slice(0, Math.min(this.k, distances.length));

    // Calculate probability of anomaly
    const abnormalCount = kNeighbors.filter(n => n.isAbnormal).length;
    const confidence = abnormalCount / kNeighbors.length;

    return {
      prediction: confidence > 0.5 ? 1 : 0,
      confidence: Math.max(abnormalCount, kNeighbors.length - abnormalCount) / kNeighbors.length
    };
  }
}

/**
 * Decision Tree Model (Simplified)
 * Rule-based classification using thresholds
 */
class DecisionTreeModel {
  constructor() {
    this.tree = null;
  }

  train(data) {
    // Simple decision tree: learn mean and std dev of each feature
    this.featureStats = {};
    
    if (data.length === 0) return;

    const numFeatures = data[0].values.length;
    
    for (let i = 0; i < numFeatures; i++) {
      const values = data.map(d => d.values[i]);
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      this.featureStats[i] = { mean, stdDev };
    }
  }

  predict(testValues) {
    if (!this.featureStats || Object.keys(this.featureStats).length === 0) {
      return { prediction: 0, confidence: 0 };
    }

    // Count how many features are outside normal range (> 2 std devs)
    let abnormalCount = 0;
    let totalDeviation = 0;

    for (let i = 0; i < testValues.length; i++) {
      const { mean, stdDev } = this.featureStats[i];
      const zScore = Math.abs((testValues[i] - mean) / (stdDev || 1));
      totalDeviation += zScore;

      if (zScore > 2) abnormalCount++;
    }

    const confidence = abnormalCount / testValues.length;
    return {
      prediction: confidence > 0.3 ? 1 : 0,
      confidence: Math.min(confidence, 1)
    };
  }
}

/**
 * Bayesian Classifier
 * Probabilistic model using Bayes' theorem
 */
class BayesianModel {
  constructor() {
    this.normalStats = null;
    this.abnormalStats = null;
    this.priorAbnormal = 0.5;
  }

  train(data) {
    const normal = data.filter(d => !d.isAbnormal);
    const abnormal = data.filter(d => d.isAbnormal);

    this.priorAbnormal = abnormal.length / data.length || 0.1;
    this.priorNormal = normal.length / data.length || 0.9;

    this.normalStats = this.calculateStats(normal);
    this.abnormalStats = this.calculateStats(abnormal);
  }

  calculateStats(data) {
    if (data.length === 0) return null;

    const numFeatures = data[0].values.length;
    const stats = {};

    for (let i = 0; i < numFeatures; i++) {
      const values = data.map(d => d.values[i]);
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

      stats[i] = { mean, variance };
    }

    return stats;
  }

  gaussianProbability(x, mean, variance) {
    const exponent = -Math.pow(x - mean, 2) / (2 * variance || 1);
    return Math.exp(exponent) / Math.sqrt(2 * Math.PI * (variance || 1));
  }

  predict(testValues) {
    if (!this.normalStats || !this.abnormalStats) {
      return { prediction: 0, confidence: 0.5 };
    }

    let normalProb = this.priorNormal;
    let abnormalProb = this.priorAbnormal;

    for (let i = 0; i < testValues.length; i++) {
      const { mean: nMean, variance: nVar } = this.normalStats[i];
      const { mean: aMean, variance: aVar } = this.abnormalStats[i];

      normalProb *= this.gaussianProbability(testValues[i], nMean, nVar);
      abnormalProb *= this.gaussianProbability(testValues[i], aMean, aVar);
    }

    const total = normalProb + abnormalProb;
    const confidence = total > 0 ? abnormalProb / total : 0.5;

    return {
      prediction: confidence > 0.5 ? 1 : 0,
      confidence: confidence
    };
  }
}

/**
 * Simple SVM-like Linear Classifier
 * Binary classification using linear separation
 */
class SVMModel {
  constructor(learningRate = 0.01, iterations = 100) {
    this.learningRate = learningRate;
    this.iterations = iterations;
    this.weights = null;
    this.bias = 0;
  }

  train(data) {
    if (data.length === 0) return;

    const numFeatures = data[0].values.length;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    // Gradient descent
    for (let iter = 0; iter < this.iterations; iter++) {
      for (const sample of data) {
        const y = sample.isAbnormal ? 1 : -1;
        const output = this.predict_raw(sample.values);

        // Update weights
        if (y * output < 1) {
          for (let i = 0; i < numFeatures; i++) {
            this.weights[i] += this.learningRate * y * sample.values[i];
          }
          this.bias += this.learningRate * y;
        }
      }
    }
  }

  predict_raw(testValues) {
    return (this.weights || []).reduce((sum, w, i) => sum + w * testValues[i], this.bias);
  }

  predict(testValues) {
    if (!this.weights) return { prediction: 0, confidence: 0.5 };

    const raw = this.predict_raw(testValues);
    // Sigmoid function for probability
    const confidence = 1 / (1 + Math.exp(-raw));

    return {
      prediction: confidence > 0.5 ? 1 : 0,
      confidence: confidence
    };
  }
}

/**
 * Simple Backpropagation Neural Network
 */
class NeuralNetworkModel {
  constructor(hiddenUnits = 10, learningRate = 0.01, iterations = 100) {
    this.hiddenUnits = hiddenUnits;
    this.learningRate = learningRate;
    this.iterations = iterations;
    this.w1 = null;
    this.b1 = null;
    this.w2 = null;
    this.b2 = null;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  sigmoidDerivative(x) {
    return x * (1 - x);
  }

  train(data) {
    if (data.length === 0) return;

    const inputSize = data[0].values.length;
    const outputSize = 1;

    // Initialize weights
    this.w1 = Array(inputSize).fill(0).map(() =>
      Array(this.hiddenUnits).fill(0).map(() => Math.random() - 0.5)
    );
    this.b1 = Array(this.hiddenUnits).fill(0);

    this.w2 = Array(this.hiddenUnits).fill(0).map(() =>
      Array(outputSize).fill(0).map(() => Math.random() - 0.5)
    );
    this.b2 = Array(outputSize).fill(0);

    // Training
    for (let iter = 0; iter < this.iterations; iter++) {
      for (const sample of data) {
        const x = sample.values;
        const y = sample.isAbnormal ? 1 : 0;

        // Forward pass
        const z1 = x.map((_, i) =>
          this.w1[i].reduce((sum, w, j) => sum + w * x[i], 0) + this.b1[0]
        );
        const a1 = z1.map(z => this.sigmoid(z));

        const z2 = this.w2.reduce((sum, w) =>
          sum + w[0] * a1.reduce((s, a, i) => s + a * this.w2[i][0], 0), 0
        ) + this.b2[0];
        const a2 = this.sigmoid(z2);

        // Backward pass (simplified)
        const dz2 = (a2 - y) * this.sigmoidDerivative(a2);
        
        for (let i = 0; i < this.hiddenUnits; i++) {
          this.w2[i][0] -= this.learningRate * dz2 * a1[i];
        }
        this.b2[0] -= this.learningRate * dz2;
      }
    }
  }

  predict(testValues) {
    if (!this.w1 || !this.w2) {
      return { prediction: 0, confidence: 0.5 };
    }

    // Forward pass
    const z1 = testValues.map((_, i) =>
      this.w1[i].reduce((sum, w, j) => sum + w * testValues[i], 0) + this.b1[0]
    );
    const a1 = z1.map(z => this.sigmoid(z));

    const z2 = this.w2.reduce((sum, w) =>
      sum + w[0] * a1.reduce((s, a, i) => s + a * this.w2[i][0], 0), 0
    ) + this.b2[0];
    const confidence = this.sigmoid(z2);

    return {
      prediction: confidence > 0.5 ? 1 : 0,
      confidence: confidence
    };
  }
}

module.exports = {
  KNNModel,
  DecisionTreeModel,
  BayesianModel,
  SVMModel,
  NeuralNetworkModel
};