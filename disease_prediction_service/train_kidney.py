import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Create models directory
os.makedirs("models", exist_ok=True)

# Load kidney disease dataset
data_path = "data/kidney_disease.csv"
if not os.path.exists(data_path):
    print(f"Error: Dataset not found at {data_path}")
    exit(1)

df = pd.read_csv(data_path)

# Drop id column
df = df.drop('id', axis=1)

# Clean numeric columns (PCV, WC, RC sometimes have tabs/newlines)
for col in ['pcv', 'wc', 'rc']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Fill missing values for numeric columns with mean
numeric_cols = df.select_dtypes(include=[np.number]).columns
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

# List of categorical columns to encode
categorical_cols = ['rbc', 'pc', 'pcc', 'ba', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane']

# Fill missing values for categorical columns with mode and encode
label_encoders = {}
for col in categorical_cols:
    df[col] = df[col].astype(str).str.strip()
    df[col] = df[col].replace('nan', df[col].mode()[0])
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

# Encode target classification
df['classification'] = df['classification'].astype(str).str.strip()
# Handle potential variations in label like 'ckd\t'
df['classification'] = df['classification'].apply(lambda x: 'ckd' if 'ckd' in x else 'notckd')
le_target = LabelEncoder()
df['classification'] = le_target.fit_transform(df['classification'])
label_encoders['classification'] = le_target

# Features and Target
X = df.drop('classification', axis=1)
y = df['classification']

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model and metadata
joblib.dump(model, "models/kidney_model.pkl")
joblib.dump(X.columns.tolist(), "models/kidney_features.pkl")
joblib.dump(label_encoders, "models/kidney_encoders.pkl")

print("Kidney Disease Model trained and saved successfully")
print(f"Accuracy: {model.score(X_test, y_test):.2f}")
