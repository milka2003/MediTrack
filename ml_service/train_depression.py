from ml_models import depression_risk_model
import os

if __name__ == "__main__":
    print("Training depression risk model...")
    result = depression_risk_model.train()
    
    if 'error' in result:
        print(f"Error: {result['error']}")
    else:
        print("Training successful!")
        print(f"Metrics: {result['metrics']}")
