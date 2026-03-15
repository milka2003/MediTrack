import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# Create models directory
os.makedirs("models", exist_ok=True)

# Load sepsis dataset
data_path = "data/sepsis.csv"
if not os.path.exists(data_path):
    print(f"Error: Dataset not found at {data_path}")
    exit(1)

# Read only necessary columns to save memory if possible
# But file is 52MB, so should be fine to load
df = pd.read_csv(data_path)

# Drop unnecessary columns
cols_to_drop = ['Unnamed: 0', 'Patient_ID', 'Unit1', 'Unit2', 'HospAdmTime', 'ICULOS', 'Hour']
df = df.drop([c for c in cols_to_drop if c in df.columns], axis=1)

# Drop rows where SepsisLabel is missing
df = df.dropna(subset=['SepsisLabel'])

# Features and Target
X = df.drop('SepsisLabel', axis=1)
y = df['SepsisLabel'].astype(int) # Ensure target is integer

# Fill missing values for numeric columns with mean (ONLY FOR FEATURES)
numeric_cols = X.select_dtypes(include=[np.number]).columns
X[numeric_cols] = X[numeric_cols].fillna(X[numeric_cols].mean())

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Model
print("Training Sepsis Prediction Model...")
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Save the model and metadata
joblib.dump(model, "models/sepsis_model.pkl")
joblib.dump(X.columns.tolist(), "models/sepsis_features.pkl")
# Calculate and save means for missing values in production
means = X.mean().to_dict()
joblib.dump(means, "models/sepsis_means.pkl")

print("Sepsis Prediction Model trained and saved successfully")
print(f"Accuracy: {model.score(X_test, y_test):.2f}")
print(f"Features used: {X.columns.tolist()}")
