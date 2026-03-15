import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# Create models directory
os.makedirs("models", exist_ok=True)

# Load cardiovascular dataset
data_path = "data/cardiovascular.csv"
if not os.path.exists(data_path):
    print(f"Error: Dataset not found at {data_path}")
    exit(1)

df = pd.read_csv(data_path)

# Handle missing values
# Most columns are numeric
numeric_cols = df.select_dtypes(include=[np.number]).columns
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

# For any non-numeric columns that might have NAs (like 'education' in some versions)
df = df.fillna(0)

# Features and Target
# Target is 'TenYearCHD'
target_col = 'TenYearCHD'
if target_col not in df.columns:
    # Handle potential case sensitivity or name variations
    for col in df.columns:
        if col.lower() == 'tenyearchd':
            target_col = col
            break

X = df.drop(target_col, axis=1)
y = df[target_col]

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model and metadata
joblib.dump(model, "models/cardio_model.pkl")
joblib.dump(X.columns.tolist(), "models/cardio_features.pkl")

print("Cardiovascular Risk Model trained and saved successfully")
print(f"Accuracy: {model.score(X_test, y_test):.2f}")
print(f"Features: {X.columns.tolist()}")
