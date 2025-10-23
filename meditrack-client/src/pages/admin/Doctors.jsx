// src/pages/admin/Doctors.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
} from "@mui/material";
import api from "../../api/client";

export default function Doctors() {
  const [form, setForm] = useState({
    user: "",
    department: "",
    specialization: "",
    qualification: "",
    experience: "",
    registrationNumber: "",
    consultationFee: "",
  });

  const [schedule, setSchedule] = useState([
    { day: "", startTime: "", endTime: "", maxPatients: "" },
  ]);

  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadDoctors();
    loadUsers();
    loadDepartments();
  }, []);

  const loadDoctors = async () => {
    try {
      const { data } = await api.get("/admin/doctors");
      setDoctors(data.doctors || []);
    } catch (err) {
      setDoctors([]);
      setMessage(err.response?.data?.message || "Failed to load doctors");
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get("/admin/staff?role=Doctor");
      setUsers(data.users || []);
    } catch (err) {
      setUsers([]);
      setMessage(err.response?.data?.message || "Failed to load users");
    }
  };

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/admin/departments");
      setDepartments(data.departments || []);
    } catch (err) {
      setDepartments([]);
      setMessage(err.response?.data?.message || "Failed to load departments");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ===== Schedule handlers =====
  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const addScheduleRow = () => {
    setSchedule([
      ...schedule,
      { day: "", startTime: "", endTime: "", maxPatients: "" },
    ]);
  };

  // ===== Form Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/doctors/${editingId}`, { ...form, schedule });
        setMessage("✅ Doctor updated successfully!");
      } else {
        await api.post("/admin/doctors", { ...form, schedule });
        setMessage("✅ Doctor added successfully!");
      }

      resetForm();
      loadDoctors();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error saving doctor");
      setTimeout(() => setMessage(""), 3000); // clear error too
    }
  };

  // ===== Edit doctor =====
  const editDoctor = (doc) => {
    setForm({
      user: doc.user?._id || "",
      department: doc.department?._id || "",
      specialization: doc.specialization || "",
      qualification: doc.qualification || "",
      experience: doc.experience || "",
      registrationNumber: doc.registrationNumber || "",
      consultationFee: doc.consultationFee || "",
    });
    setSchedule(
      doc.schedule.length
        ? doc.schedule.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            maxPatients: s.maxPatients || "",
          }))
        : [{ day: "", startTime: "", endTime: "", maxPatients: "" }]
    );
    setEditingId(doc._id);
  };

  // ===== Cancel editing =====
  const cancelEdit = () => {
    resetForm();
    setEditingId(null);
    setMessage("");
  };

  // ===== Reset form =====
  const resetForm = () => {
    setForm({
      user: "",
      department: "",
      specialization: "",
      qualification: "",
      experience: "",
      registrationNumber: "",
      consultationFee: "",
    });
    setSchedule([{ day: "", startTime: "", endTime: "", maxPatients: "" }]);
    setEditingId(null);
  };

  // ===== Toggle active/inactive =====
  const toggleDoctor = async (id) => {
    try {
      await api.delete(`/admin/doctors/${id}/toggle`);
      loadDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  // ===== Hard delete doctor =====
  const deleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      loadDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Doctor Management
      </Typography>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 600 }}>
        <Typography variant="subtitle1" gutterBottom>
          {editingId ? "Edit Doctor" : "Add Doctor"}
        </Typography>
        {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* Select staff user with Doctor role */}
            <TextField
              select
              label="Select Doctor User"
              name="user"
              value={form.user}
              onChange={handleChange}
              required
              disabled={!!editingId}
            >
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.name} ({u.username})
                </MenuItem>
              ))}
            </TextField>

            {/* Department */}
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
              label="Specialization"
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
            />
            <TextField
              label="Qualification"
              name="qualification"
              value={form.qualification}
              onChange={handleChange}
            />
            <TextField
              label="Experience"
              name="experience"
              value={form.experience}
              onChange={handleChange}
            />
            <TextField
              label="Registration Number"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
            />
            <TextField
              type="number"
              label="Consultation Fee"
              name="consultationFee"
              value={form.consultationFee}
              onChange={handleChange}
            />

            {/* Schedule Section */}
            <Typography variant="subtitle1">Schedule</Typography>
            {schedule.map((s, index) => (
              <Stack direction="row" spacing={2} key={index}>
                <TextField
                  select
                  label="Day"
                  value={s.day}
                  onChange={(e) =>
                    handleScheduleChange(index, "day", e.target.value)
                  }
                  sx={{ minWidth: 120 }}
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="time"
                  label="Start"
                  value={s.startTime}
                  onChange={(e) =>
                    handleScheduleChange(index, "startTime", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="time"
                  label="End"
                  value={s.endTime}
                  onChange={(e) =>
                    handleScheduleChange(index, "endTime", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="number"
                  label="Max Patients"
                  value={s.maxPatients}
                  onChange={(e) =>
                    handleScheduleChange(index, "maxPatients", e.target.value)
                  }
                  sx={{ width: 120 }}
                />
              </Stack>
            ))}
            <Button onClick={addScheduleRow} variant="outlined">
              + Add Row
            </Button>

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained">
                {editingId ? "Update Doctor" : "Add Doctor"}
              </Button>
              {editingId && (
                <Button onClick={cancelEdit} variant="outlined" color="secondary">
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </Paper>

      {/* Doctors list */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Doctors List</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Reg. No</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell>{doc.user?.name}</TableCell>
                <TableCell>{doc.department?.name}</TableCell>
                <TableCell>{doc.specialization}</TableCell>
                <TableCell>{doc.qualification}</TableCell>
                <TableCell>{doc.experience}</TableCell>
                <TableCell>{doc.registrationNumber}</TableCell>
                <TableCell>{doc.consultationFee || "-"}</TableCell>
                <TableCell>
                  {doc.schedule?.map((s, i) => (
                    <div key={i}>
                      {s.day}: {s.startTime} - {s.endTime}{" "}
                      {s.maxPatients ? `(Max: ${s.maxPatients})` : ""}
                    </div>
                  ))}
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={doc.active}
                    onChange={() => toggleDoctor(doc._id)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => editDoctor(doc)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => deleteDoctor(doc._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>No doctors yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
