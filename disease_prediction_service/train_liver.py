import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Create models directory
base_dir = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(base_dir, "models"), exist_ok=True)

# Load liver disease dataset
data_path = os.path.join(base_dir, "data", "liver.csv")
if not os.path.exists(data_path):
    print(f"Error: Dataset not found at {data_path}")
    exit(1)

df = pd.read_csv(data_path)

# Fill missing values for Albumin_and_Globulin_Ratio with mean
df['Albumin_and_Globulin_Ratio'] = df['Albumin_and_Globulin_Ratio'].fillna(df['Albumin_and_Globulin_Ratio'].mean())

# Encode Gender
# LabelEncoder will encode Female as 0 and Male as 1 alphabetically
le_gender = LabelEncoder()
df['Gender'] = le_gender.fit_transform(df['Gender'])

# Encode target Dataset (1: liver patient, 2: non-liver patient)
# Convert to 1 for patient, 0 for non-patient
df['Dataset'] = df['Dataset'].map({1: 1, 2: 0})

# Features and Target
X = df.drop('Dataset', axis=1)
y = df['Dataset']

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model and metadata
joblib.dump(model, os.path.join(base_dir, "models", "liver_model.pkl"))
joblib.dump(X.columns.tolist(), os.path.join(base_dir, "models", "liver_features.pkl"))
joblib.dump({'Gender': le_gender}, os.path.join(base_dir, "models", "liver_encoders.pkl"))

print("Liver Disease Model trained and saved successfully")
print(f"Accuracy: {model.score(X_test, y_test):.2f}")
print(f"Features: {X.columns.tolist()}")
