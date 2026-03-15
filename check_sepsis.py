import joblib  
model = joblib.load(r\"disease_prediction_service\models\sepsis_model.pkl\")  
if hasattr(model, \"feature_names_in_\"):  
    print(list(model.feature_names_in_))  
else:  
    print(\"No feature_names_in_ found\")  
