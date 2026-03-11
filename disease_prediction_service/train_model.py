import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Create data directory
os.makedirs("models", exist_ok=True)

# Load anemia dataset
data_path = "data/anemia.csv"
if not os.path.exists(data_path):
    print(f"Error: Dataset not found at {data_path}")
    exit(1)

df = pd.read_csv(data_path)

# Features: Gender, Hemoglobin, MCH, MCHC, MCV
# Target: Result (0: No Anemia, 1: Anemia)
X = df.drop('Result', axis=1)
y = df['Result']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model
model_path = "models/disease_risk_model.pkl"
joblib.dump(model, model_path)

# Save feature list to ensure consistency during prediction
joblib.dump(X.columns.tolist(), "models/features.pkl")

print(f"Model trained and saved to {model_path}")
print(f"Model accuracy on test set: {model.score(X_test, y_test):.2f}")
print("\nClassification Report:")
print(classification_report(y_test, model.predict(X_test)))
