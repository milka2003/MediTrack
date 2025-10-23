// src/pages/reception/CreateVisit.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
} from "@mui/material";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});
// Always attach latest token
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default function CreateVisit() {
  const [patientSearch, setPatientSearch] = useState("");
  const [patient, setPatient] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    department: "",
    doctor: "",
    date: "",
  });
  const [schedule, setSchedule] = useState([]);
  const [message, setMessage] = useState("");
  const [tokenNumber, setTokenNumber] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const { data } = await api.get("/admin/departments");
    setDepartments(data.departments || []);
  };

  const searchPatient = async () => {
    try {
      const { data } = await api.get(`/reception/search?q=${encodeURIComponent(patientSearch)}`);
      // Normalize to {name, opNumber}
      setPatient({
        name: data.patient.firstName || data.patient.name,
        opNumber: data.patient.opNumber,
      });
      setMessage("");
    } catch (err) {
      setMessage("❌ Patient not found");
      setPatient(null);
    }
  };

  const loadDoctors = async (depId) => {
    const { data } = await api.get(`/admin/doctors?department=${depId}`);
    setDoctors(data.doctors || []);
  };

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);

    if (e.target.name === "department") {
      loadDoctors(e.target.value);
    }
  };

  const fetchSchedule = async () => {
    if (!form.doctor || !form.date) return;
    const day = new Date(form.date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    const doc = doctors.find((d) => d._id === form.doctor);
    if (!doc) return;

    const rows = doc.schedule.filter((s) => s.day === day);
    // optionally check booked count with GET /visits?doctorId&date
    setSchedule(rows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient) return setMessage("❌ Please select a patient first");

    try {
      const { data } = await api.post("/visits", {
        opNumber: patient.opNumber,
        doctorId: form.doctor,
        date: form.date,
      });
      setTokenNumber(data.visit.tokenNumber);
      setMessage("✅ Appointment booked successfully!");
      setForm({ department: "", doctor: "", date: "" });
      setSchedule([]);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error booking visit");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Visit
      </Typography>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 600 }}>
        <Typography variant="subtitle1">Find Patient</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Search by OP Number / Phone"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={searchPatient}>
            Search
          </Button>
        </Stack>

        {patient && (
          <Typography>
            ✅ Patient: {patient.name} (OP: {patient.opNumber})
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              select
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Doctor"
              name="doctor"
              value={form.doctor}
              onChange={handleChange}
              required
            >
              {doctors.map((doc) => (
                <MenuItem key={doc._id} value={doc._id}>
                  {doc.user?.name} ({doc.specialization})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Date"
              name="date"
              value={form.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              onBlur={fetchSchedule}
              required
            />

            {schedule.length > 0 ? (
              <Box>
                <Typography variant="subtitle2">Available Slots</Typography>
                {schedule.map((s, i) => (
                  <div key={i}>
                    {s.startTime} - {s.endTime} (Max: {s.maxPatients || "∞"})
                  </div>
                ))}
              </Box>
            ) : (
              form.doctor && form.date && (
                <Typography color="warning.main">Doctor not available on selected day.</Typography>
              )
            )}

            <Button type="submit" variant="contained" disabled={form.doctor && form.date && schedule.length === 0}>
              Book Appointment
            </Button>
          </Stack>
        </form>
      </Paper>

      {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
      {tokenNumber && (
        <Typography variant="h6" color="primary">
          Token Number: {tokenNumber}
        </Typography>
      )}
    </Box>
  );
}
