"""ML Models for lab anomaly detection and doctor performance analysis"""
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier, NearestNeighbors
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

class MLModels:
    def __init__(self):
        self.models = {
            'knn': KNeighborsClassifier(n_neighbors=3),
            'decision_tree': DecisionTreeClassifier(random_state=42),
            'naive_bayes': GaussianNB(),
            'svm': SVC(kernel='rbf', random_state=42),
            'neural_network': MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=1000, random_state=42)
        }
        self.scaler = StandardScaler()
        self.is_trained = False
        self.results = {}

    def prepare_data(self, training_data):
        """Convert consultation training data to ML features
        
        training_data format: list of consultations with hemoglobin, wbc, glucose
        Each consultation: {
            'hemoglobin': {'value': float, 'isAbnormal': bool},
            'wbc': {'value': float, 'isAbnormal': bool},
            'glucose': {'value': float, 'isAbnormal': bool}
        }
        """
        X = []
        y = []
        
        for consultation in training_data:
            try:
                # Extract values from structured consultation data
                hemo_value = float(consultation['hemoglobin']['value'])
                wbc_value = float(consultation['wbc']['value'])
                glucose_value = float(consultation['glucose']['value'])
                
                # Create sample from this consultation
                X.append([hemo_value, wbc_value, glucose_value])
                
                # Label as abnormal if ANY parameter is abnormal
                is_abnormal = (consultation['hemoglobin']['isAbnormal'] or 
                              consultation['wbc']['isAbnormal'] or 
                              consultation['glucose']['isAbnormal'])
                y.append(1 if is_abnormal else 0)
                    
            except (ValueError, TypeError, KeyError) as e:
                continue
        
        if len(X) < 2:
            print(f"Insufficient data: need at least 2 complete consultations")
            return None, None

        X = np.array(X, dtype=np.float32)
        y = np.array(y, dtype=np.int32)
        
        print(f"Prepared {len(X)} training samples")
        print(f"  Normal samples: {np.sum(y == 0)}")
        print(f"  Abnormal samples: {np.sum(y == 1)}")
        print(f"  Feature ranges - Hemoglobin: {X[:, 0].min():.2f}-{X[:, 0].max():.2f}, "
              f"WBC: {X[:, 1].min():.2f}-{X[:, 1].max():.2f}, "
              f"Glucose: {X[:, 2].min():.2f}-{X[:, 2].max():.2f}")

        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled, y

    def train(self, lab_results):
        """Train all models"""
        X, y = self.prepare_data(lab_results)

        if X is None or len(np.unique(y)) < 2:
            return {'error': 'Insufficient training data. Need at least 2 samples with both normal and abnormal values.'}

        self.results = {}

        for model_name, model in self.models.items():
            try:
                model.fit(X, y)
                
                # Get predictions
                y_pred = model.predict(X)
                
                # Calculate metrics
                tn, fp, fn, tp = confusion_matrix(y, y_pred).ravel() if len(np.unique(y)) > 1 else [0, 0, 0, 0]
                
                accuracy = accuracy_score(y, y_pred)
                precision = precision_score(y, y_pred, zero_division=0)
                recall = recall_score(y, y_pred, zero_division=0)
                f1 = f1_score(y, y_pred, zero_division=0)

                self.results[model_name] = {
                    'accuracy': round(accuracy, 4),
                    'precision': round(precision, 4),
                    'recall': round(recall, 4),
                    'f1_score': round(f1, 4),
                    'confusion_matrix': {
                        'true_positives': int(tp),
                        'false_positives': int(fp),
                        'true_negatives': int(tn),
                        'false_negatives': int(fn)
                    }
                }
            except Exception as e:
                self.results[model_name] = {'error': str(e)}

        self.is_trained = True
        return self.results

    def predict(self, value):
        """Predict if value is abnormal"""
        if not self.is_trained:
            return {'error': 'Models not trained yet'}

        try:
            value = float(value)
            X_scaled = self.scaler.transform([[value]])
            
            predictions = {}
            for model_name, model in self.models.items():
                pred = int(model.predict(X_scaled)[0])
                predictions[model_name] = {'is_abnormal': bool(pred)}
            
            return predictions
        except Exception as e:
            return {'error': str(e)}
    
    def predict_multi_feature(self, features):
        """Predict if multiple features (e.g., Hemoglobin, WBC, Glucose) are abnormal"""
        if not self.is_trained:
            return {'error': 'Models not trained yet'}

        try:
            # Convert features to numpy array
            feature_values = np.array([float(f) for f in features]).reshape(1, -1)
            
            # Scale features
            X_scaled = self.scaler.transform(feature_values)
            
            predictions = {}
            for model_name, model in self.models.items():
                try:
                    pred = int(model.predict(X_scaled)[0])
                    # Try to get probability for confidence
                    confidence = 0.5
                    if hasattr(model, 'predict_proba'):
                        proba = model.predict_proba(X_scaled)[0]
                        confidence = max(proba)  # Max probability
                    
                    predictions[model_name] = {
                        'is_abnormal': bool(pred),
                        'prediction': int(pred),  # 0 = Normal, 1 = Abnormal
                        'confidence': float(confidence)
                    }
                except Exception as e:
                    predictions[model_name] = {'error': str(e)}
            
            return predictions
        except Exception as e:
            return {'error': str(e)}

    def get_metrics(self):
        """Get all trained model metrics"""
        if not self.is_trained:
            return {'error': 'Models not trained yet'}
        
        # Calculate averages
        if self.results:
            avg_accuracy = np.mean([r.get('accuracy', 0) for r in self.results.values() if 'accuracy' in r])
            avg_precision = np.mean([r.get('precision', 0) for r in self.results.values() if 'precision' in r])
            avg_recall = np.mean([r.get('recall', 0) for r in self.results.values() if 'recall' in r])
            avg_f1 = np.mean([r.get('f1_score', 0) for r in self.results.values() if 'f1_score' in r])

            # Find best model
            best_model = max(
                [(name, r.get('f1_score', 0)) for name, r in self.results.items() if 'f1_score' in r],
                key=lambda x: x[1]
            )[0]

            # Determine reliability
            if avg_f1 > 0.75:
                reliability = 'HIGH'
            elif avg_f1 > 0.6:
                reliability = 'MEDIUM'
            else:
                reliability = 'LOW'

            return {
                'models': self.results,
                'average_metrics': {
                    'accuracy': round(float(avg_accuracy), 4),
                    'precision': round(float(avg_precision), 4),
                    'recall': round(float(avg_recall), 4),
                    'f1_score': round(float(avg_f1), 4)
                },
                'best_model': best_model,
                'reliability_level': reliability
            }
        
        return self.results


