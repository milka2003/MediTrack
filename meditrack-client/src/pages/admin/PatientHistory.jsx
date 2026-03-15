import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ScienceIcon from "@mui/icons-material/Science";
import MedicationIcon from "@mui/icons-material/Medication";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";

export default function PatientHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/patients/${id}/history`);
      setPatient(data.patient);
      setHistory(data.history || []);
    } catch (e) {
      console.error("Failed to load patient history", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const downloadReport = async (consultationId, itemIndex) => {
    try {
      const response = await api.get(`/lab/report/${consultationId}/${itemIndex}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab-report-${consultationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Failed to download report', e);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>;
  if (!patient) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>Patient not found.</Typography></Box>;

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/dashboard/patients")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0D47A1" }}>Patient History</Typography>
      </Stack>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3, bgcolor: "#f8f9fa", border: "1px solid #e3f2fd" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="textSecondary">NAME</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{patient.firstName} {patient.lastName}</Typography>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Typography variant="caption" color="textSecondary">OP NUMBER</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0D47A1" }}>{patient.opNumber}</Typography>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Typography variant="caption" color="textSecondary">AGE / GENDER</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{patient.age || "-"} / {patient.gender || "-"}</Typography>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Typography variant="caption" color="textSecondary">PHONE</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{patient.phone}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#455a64" }}>Visits & Consultations</Typography>

      {history.map((v) => (
        <Accordion key={v._id} sx={{ mb: 1, borderRadius: 1, "&:before": { display: "none" }, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <AccordionSummary expandMoreIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%", pr: 2 }}>
              <Box sx={{ width: 150 }}>
                <Typography sx={{ fontWeight: 700 }}>{new Date(v.appointmentDate).toLocaleDateString()}</Typography>
                <Typography variant="caption" color="textSecondary">Token: {v.tokenNumber}</Typography>
              </Box>
              <Chip label={v.status} size="small" color={v.status === "Completed" || v.status === "ConsultationCompleted" ? "success" : "default"} />
              <Typography variant="body2" sx={{ flex: 1 }}><strong>Doctor:</strong> {v.doctor?.name || "N/A"} ({v.department || "N/A"})</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {/* Vitals Section */}
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MonitorHeartIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Vitals</Typography>
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#f1f8ff", borderRadius: 1 }}>
                    {v.vitals ? (
                      <Grid container spacing={1}>
                        <Grid item xs={6}><Typography variant="caption" color="textSecondary">BP</Typography><Typography variant="body2">{v.vitals.bp || "-"}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="textSecondary">Temp</Typography><Typography variant="body2">{v.vitals.temperature || "-"}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="textSecondary">Oxygen</Typography><Typography variant="body2">{v.vitals.oxygen || "-"}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="textSecondary">Weight</Typography><Typography variant="body2">{v.vitals.weight || "-"}</Typography></Grid>
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="textSecondary">No vitals recorded.</Typography>
                    )}
                  </Paper>
                </Stack>
              </Grid>

              {/* Consultation Details */}
              <Grid item xs={12} md={8}>
                {v.consultation ? (
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <AssignmentIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Consultation Notes</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Chief Complaints:</strong> {v.consultation.chiefComplaints || "-"}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Diagnosis:</strong> {v.consultation.diagnosis || "-"}</Typography>
                      <Typography variant="body2"><strong>Treatment Plan:</strong> {v.consultation.treatmentPlan || "-"}</Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <MedicationIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Prescriptions</Typography>
                      </Stack>
                      {v.consultation.prescriptions?.length > 0 ? (
                        <List size="small" dense>
                          {v.consultation.prescriptions.map((p, idx) => (
                            <ListItem key={idx} sx={{ py: 0, px: 1 }}>
                              <ListItemText
                                primary={`${p.medicineName} - ${p.dosage} (${p.frequency})`}
                                secondary={`Duration: ${p.duration} | Qty: ${p.quantity} | ${p.instructions || ""}`}
                                primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
                                secondaryTypographyProps={{ fontSize: "0.75rem" }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">No prescriptions.</Typography>
                      )}
                    </Box>

                    <Divider />

                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <ScienceIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lab Requests & Reports</Typography>
                      </Stack>
                      {v.consultation.labRequests?.length > 0 ? (
                        <Stack spacing={1}>
                          {v.consultation.labRequests.map((lr, idx) => (
                            <Stack key={idx} direction="row" spacing={2} alignItems="center" sx={{ p: 1, border: "1px solid #eee", borderRadius: 1 }}>
                              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{lr.testName}</Typography>
                              <Chip label={lr.status} size="small" variant="outlined" color={lr.status === "Completed" ? "success" : "warning"} />
                              {lr.status === "Completed" && (
                                <Button size="small" variant="text" onClick={() => downloadReport(v.consultation._id, idx)}>
                                  Download Report
                                </Button>
                              )}
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="textSecondary">No lab requests.</Typography>
                      )}
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary">No consultation record found for this visit.</Typography>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {history.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
          <Typography color="textSecondary">No visits recorded for this patient.</Typography>
        </Paper>
      )}
    </Box>
  );
}
