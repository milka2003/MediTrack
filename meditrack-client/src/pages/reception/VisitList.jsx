// src/pages/reception/VisitList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
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

function formatDateYYYYMMDD(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export default function VisitList() {
  const [date, setDate] = useState(formatDateYYYYMMDD(new Date()));
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ department: "", doctor: "", status: "" });
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDepartments();
    loadDoctors();
  }, []);

  useEffect(() => {
    loadVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, filters.doctor, filters.status]);

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/admin/departments");
      setDepartments(data.departments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDoctors = async (depId) => {
    try {
      const url = depId ? `/admin/doctors?department=${depId}` : "/admin/doctors";
      const { data } = await api.get(url);
      setDoctors(data.doctors || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadVisits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (date) params.append("date", date);
      if (filters.doctor) params.append("doctorId", filters.doctor);
      if (filters.status) params.append("status", filters.status);
      const { data } = await api.get(`/visits?${params.toString()}`);
      setVisits(data.visits || []);
      setMessage("");
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load visits");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
    if (name === "department") {
      setFilters((f) => ({ ...f, department: value, doctor: "" }));
      loadDoctors(value);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/visits/${id}/status`, { status });
      await loadVisits();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to update status");
    }
  };

  const counts = useMemo(() => {
    const c = { open: 0, closed: 0, cancelled: 0 };
    for (const v of visits) c[v.status] = (c[v.status] || 0) + 1;
    return c;
  }, [visits]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Today's Appointments
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            type="date"
            label="Date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Department"
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All</MenuItem>
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
            value={filters.doctor}
            onChange={handleFilterChange}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All</MenuItem>
            {doctors.map((doc) => (
              <MenuItem key={doc._id} value={doc._id}>
                {doc.user?.name} ({doc.department?.name || ""})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <IconButton onClick={loadVisits} title="Refresh" color="primary">
            <RefreshIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1}>
          <Chip label={`Open: ${counts.open}`} color="info" />
          <Chip label={`Closed: ${counts.closed}`} color="success" />
          <Chip label={`Cancelled: ${counts.cancelled}`} color="default" />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Slot</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visits.map((v) => (
              <TableRow key={v._id} hover>
                <TableCell>{v.tokenNumber}</TableCell>
                <TableCell>
                  {v.patientId?.firstName} {v.patientId?.lastName}
                  <div style={{ color: "#666", fontSize: 12 }}>OP: {v.opNumber}</div>
                </TableCell>
                <TableCell>{v.doctorId?.user?.name || ""}</TableCell>
                <TableCell>
                  {v.slot?.startTime && v.slot?.endTime
                    ? `${v.slot.startTime} - ${v.slot.endTime}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={v.status}
                    color={v.status === "open" ? "info" : v.status === "closed" ? "success" : "default"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleIcon />}
                      disabled={v.status !== "open"}
                      onClick={() => changeStatus(v._id, "closed")}
                    >
                      Close
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      disabled={v.status === "cancelled"}
                      onClick={() => changeStatus(v._id, "cancelled")}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {visits.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6}>No visits found for selected filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {message && (
          <Typography sx={{ mt: 2 }} color="error">
            {message}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}