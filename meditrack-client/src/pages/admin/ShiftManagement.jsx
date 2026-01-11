import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";

function ShiftManagement() {
  const [tabIndex, setTabIndex] = useState(0);
  
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState("Lab Technician");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);

  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [shiftMappings, setShiftMappings] = useState([]);
  const [templateName, setTemplateName] = useState("Morning");
  const [templateStartTime, setTemplateStartTime] = useState("08:00");
  const [templateEndTime, setTemplateEndTime] = useState("16:00");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  useEffect(() => {
    fetchStaff();
    fetchShiftTemplates();
    fetchShiftMappings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList(res.data.users || []);
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  const fetchShiftTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/shift-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShiftTemplates(res.data.shiftTemplates || []);
    } catch (err) {
      console.error("Error fetching shift templates:", err);
    }
  };

  const fetchShiftMappings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/staff-shift-mappings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShiftMappings(res.data.mappings || []);
    } catch (err) {
      console.error("Error fetching shift mappings:", err);
    }
  };

  const filteredStaffList = staffSearch.trim()
    ? staffList.filter((staff) =>
        staff.name.toLowerCase().includes(staffSearch.toLowerCase())
      )
    : staffList;

  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff);
    setStaffSearch(staff.name);
    setRole(staff.role);
    setIsDropdownOpen(false);
    setErrors((prev) => ({ ...prev, staff: "" }));
  };

  const handleStaffSearchChange = (e) => {
    const value = e.target.value;
    setStaffSearch(value);
    setIsDropdownOpen(true);
    if (value.trim() === "") {
      setSelectedStaff(null);
    } else {
      setSelectedStaff(null);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!templateName || !templateStartTime || !templateEndTime) {
      setMessage("❌ All template fields are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/admin/shift-templates",
        {
          name: templateName,
          startTime: templateStartTime,
          endTime: templateEndTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Shift template created successfully!");
      setTemplateName("Morning");
      setTemplateStartTime("08:00");
      setTemplateEndTime("16:00");
      fetchShiftTemplates();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error creating shift template");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure? This will affect all staff mapped to this shift.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/admin/shift-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("✅ Shift template deleted successfully!");
      fetchShiftTemplates();
      fetchShiftMappings();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error deleting shift template");
    }
  };

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedStaff || !selectedTemplateId || !effectiveFrom) {
      setMessage("❌ Staff, Shift Template, and Effective From date are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/admin/staff-shift-mappings",
        {
          staffId: selectedStaff._id,
          staffName: selectedStaff.name,
          role: role,
          shiftTemplateId: selectedTemplateId,
          effectiveFrom: effectiveFrom,
          effectiveTo: effectiveTo || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Staff shift mapping created successfully!");
      setSelectedStaff(null);
      setStaffSearch("");
      setRole("Lab Technician");
      setSelectedTemplateId("");
      setEffectiveFrom("");
      setEffectiveTo("");
      fetchShiftMappings();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error creating mapping");
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm("Are you sure you want to remove this staff from this shift?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/admin/staff-shift-mappings/${mappingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("✅ Staff shift mapping removed successfully!");
      fetchShiftMappings();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error removing mapping");
    }
  };

  const handleClearTemplate = () => {
    setTemplateName("Morning");
    setTemplateStartTime("08:00");
    setTemplateEndTime("16:00");
    setMessage("");
  };

  const handleClearMapping = () => {
    setSelectedStaff(null);
    setStaffSearch("");
    setRole("Lab Technician");
    setSelectedTemplateId("");
    setEffectiveFrom("");
    setEffectiveTo("");
    setMessage("");
    setIsDropdownOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#0D47A1" }}>
          <Tabs
            value={tabIndex}
            onChange={(e, newValue) => setTabIndex(newValue)}
            sx={{
              "& .MuiTab-root": { color: "#fff", textTransform: "none", fontWeight: 500 },
              "& .Mui-selected": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <Tab label="Shift Templates" />
            <Tab label="Staff Shift Mappings" />
          </Tabs>
        </Box>

        {tabIndex === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, color: "#0D47A1" }}
            >
              Manage Shift Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create and manage fixed hospital shift templates (Morning, Evening, Night).
            </Typography>

            {message && (
              <Typography
                color={message.includes("✅") ? "success" : "error"}
                sx={{ mb: 2 }}
              >
                {message}
              </Typography>
            )}

            <form onSubmit={handleCreateTemplate}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2, mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Template Name</InputLabel>
                  <Select value={templateName} label="Template Name" onChange={(e) => setTemplateName(e.target.value)}>
                    <MenuItem value="Morning">Morning</MenuItem>
                    <MenuItem value="Evening">Evening</MenuItem>
                    <MenuItem value="Night">Night</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Start Time" type="time" value={templateStartTime} onChange={(e) => setTemplateStartTime(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField label="End Time" type="time" value={templateEndTime} onChange={(e) => setTemplateEndTime(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Box>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Button type="submit" variant="contained" sx={{ bgcolor: "#1565C0", color: "#fff" }}>Create Template</Button>
                <Button type="button" variant="outlined" onClick={handleClearTemplate}>Clear</Button>
              </Box>
            </form>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>Existing Shift Templates</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#0D47A1" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Start Time</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>End Time</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shiftTemplates.length > 0 ? (
                    shiftTemplates.map((template) => (
                      <TableRow key={template._id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{template.startTime}</TableCell>
                        <TableCell>{template.endTime}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" color="error" onClick={() => handleDeleteTemplate(template._id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No shift templates created</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: "#0D47A1" }}>
              Assign Staff to Shifts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Map staff members to shift templates.
            </Typography>

            {message && (
              <Typography color={message.includes("✅") ? "success" : "error"} sx={{ mb: 2 }}>
                {message}
              </Typography>
            )}

            <form onSubmit={handleCreateMapping}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
                <Box ref={dropdownRef} sx={{ position: "relative" }}>
                  <TextField
                    label="Staff Name"
                    value={staffSearch}
                    onChange={handleStaffSearchChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    fullWidth
                    placeholder="Search staff..."
                  />
                  {isDropdownOpen && (
                    <Box sx={{ position: "absolute", top: "100%", left: 0, right: 0, bgcolor: "#fff", border: "1px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 4px 4px", maxHeight: "250px", overflowY: "auto", zIndex: 1000, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      {(staffSearch.trim() ? staffList.filter(s => s.name.toLowerCase().includes(staffSearch.toLowerCase())) : staffList).slice(0, 10).map((staff) => (
                        <Box key={staff._id} onClick={() => handleStaffSelect(staff)} sx={{ p: 1.5, cursor: "pointer", bgcolor: selectedStaff?._id === staff._id ? "#e3f2fd" : "transparent", "&:hover": { bgcolor: "#f5f5f5" } }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{staff.name}</Typography>
                          <Typography variant="caption" sx={{ color: "#666" }}>{staff.role}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Shift Template</InputLabel>
                  <Select value={selectedTemplateId} label="Shift Template" onChange={(e) => setSelectedTemplateId(e.target.value)}>
                    {shiftTemplates.map((t) => (
                      <MenuItem key={t._id} value={t._id}>{t.name} ({t.startTime} - {t.endTime})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField label="Role" value={role} fullWidth disabled InputProps={{ readOnly: true }} />
                <TextField label="Effective From" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Effective To (Optional)" type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              </Box>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Button type="submit" variant="contained" sx={{ bgcolor: "#1565C0", color: "#fff" }}>Create Mapping</Button>
                <Button type="button" variant="outlined" onClick={handleClearMapping}>Clear</Button>
              </Box>
            </form>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>Active Staff-Shift Mappings</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#0D47A1" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Staff Name</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Shift</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Effective From</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shiftMappings.length > 0 ? (
                    shiftMappings.map((mapping) => (
                      <TableRow key={mapping._id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                        <TableCell>{mapping.staffName}</TableCell>
                        <TableCell>{mapping.role}</TableCell>
                        <TableCell>{mapping.shiftTemplateId?.name || "-"}</TableCell>
                        <TableCell>{mapping.shiftTemplateId?.startTime} - {mapping.shiftTemplateId?.endTime}</TableCell>
                        <TableCell>{new Date(mapping.effectiveFrom).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" color="error" onClick={() => handleDeleteMapping(mapping._id)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No staff-shift mappings created</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ShiftManagement;
