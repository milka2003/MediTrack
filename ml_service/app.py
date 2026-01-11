"""Flask API for ML Models"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_models import ml_engine, doctor_performance_knn
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/ml/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'service': 'ML Models API',
        'trained': ml_engine.is_trained
    })

@app.route('/api/ml/train', methods=['POST'])
def train_models():
    """Train ML models with lab data"""
    try:
        data = request.get_json()
        # Support both old format (lab_results) and new format (trainingData)
        training_data = data.get('trainingData') or data.get('lab_results', [])
        
        if not training_data:
            return jsonify({'error': 'No training data provided'}), 400
        
        results = ml_engine.train(training_data)
        
        return jsonify({
            'status': 'success',
            'trained': True,
            'results': results
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/predict', methods=['POST'])
def predict():
    """Predict if a value is abnormal"""
    try:
        data = request.get_json()
        value = data.get('value')
        
        if value is None:
            return jsonify({'error': 'Value required'}), 400
        
        predictions = ml_engine.predict(value)
        
        return jsonify({
            'status': 'success',
            'predictions': predictions
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/predict-multi', methods=['POST'])
def predict_multi():
    """Predict using multiple features (e.g., Hemoglobin, WBC, Glucose)"""
    try:
        data = request.get_json()
        features = data.get('features')  # [hemoglobin, wbc, glucose]
        model_name = data.get('model')   # Specific model to use, optional
        
        if not features:
            return jsonify({'error': 'Features array required'}), 400
        
        if not isinstance(features, list) or len(features) == 0:
            return jsonify({'error': 'Features must be a non-empty array'}), 400
        
        predictions = ml_engine.predict_multi_feature(features)
        
        # If specific model requested, return only that
        if model_name and model_name in predictions:
            result = {
                'model': model_name,
                'prediction': predictions[model_name]
            }
        else:
            result = {'predictions': predictions}
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/metrics', methods=['GET'])
def get_metrics():
    """Get all trained model metrics"""
    try:
        metrics = ml_engine.get_metrics()
        
        return jsonify({
            'status': 'success',
            'data': metrics
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/status', methods=['GET'])
def status():
    """Get ML engine status"""
    return jsonify({
        'trained': ml_engine.is_trained,
        'models': list(ml_engine.models.keys()),
        'data_points': len(ml_engine.scaler.scale_) if ml_engine.is_trained else 0
    })

# Doctor Performance KNN Endpoints
@app.route('/api/ml/doctor-performance/train', methods=['POST'])
def train_doctor_performance():
    """Train KNN model on doctor performance metrics"""
    try:
        data = request.get_json()
        doctors_data = data.get('doctors', [])
        
        if not doctors_data:
            return jsonify({'error': 'No doctor data provided'}), 400
        
        result = doctor_performance_knn.train(doctors_data)
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/doctor-performance/ranking', methods=['GET'])
def get_doctor_ranking():
    """Get doctor performance rankings"""
    try:
        result = doctor_performance_knn.get_performance_ranking()
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/doctor-performance/similar/<doctor_id>', methods=['GET'])
def get_similar_doctors(doctor_id):
    """Find similar doctors for a given doctor using KNN"""
    try:
        k = request.args.get('k', default=3, type=int)
        
        result = doctor_performance_knn.find_similar_doctors(doctor_id, k=k)
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/doctor-performance/status', methods=['GET'])
def doctor_performance_status():
    """Get doctor performance model status"""
    try:
        return jsonify({
            'status': 'success',
            'data': {
                'trained': doctor_performance_knn.is_trained,
                'doctors_count': len(doctor_performance_knn.doctor_data),
                'model_type': 'KNN (K-Nearest Neighbors)',
                'n_neighbors': doctor_performance_knn.n_neighbors
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5000))
    app.run(debug=True, port=port, host='0.0.0.0')