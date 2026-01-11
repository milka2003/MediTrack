import React, { useState } from 'react';
import './VitalMonitoring.css';

const VitalMonitoring = ({ patientData = null }) => {
  const [vitals, setVitals] = useState({
    systolic: '',
    diastolic: '',
    temperature: '',
    oxygen: '',
    weight: ''
  });

  const [errors, setErrors] = useState('');
  const [success, setSuccess] = useState('');

  const defaultPatient = {
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    visitId: 'VIS-2025-001'
  };

  const patient = patientData || defaultPatient;

  const validateForm = () => {
    const emptyFields = [];
    if (!vitals.systolic) emptyFields.push('Systolic BP');
    if (!vitals.diastolic) emptyFields.push('Diastolic BP');
    if (!vitals.temperature) emptyFields.push('Temperature');
    if (!vitals.oxygen) emptyFields.push('Oxygen Saturation');
    if (!vitals.weight) emptyFields.push('Weight');

    if (emptyFields.length > 0) {
      setErrors(`Please fill in: ${emptyFields.join(', ')}`);
      return false;
    }

    if (isNaN(vitals.systolic) || isNaN(vitals.diastolic) || isNaN(vitals.temperature) || isNaN(vitals.oxygen) || isNaN(vitals.weight)) {
      setErrors('All fields must contain valid numbers');
      return false;
    }

    setErrors('');
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVitals(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors('');
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const vitalData = {
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      visitId: patient.visitId,
      timestamp: new Date().toLocaleString(),
      bloodPressure: `${vitals.systolic}/${vitals.diastolic} mmHg`,
      temperature: `${vitals.temperature}°C`,
      oxygen: `${vitals.oxygen}%`,
      weight: `${vitals.weight} kg`
    };

    console.log('Vital Signs Data Saved:', vitalData);
    setSuccess('✓ Vitals saved successfully!');
    setVitals({
      systolic: '',
      diastolic: '',
      temperature: '',
      oxygen: '',
      weight: ''
    });

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClearForm = () => {
    setVitals({
      systolic: '',
      diastolic: '',
      temperature: '',
      oxygen: '',
      weight: ''
    });
    setErrors('');
    setSuccess('');
  };

  return (
    <div className="vital-monitoring-container">
      <div className="vital-monitoring-wrapper">
        <h1 className="page-title">Patient Vital Monitoring</h1>

        {/* Patient Details Card */}
        <div className="patient-details-card">
          <h2 className="card-title">Patient Information</h2>
          <div className="patient-grid">
            <div className="patient-item">
              <span className="label">Patient Name:</span>
              <span className="value">{patient.name}</span>
            </div>
            <div className="patient-item">
              <span className="label">Age:</span>
              <span className="value">{patient.age} years</span>
            </div>
            <div className="patient-item">
              <span className="label">Gender:</span>
              <span className="value">{patient.gender}</span>
            </div>
            <div className="patient-item">
              <span className="label">Visit ID / Token:</span>
              <span className="value token">{patient.visitId}</span>
            </div>
          </div>
        </div>

        {/* Vitals Form Card */}
        <div className="vitals-form-card">
          <h2 className="card-title">Vital Signs Input</h2>

          {errors && <div className="alert alert-error">{errors}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSaveVitals}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="systolic" className="form-label">
                  Blood Pressure - Systolic (mmHg)
                </label>
                <input
                  type="text"
                  id="systolic"
                  name="systolic"
                  value={vitals.systolic}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="diastolic" className="form-label">
                  Blood Pressure - Diastolic (mmHg)
                </label>
                <input
                  type="text"
                  id="diastolic"
                  name="diastolic"
                  value={vitals.diastolic}
                  onChange={handleInputChange}
                  placeholder="e.g., 80"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="temperature" className="form-label">
                  Body Temperature (°C)
                </label>
                <input
                  type="text"
                  id="temperature"
                  name="temperature"
                  value={vitals.temperature}
                  onChange={handleInputChange}
                  placeholder="e.g., 37.5"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="oxygen" className="form-label">
                  Oxygen Saturation (SpO₂ %)
                </label>
                <input
                  type="text"
                  id="oxygen"
                  name="oxygen"
                  value={vitals.oxygen}
                  onChange={handleInputChange}
                  placeholder="e.g., 98"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight" className="form-label">
                  Weight (kg)
                </label>
                <input
                  type="text"
                  id="weight"
                  name="weight"
                  value={vitals.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 75"
                  className="form-input"
                />
              </div>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Save Vitals
              </button>
              <button type="button" onClick={handleClearForm} className="btn btn-secondary">
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VitalMonitoring;