class DoctorPerformanceKNN:
    """KNN-based doctor performance analysis and clustering"""
    
    def __init__(self, n_neighbors=3):
        self.n_neighbors = n_neighbors
        self.knn = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.doctor_data = {}
        self.metrics_history = {}
    
    def prepare_doctor_metrics(self, doctors_data):
        """
        Prepare doctor performance metrics from raw data
        
        doctors_data format: list of dicts with doctor info and their visits/consultations
        Each doctor: {
            'id': doctor_id,
            'name': doctor_name,
            'department': department_name,
            'totalVisits': int,
            'uniquePatients': int,
            'averageConsultationFee': float,
            'visitCompletionRate': float (0-1),
            'prescriptionFrequency': float (0-1),
            'repeatPatientPercentage': float (0-1)
        }
        """
        X = []
        doctor_ids = []
        doctor_info = {}
        
        for doctor in doctors_data:
            try:
                # Extract metrics
                metrics = [
                    float(doctor.get('totalVisits', 0)),
                    float(doctor.get('uniquePatients', 0)),
                    float(doctor.get('averageConsultationFee', 0)),
                    float(doctor.get('visitCompletionRate', 0)),
                    float(doctor.get('prescriptionFrequency', 0)),
                    float(doctor.get('repeatPatientPercentage', 0))
                ]
                
                X.append(metrics)
                doctor_ids.append(doctor['id'])
                doctor_info[doctor['id']] = {
                    'name': doctor.get('name', 'Unknown'),
                    'department': doctor.get('department', 'Unknown'),
                    'metrics': {
                        'totalVisits': doctor.get('totalVisits', 0),
                        'uniquePatients': doctor.get('uniquePatients', 0),
                        'averageConsultationFee': round(float(doctor.get('averageConsultationFee', 0)), 2),
                        'visitCompletionRate': round(float(doctor.get('visitCompletionRate', 0)), 4),
                        'prescriptionFrequency': round(float(doctor.get('prescriptionFrequency', 0)), 4),
                        'repeatPatientPercentage': round(float(doctor.get('repeatPatientPercentage', 0)), 2)
                    }
                }
            except (ValueError, TypeError, KeyError) as e:
                print(f"Skipping doctor data due to error: {e}")
                continue
        
        if len(X) < 2:
            return None, None, None, None
        
        X = np.array(X, dtype=np.float32)
        X_scaled = self.scaler.fit_transform(X)
        
        self.doctor_data = doctor_info
        
        print(f"Prepared {len(X)} doctor records for performance analysis")
        return X_scaled, doctor_ids, doctor_info, X
    
    def train(self, doctors_data):
        """Train KNN on doctor performance metrics"""
        X_scaled, doctor_ids, doctor_info, X = self.prepare_doctor_metrics(doctors_data)
        
        if X_scaled is None or len(doctor_ids) < self.n_neighbors:
            return {'error': f'Insufficient data. Need at least {self.n_neighbors} doctors.'}
        
        try:
            self.knn = NearestNeighbors(n_neighbors=min(self.n_neighbors, len(doctor_ids)))
            self.knn.fit(X_scaled)
            self.is_trained = True
            
            return {
                'status': 'trained',
                'doctors_analyzed': len(doctor_ids),
                'doctor_info': doctor_info
            }
        except Exception as e:
            return {'error': str(e)}
    
    def find_similar_doctors(self, doctor_id, k=3):
        """Find k similar doctors using KNN"""
        if not self.is_trained:
            return {'error': 'Model not trained yet'}
        
        doctor_ids = list(self.doctor_data.keys())
        try:
            if doctor_id not in doctor_ids:
                return {'error': f'Doctor {doctor_id} not found in trained data'}
            
            doctor_index = doctor_ids.index(doctor_id)
            target_metrics = np.array([
                self.doctor_data[doctor_id]['metrics']['totalVisits'],
                self.doctor_data[doctor_id]['metrics']['uniquePatients'],
                self.doctor_data[doctor_id]['metrics']['averageConsultationFee'],
                self.doctor_data[doctor_id]['metrics']['visitCompletionRate'],
                self.doctor_data[doctor_id]['metrics']['prescriptionFrequency'],
                self.doctor_data[doctor_id]['metrics']['repeatPatientPercentage']
            ]).reshape(1, -1)
            
            target_scaled = self.scaler.transform(target_metrics)
            
            # Get k+1 neighbors (including self)
            distances, indices = self.knn.kneighbors(target_scaled, n_neighbors=min(k+1, len(doctor_ids)))
            
            similar = []
            for distance, idx in zip(distances[0], indices[0]):
                similar_doctor_id = doctor_ids[idx]
                if similar_doctor_id != doctor_id:  # Exclude self
                    similar.append({
                        'doctorId': similar_doctor_id,
                        'name': self.doctor_data[similar_doctor_id]['name'],
                        'distance': float(distance),
                        'metrics': self.doctor_data[similar_doctor_id]['metrics']
                    })
            
            return {
                'doctorId': doctor_id,
                'doctorName': self.doctor_data[doctor_id]['name'],
                'targetMetrics': self.doctor_data[doctor_id]['metrics'],
                'similarDoctors': similar[:k]
            }
        except Exception as e:
            return {'error': str(e)}
    
    def get_performance_ranking(self):
        """Rank all doctors by overall performance score"""
        if not self.is_trained:
            return {'error': 'Model not trained yet'}
        
        try:
            rankings = []
            
            for doctor_id, info in self.doctor_data.items():
                metrics = info['metrics']
                
                # Calculate performance score (0-100)
                # Weight factors: visits (30%), unique patients (25%), completion rate (25%), prescription frequency (20%)
                # Baseline: 50 visits for full visits credit, 25 patients for full patient credit
                visit_score = min(metrics['totalVisits'] / 50 * 30, 30)  # 50 visits = 30 points max
                patient_score = min(metrics['uniquePatients'] / 25 * 25, 25)  # 25 patients = 25 points max
                completion_score = metrics['visitCompletionRate'] * 25  # 0-1 scale, worth 25%
                prescription_score = metrics['prescriptionFrequency'] * 20  # 0-1 scale, worth 20%
                
                overall_score = visit_score + patient_score + completion_score + prescription_score
                
                rankings.append({
                    'doctorId': doctor_id,
                    'doctorName': info['name'],
                    'department': info['department'],
                    'overallScore': round(float(overall_score), 2),
                    'metrics': metrics,
                    'performanceGrade': self._get_grade(overall_score)
                })
            
            # Sort by overall score descending
            rankings.sort(key=lambda x: x['overallScore'], reverse=True)
            
            return {
                'rankings': rankings,
                'totalDoctors': len(rankings)
            }
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def _get_grade(score):
        """Assign performance grade based on score"""
        if score >= 85:
            return 'A - Excellent'
        elif score >= 70:
            return 'B - Good'
        elif score >= 55:
            return 'C - Average'
        elif score >= 40:
            return 'D - Below Average'
        else:
            return 'F - Needs Improvement'


# Global instances
ml_engine = MLModels()
doctor_performance_knn = DoctorPerformanceKNN(n_neighbors=3)