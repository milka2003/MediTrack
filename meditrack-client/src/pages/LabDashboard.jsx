// src/pages/LabDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack,
  Chip, Alert, Divider
} from "@mui/material";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

export default function LabDashboard() {
  const [pending, setPending] = useState([]);
  const [query, setQuery] = useState({ opNumber: "", date: "" });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");

  const [selected, setSelected] = useState(null); // { consultationId, itemIndex, ... }
  const [testParameters, setTestParameters] = useState([]);
  const [resultForm, setResultForm] = useState({
    parameterResults: [],
    overallRemarks: "",
    summaryResult: ""
  });

  const loadPending = async () => {
    try {
      const { data } = await api.get("/lab/pending");
      setPending(data.pending || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load pending");
    }
  };

  const saveResult = async () => {
    if (!selected) return;
    try {
      await api.put(`/lab/${selected.consultationId}/result`, {
        itemIndex: selected.itemIndex,
        parameterResults: resultForm.parameterResults,
        overallRemarks: resultForm.overallRemarks,
        summaryResult: resultForm.summaryResult
      });
      setMessage("Result saved");
      setSelected(null);
      setTestParameters([]);
      setResultForm({
        parameterResults: [],
        overallRemarks: "",
        summaryResult: ""
      });
      await loadPending();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to save result");
    }
  };

  const markCollected = async (row) => {
    try {
      await api.post(`/lab/${row.consultationId}/collect-sample`, { itemIndex: row.itemIndex });
      setMessage("Sample marked collected");
      await loadPending();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to update sample collection");
    }
  };

  const searchHistory = async () => {
    if (!query.opNumber) return setMessage("Enter OP number");
    try {
      const { data } = await api.get(`/lab/patient/${query.opNumber}`);
      setHistory(data.history || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load history");
    }
  };

  useEffect(() => { loadPending(); }, []);

  const openDialog = async (row) => {
    setSelected(row);
    try {
      // Load test details to get parameters
      const { data } = await api.get(`/lab-tests/${row.testId}`);
      setTestParameters(data.test.parameters || []);

      // Initialize parameterResults if not exists
      const existingResults = row.parameterResults || [];
      const parameterResults = data.test.parameters.map((param, index) => {
        const existing = existingResults.find(r => r.parameterName === param.name);
        return existing || {
          parameterName: param.name,
          value: "",
          unit: param.unit,
          referenceRange: param.referenceRange,
          valueType: param.valueType,
          isAbnormal: false,
          remarks: ""
        };
      });

      setResultForm({
        parameterResults,
        overallRemarks: row.overallRemarks || "",
        summaryResult: row.summaryResult || ""
      });
    } catch (e) {
      const errorMsg = e.response?.status === 404
        ? "Test not found - it may have been deleted"
        : (e.response?.data?.message || "Failed to load test parameters");
      setMessage(errorMsg);
      setTestParameters([]);
    }
  };

  const closeDialog = () => {
    setSelected(null);
    setTestParameters([]);
    setResultForm({
      parameterResults: [],
      overallRemarks: "",
      summaryResult: ""
    });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      window.location.href = '/login';
    }
  };

  const navigate = useNavigate();

  const updateParameterResult = (index, field, value) => {
    setResultForm(prev => ({
      ...prev,
      parameterResults: prev.parameterResults.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    }));

    // Auto-determine abnormality for numeric values
    if (field === 'value' && resultForm.parameterResults[index]?.valueType === 'numeric') {
      const referenceRange = resultForm.parameterResults[index]?.referenceRange;
      if (referenceRange && value) {
        const isAbnormal = checkAbnormality(value, referenceRange);
        setResultForm(prev => ({
          ...prev,
          parameterResults: prev.parameterResults.map((r, i) =>
            i === index ? { ...r, isAbnormal } : r
          )
        }));
      }
    }
  };

  const checkAbnormality = (value, referenceRange) => {
    // Simple range check: e.g., "70-100" or "< 100" or "> 50"
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    const range = referenceRange.trim();
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(v => parseFloat(v.trim()));
      return numValue < min || numValue > max;
    } else if (range.startsWith('<')) {
      const max = parseFloat(range.substring(1).trim());
      return numValue >= max;
    } else if (range.startsWith('>')) {
      const min = parseFloat(range.substring(1).trim());
      return numValue <= min;
    }
    return false;
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateParameterResult(index, 'value', data.fileUrl);
    } catch (e) {
      setMessage('File upload failed');
    }
  };

  const downloadReport = async (consultationId, itemIndex) => {
    try {
      const response = await api.get(`/lab/report/${consultationId}/${itemIndex}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setMessage('Failed to download report');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" gutterBottom>
          Lab Dashboard
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/lab-dashboard/tests')}>Lab Test Master</Button>
          <Button variant="outlined" onClick={() => navigate('/lab-dashboard/reports/pending')}>Pending Report</Button>
          <Button variant="outlined" onClick={() => navigate('/lab-dashboard/reports/completed')}>Completed Report</Button>
          <Button variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
        </Stack>
      </Box>

      {message && (
        <Typography sx={{ mb: 2 }} color="primary">{message}</Typography>
      )}

      {/* Pending Requests */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Pending Tests</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>Visit ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Test</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pending.map((r) => (
              <TableRow key={`${r.consultationId}-${r.itemIndex}`} hover>
                <TableCell>{r.tokenNumber || '-'}</TableCell>
                <TableCell>{r.visitId}</TableCell>
                <TableCell>
                  {r.patient?.name} ({r.patient?.opNumber})
                </TableCell>
                <TableCell>{r.doctor?.name}</TableCell>
                <TableCell>{r.testName}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => markCollected(r)} disabled={r.status !== 'Pending'}>
                      Mark Collected
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => openDialog(r)} disabled={r.status === 'Completed'}>
                      Enter Result
                    </Button>
                    {r.status === 'Completed' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => downloadReport(r.consultationId, r.itemIndex)}
                      >
                        Download Report
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {pending.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>No pending tests.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* History Search */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Search Results History</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="OP Number"
            value={query.opNumber}
            onChange={(e) => setQuery({ ...query, opNumber: e.target.value })}
          />
          <Button variant="contained" onClick={searchHistory}>Search</Button>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Visit</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Tests</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{h.visitId}</TableCell>
                <TableCell>{h.patient?.name} ({h.patient?.opNumber})</TableCell>
                <TableCell>{h.doctor?.name}</TableCell>
                <TableCell>
                  {h.labRequests?.map((lr, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <strong>{lr.testName}</strong> — {lr.status}
                      {lr.parameterResults && lr.parameterResults.length > 0 && (
                        <div style={{ marginLeft: '16px', fontSize: '0.875rem' }}>
                          {lr.parameterResults.map((pr, j) => (
                            <div key={j}>
                              {pr.parameterName}: {pr.value || 'N/A'}
                              {pr.isAbnormal && <Chip label="Abnormal" color="error" size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />}
                            </div>
                          ))}
                        </div>
                      )}
                      {lr.summaryResult && (
                        <div style={{ marginLeft: '16px', fontSize: '0.875rem', fontStyle: 'italic' }}>
                          Summary: {lr.summaryResult}
                        </div>
                      )}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Update Result Dialog */}
      <Dialog open={!!selected} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>Enter Results — {selected?.testName}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {resultForm.parameterResults.map((paramResult, index) => (
              <Paper key={index} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  {paramResult.parameterName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Reference Range: {paramResult.referenceRange || 'N/A'}
                </Typography>

                <Stack spacing={2}>
                  {paramResult.valueType === 'numeric' && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <TextField
                        label="Value"
                        type="number"
                        value={paramResult.value}
                        onChange={(e) => updateParameterResult(index, 'value', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Typography>Unit: {paramResult.unit}</Typography>
                      {paramResult.isAbnormal && (
                        <Chip label="Abnormal" color="error" size="small" />
                      )}
                    </Stack>
                  )}

                  {paramResult.valueType === 'text' && (
                    <TextField
                      label="Result"
                      value={paramResult.value}
                      onChange={(e) => updateParameterResult(index, 'value', e.target.value)}
                      multiline
                      minRows={2}
                    />
                  )}

                  {paramResult.valueType === 'file' && (
                    <Stack spacing={1}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                        style={{ display: 'none' }}
                        id={`file-upload-${index}`}
                      />
                      <label htmlFor={`file-upload-${index}`}>
                        <Button variant="outlined" component="span">
                          Upload File
                        </Button>
                      </label>
                      {paramResult.value && (
                        <Typography variant="body2" color="primary">
                          File uploaded: {paramResult.value.split('/').pop()}
                        </Typography>
                      )}
                    </Stack>
                  )}

                  <TextField
                    label="Remarks"
                    value={paramResult.remarks}
                    onChange={(e) => updateParameterResult(index, 'remarks', e.target.value)}
                    size="small"
                  />
                </Stack>
              </Paper>
            ))}

            <Divider />

            <TextField
              label="Overall Remarks"
              value={resultForm.overallRemarks}
              onChange={(e) => setResultForm({ ...resultForm, overallRemarks: e.target.value })}
              multiline
              minRows={2}
            />

            <TextField
              label="Summary Result"
              value={resultForm.summaryResult}
              onChange={(e) => setResultForm({ ...resultForm, summaryResult: e.target.value })}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveResult}>Save Results</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
