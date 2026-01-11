// src/pages/admin/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  MenuItem,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

import api from "../../api/client";

const PIE_COLORS = ["#0D47A1", "#1976D2", "#2196F3", "#64B5F6", "#90CAF9", "#BBDEFB"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const defaultReportsState = {
  patients: null,
  appointments: null,
  billing: null,
  lab: null,
  pharmacy: null,
};

function Reports() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    doctorId: "",
    departmentId: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [reports, setReports] = useState(defaultReportsState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [doctorPerformanceLoading, setDoctorPerformanceLoading] = useState(false);
  const [doctorPerformanceData, setDoctorPerformanceData] = useState(null);
  const [selectedDoctorForComparison, setSelectedDoctorForComparison] = useState(null);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setReferenceLoading(true);
        const [doctorsRes, departmentsRes] = await Promise.all([
          api.get("/admin/doctors"),
          api.get("/admin/departments", { params: { includeInactive: true } }),
        ]);

        const doctorOptions = (doctorsRes.data?.doctors || []).map((doctor) => ({
          id: doctor._id,
          name: doctor.user?.name || "Unnamed Doctor",
        }));
        const departmentOptions = (departmentsRes.data?.departments || []).map((dept) => ({
          id: dept._id,
          name: dept.name,
        }));

        setDoctors(doctorOptions);
        setDepartments(departmentOptions);
      } catch (referenceError) {
        console.error("Failed to load reference data", referenceError);
      } finally {
        setReferenceLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");

        const baseParams = {};
        if (appliedFilters.startDate) baseParams.startDate = appliedFilters.startDate;
        if (appliedFilters.endDate) baseParams.endDate = appliedFilters.endDate;

        const patientParams = { ...baseParams };
        const appointmentParams = {
          ...baseParams,
          ...(appliedFilters.doctorId ? { doctorId: appliedFilters.doctorId } : {}),
          ...(appliedFilters.departmentId ? { departmentId: appliedFilters.departmentId } : {}),
        };
        const billingParams = {
          ...baseParams,
          ...(appliedFilters.departmentId ? { departmentId: appliedFilters.departmentId } : {}),
        };
        const labParams = {
          ...baseParams,
          ...(appliedFilters.departmentId ? { departmentId: appliedFilters.departmentId } : {}),
        };
        const pharmacyParams = {
          ...baseParams,
          ...(appliedFilters.doctorId ? { doctorId: appliedFilters.doctorId } : {}),
        };

        const [patientsRes, appointmentsRes, billingRes, labRes, pharmacyRes] = await Promise.all([
          api.get("/reports/patients", { params: patientParams }),
          api.get("/reports/appointments", { params: appointmentParams }),
          api.get("/reports/billing", { params: billingParams }),
          api.get("/reports/lab", { params: labParams }),
          api.get("/reports/pharmacy", { params: pharmacyParams }),
        ]);

        setReports({
          patients: patientsRes.data || null,
          appointments: appointmentsRes.data || null,
          billing: billingRes.data || null,
          lab: labRes.data || null,
          pharmacy: pharmacyRes.data || null,
        });
      } catch (fetchError) {
        console.error("Failed to load reports", fetchError);
        setError(fetchError.response?.data?.message || "Failed to load reports");
        setReports(defaultReportsState);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [appliedFilters]);



  // Fetch and train doctor performance KNN model
  useEffect(() => {
    const fetchDoctorPerformance = async () => {
      try {
        setDoctorPerformanceLoading(true);
        // Train the model first
        await api.post("/ml/doctor-performance/train");
        // Then get rankings
        const { data } = await api.get("/ml/doctor-performance/ranking");
        setDoctorPerformanceData(data.data);
      } catch (dpError) {
        console.error("Failed to load doctor performance", dpError);
        // Don't set error, just leave data null
      } finally {
        setDoctorPerformanceLoading(false);
      }
    };

    fetchDoctorPerformance();
  }, []);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const reset = {
      startDate: "",
      endDate: "",
      doctorId: "",
      departmentId: "",
    };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  const filterSummary = useMemo(() => {
    const summaryParts = [];
    if (appliedFilters.startDate) summaryParts.push(`Start: ${appliedFilters.startDate}`);
    if (appliedFilters.endDate) summaryParts.push(`End: ${appliedFilters.endDate}`);
    if (appliedFilters.doctorId) {
      const doctorName = doctors.find((doc) => doc.id === appliedFilters.doctorId)?.name;
      summaryParts.push(`Doctor: ${doctorName || appliedFilters.doctorId}`);
    }
    if (appliedFilters.departmentId) {
      const departmentName = departments.find((dept) => dept.id === appliedFilters.departmentId)?.name;
      summaryParts.push(`Department: ${departmentName || appliedFilters.departmentId}`);
    }

    return summaryParts.length ? summaryParts.join(" • ") : "All records";
  }, [appliedFilters, doctors, departments]);

  const hasReportData = useMemo(() => {
    const { patients, appointments, billing, lab, pharmacy } = reports;
    return Boolean(
      patients ||
      appointments ||
      billing ||
      lab ||
      pharmacy
    );
  }, [reports]);

  const patientDemographicsData = useMemo(
    () => (reports.patients?.demographics || []).map((item) => ({
      name: item.gender || "Unknown",
      value: item.count || 0,
      averageAge: item.averageAge || 0,
    })),
    [reports.patients]
  );

  const appointmentTrendData = useMemo(
    () => (reports.appointments?.appointmentsByDate || []).map((entry) => ({
      date: entry.date,
      count: entry.total,
    })),
    [reports.appointments]
  );

  const appointmentByDepartmentData = useMemo(
    () => (reports.appointments?.appointmentsByDepartment || []).map((entry) => ({
      department: entry.departmentName || "Unknown",
      total: entry.total || 0,
    })),
    [reports.appointments]
  );

  const billingByDepartmentData = useMemo(
    () => (reports.billing?.byDepartment || []).map((entry) => ({
      id: entry.departmentId || "unknown",
      department: entry.departmentName || "Unknown",
      totalBilled: entry.totalBilled || 0,
      totalRevenue: entry.totalRevenue || 0,
      unpaid: entry.unpaid || 0,
    })),
    [reports.billing]
  );

  const exportRows = useMemo(() => {
    const rows = [["Section", "Metric", "Value"]];

    if (reports.patients) {
      rows.push(["Patients", "Total Patients", numberFormatter.format(reports.patients.totalPatients || 0)]);
      rows.push(["Patients", "New Patients", numberFormatter.format(reports.patients.newPatients || 0)]);
      (reports.patients.demographics || []).forEach((item) => {
        rows.push([
          "Patient Demographics",
          item.gender || "Unknown",
          `${numberFormatter.format(item.count || 0)} (Avg Age: ${item.averageAge || 0})`,
        ]);
      });
    }

    if (reports.appointments) {
      (reports.appointments.appointmentsByDoctor || []).forEach((item) => {
        rows.push([
          "Appointments by Doctor",
          item.doctorName || "Unknown",
          numberFormatter.format(item.total || 0),
        ]);
      });

      (reports.appointments.appointmentsByDepartment || []).forEach((item) => {
        rows.push([
          "Appointments by Department",
          item.departmentName || "Unknown",
          numberFormatter.format(item.total || 0),
        ]);
      });
    }

    if (reports.billing) {
      rows.push(["Billing", "Total Billed", currencyFormatter.format(reports.billing.totalBilled || 0)]);
      rows.push(["Billing", "Total Revenue", currencyFormatter.format(reports.billing.totalRevenue || 0)]);
      rows.push(["Billing", "Unpaid Amount", currencyFormatter.format(reports.billing.unpaidAmount || 0)]);
      billingByDepartmentData.forEach((item) => {
        rows.push([
          "Billing by Department",
          item.department,
          `Billed: ${currencyFormatter.format(item.totalBilled || 0)} | Revenue: ${currencyFormatter.format(
            item.totalRevenue || 0
          )} | Unpaid: ${currencyFormatter.format(item.unpaid || 0)}`,
        ]);
      });
    }

    if (reports.lab) {
      rows.push(["Lab", "Total Tests", numberFormatter.format(reports.lab.totalTests || 0)]);
      (reports.lab.topTests || []).forEach((item) => {
        rows.push(["Top Lab Tests", item._id || "Unknown", numberFormatter.format(item.count || 0)]);
      });
    }

    if (reports.pharmacy) {
      rows.push([
        "Pharmacy",
        "Total Quantity Sold",
        numberFormatter.format(reports.pharmacy.totalSales?.totalQuantitySold || 0),
      ]);
      rows.push([
        "Pharmacy",
        "Total Sales Value",
        currencyFormatter.format(reports.pharmacy.totalSales?.totalSoldValue || 0),
      ]);
      (reports.pharmacy.topMedicines || []).forEach((item) => {
        rows.push([
          "Top Medicines",
          item.name || "Unknown",
          `${numberFormatter.format(item.totalQuantitySold || 0)} units | ${currencyFormatter.format(
            item.totalSalesValue || 0
          )}`,
        ]);
      });
    }

    return rows;
  }, [reports, billingByDepartmentData]);

  const handleExportCSV = () => {
    if (!hasReportData) return;

    const csvContent = exportRows
      .map((row) =>
        row
          .map((value) => {
            const stringValue = String(value ?? "");
            if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `admin-reports-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPDF = () => {
    if (!hasReportData) return;

    const doc = new jsPDF();
    const generatedAt = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text("MediTrack Admin Reports", 14, 16);
    doc.setFontSize(11);
    doc.text(`Generated: ${generatedAt}`, 14, 24);
    doc.text(`Filters: ${filterSummary}`, 14, 32);

    const addTable = (title, head, body, startY) => {
      if (!body || !body.length) return startY;
      doc.setFontSize(13);
      doc.text(title, 14, startY);
      doc.autoTable({
        startY: startY + 4,
        head: [head],
        body,
        styles: { fontSize: 10 },
        theme: "grid",
        headStyles: { fillColor: [13, 71, 161] },
      });
      return doc.lastAutoTable.finalY + 8;
    };

    let currentY = 40;

    currentY = addTable(
      "Summary",
      ["Metric", "Value"],
      [
        [
          "Total Patients",
          numberFormatter.format(reports.patients?.totalPatients || 0),
        ],
        [
          "New Patients",
          numberFormatter.format(reports.patients?.newPatients || 0),
        ],
        ["Total Billed", currencyFormatter.format(reports.billing?.totalBilled || 0)],
        ["Total Revenue", currencyFormatter.format(reports.billing?.totalRevenue || 0)],
        ["Unpaid Amount", currencyFormatter.format(reports.billing?.unpaidAmount || 0)],
        ["Lab Tests", numberFormatter.format(reports.lab?.totalTests || 0)],
        [
          "Pharmacy Sales",
          currencyFormatter.format(reports.pharmacy?.totalSales?.totalSoldValue || 0),
        ],
      ],
      currentY
    );

    currentY = addTable(
      "Patient Demographics",
      ["Gender", "Count", "Avg Age"],
      (reports.patients?.demographics || []).map((item) => [
        item.gender || "Unknown",
        numberFormatter.format(item.count || 0),
        item.averageAge || 0,
      ]),
      currentY
    );

    currentY = addTable(
      "Appointments by Doctor",
      ["Doctor", "Appointments"],
      (reports.appointments?.appointmentsByDoctor || []).map((item) => [
        item.doctorName || "Unknown",
        numberFormatter.format(item.total || 0),
      ]),
      currentY
    );

    currentY = addTable(
      "Appointments by Department",
      ["Department", "Appointments"],
      appointmentByDepartmentData.map((item) => [
        item.department,
        numberFormatter.format(item.total || 0),
      ]),
      currentY
    );

    currentY = addTable(
      "Billing by Department",
      ["Department", "Total Billed", "Revenue", "Unpaid"],
      billingByDepartmentData.map((item) => [
        item.department,
        currencyFormatter.format(item.totalBilled || 0),
        currencyFormatter.format(item.totalRevenue || 0),
        currencyFormatter.format(item.unpaid || 0),
      ]),
      currentY
    );

    currentY = addTable(
      "Top Lab Tests",
      ["Test", "Orders"],
      (reports.lab?.topTests || []).map((item) => [
        item._id || "Unknown",
        numberFormatter.format(item.count || 0),
      ]),
      currentY
    );

    addTable(
      "Top Medicines",
      ["Medicine", "Quantity", "Sales"],
      (reports.pharmacy?.topMedicines || []).map((item) => [
        item.name || "Unknown",
        numberFormatter.format(item.totalQuantitySold || 0),
        currencyFormatter.format(item.totalSalesValue || 0),
      ]),
      currentY
    );

    doc.save(`admin-reports-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading && !hasReportData) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#0D47A1" }}>
            Admin Reports & Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Track key operational metrics across patients, appointments, billing, lab, and pharmacy.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetFilters}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            disabled={!hasReportData}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            disabled={!hasReportData}
            sx={{ bgcolor: "#0D47A1", ":hover": { bgcolor: "#0B3C91" } }}
          >
            Export PDF
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange("startDate")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange("endDate")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Doctor"
              select
              value={filters.doctorId}
              onChange={handleFilterChange("doctorId")}
              fullWidth
              disabled={referenceLoading || !doctors.length}
            >
              <MenuItem value="">All Doctors</MenuItem>
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Department"
              select
              value={filters.departmentId}
              onChange={handleFilterChange("departmentId")}
              fullWidth
              disabled={referenceLoading || !departments.length}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleApplyFilters} disabled={loading}>
            Apply Filters
          </Button>
          <Chip label={`Current: ${filterSummary}`} color="primary" variant="outlined" sx={{ fontWeight: 500 }} />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, color: "text.secondary" }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Refreshing analytics…</Typography>
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "#E3F2FD" }}>
            <Typography variant="body2" sx={{ color: "#0D47A1", fontWeight: 600 }}>
              Total Patients
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
              {numberFormatter.format(reports.patients?.totalPatients || 0)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              New in range: {numberFormatter.format(reports.patients?.newPatients || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "#E8F5E9" }}>
            <Typography variant="body2" sx={{ color: "#1B5E20", fontWeight: 600 }}>
              Total Appointments (Range)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
              {numberFormatter.format((reports.appointments?.appointmentsByDate || []).reduce((sum, item) => sum + (item.total || 0), 0))}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Top Doctor: {reports.appointments?.appointmentsByDoctor?.[0]?.doctorName || "—"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "#FFF3E0" }}>
            <Typography variant="body2" sx={{ color: "#EF6C00", fontWeight: 600 }}>
              Revenue (Received)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
              {currencyFormatter.format(reports.billing?.totalRevenue || 0)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Unpaid: {currencyFormatter.format(reports.billing?.unpaidAmount || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "#F3E5F5" }}>
            <Typography variant="body2" sx={{ color: "#6A1B9A", fontWeight: 600 }}>
              Lab Tests & Pharmacy
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
              {numberFormatter.format(reports.lab?.totalTests || 0)} tests | {currencyFormatter.format(
                reports.pharmacy?.totalSales?.totalSoldValue || 0
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Top Medicine: {reports.pharmacy?.topMedicines?.[0]?.name || "—"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Patient Demographics
            </Typography>
            {patientDemographicsData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={patientDemographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {patientDemographicsData.map((entry, index) => (
                      <Cell key={`slice-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name, props) => [`${value}`, props.payload.name]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No demographic data available for the selected range.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Appointment Volume Trend
            </Typography>
            {appointmentTrendData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={appointmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#1976D2" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No appointment data found for the selected filters.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Appointments by Department
            </Typography>
            {appointmentByDepartmentData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={appointmentByDepartmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" interval={0} angle={-15} textAnchor="end" height={80} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="total" fill="#0D47A1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Department breakdown not available for the selected filters.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Billing by Department
            </Typography>
            {billingByDepartmentData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={billingByDepartmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" interval={0} angle={-15} textAnchor="end" height={80} />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => currencyFormatter.format(value)} />
                  <Legend />
                  <Bar dataKey="totalBilled" name="Total Billed" fill="#1976D2" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="totalRevenue" name="Revenue" fill="#43A047" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="unpaid" name="Unpaid" fill="#E53935" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Billing breakdown not available for the selected filters.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Appointments by Doctor
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Doctor</TableCell>
                    <TableCell align="right">Appointments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reports.appointments?.appointmentsByDoctor || []).length ? (
                    reports.appointments.appointmentsByDoctor.map((item) => (
                      <TableRow key={item.doctorId || item.doctorName}>
                        <TableCell>{item.doctorName || "Unknown"}</TableCell>
                        <TableCell align="right">{numberFormatter.format(item.total || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Billing – Outstanding Bills (Top 50)
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reports.billing?.unpaidBills || []).length ? (
                    reports.billing.unpaidBills.map((bill) => (
                      <TableRow key={bill.billId}>
                        <TableCell>
                          {bill.patient?.name?.trim() || "Unknown"}
                          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                            {bill.patient?.gender || ""} {bill.patient?.age ? `• ${bill.patient.age} yrs` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell>{bill.department || "—"}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(bill.totalAmount || 0)}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(bill.paidAmount || 0)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={currencyFormatter.format(bill.balance || 0)}
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No outstanding bills found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top Lab Tests
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Test</TableCell>
                    <TableCell align="right">Orders</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reports.lab?.topTests || []).length ? (
                    reports.lab.topTests.map((test) => (
                      <TableRow key={test._id}>
                        <TableCell>{test._id || "Unknown"}</TableCell>
                        <TableCell align="right">{numberFormatter.format(test.count || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No lab analytics available for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top Medicines
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell align="right">Quantity Sold</TableCell>
                    <TableCell align="right">Sales Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reports.pharmacy?.topMedicines || []).length ? (
                    reports.pharmacy.topMedicines.map((medicine) => (
                      <TableRow key={medicine._id || medicine.name}>
                        <TableCell>{medicine.name || "Unknown"}</TableCell>
                        <TableCell align="right">{numberFormatter.format(medicine.totalQuantitySold || 0)}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(medicine.totalSalesValue || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No pharmacy analytics available for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Doctor Performance KNN Section */}
        {doctorPerformanceData && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, mt: 2 }}>
                👨‍⚕️ Doctor Performance Analytics (KNN Model)
              </Typography>
            </Grid>

            {/* Performance Rankings Table */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Performance Rankings
                  </Typography>
                  {doctorPerformanceLoading && <CircularProgress size={24} />}
                </Stack>
                
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Doctor Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Overall Score</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Visits</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Unique Patients</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Completion Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {doctorPerformanceData.rankings?.map((doctor, index) => {
                        const gradeColor = 
                          doctor.performanceGrade.includes('A') ? '#4caf50' :
                          doctor.performanceGrade.includes('B') ? '#2196f3' :
                          doctor.performanceGrade.includes('C') ? '#ff9800' :
                          doctor.performanceGrade.includes('D') ? '#ff6f00' :
                          '#f44336';

                        return (
                          <TableRow key={doctor.doctorId} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{index + 1}</TableCell>
                            <TableCell>{doctor.doctorName}</TableCell>
                            <TableCell>{doctor.department}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${doctor.overallScore}/100`}
                                sx={{
                                  backgroundColor: gradeColor,
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.9rem'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={doctor.performanceGrade}
                                variant="outlined"
                                sx={{ borderColor: gradeColor, color: gradeColor, fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="right">{doctor.metrics.totalVisits}</TableCell>
                            <TableCell align="right">{doctor.metrics.uniquePatients}</TableCell>
                            <TableCell align="right">
                              {(doctor.metrics.visitCompletionRate * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Performance Distribution Charts */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Total Visits Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={doctorPerformanceData.rankings?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="doctorName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="metrics.totalVisits" fill="#1976d2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Performance Score Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'A - Excellent', value: doctorPerformanceData.rankings?.filter(d => d.performanceGrade.includes('A')).length || 0, fill: '#4caf50' },
                        { name: 'B - Good', value: doctorPerformanceData.rankings?.filter(d => d.performanceGrade.includes('B')).length || 0, fill: '#2196f3' },
                        { name: 'C - Average', value: doctorPerformanceData.rankings?.filter(d => d.performanceGrade.includes('C')).length || 0, fill: '#ff9800' },
                        { name: 'D - Below Avg', value: doctorPerformanceData.rankings?.filter(d => d.performanceGrade.includes('D')).length || 0, fill: '#ff6f00' },
                        { name: 'F - Needs Improvement', value: doctorPerformanceData.rankings?.filter(d => d.performanceGrade.includes('F')).length || 0, fill: '#f44336' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3, 4].map((index, key) => (
                        <Cell 
                          key={`cell-${key}`}
                          fill={['#4caf50', '#2196f3', '#ff9800', '#ff6f00', '#f44336'][index]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* KNN Model Info */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  🤖 K-Nearest Neighbors (KNN) Analysis
                </Typography>
                <Typography variant="body2">
                  This analysis uses KNN machine learning to cluster and rank doctors based on 6 performance metrics:
                  <strong> Total Visits, Unique Patients, Consultation Fee, Visit Completion Rate, Prescription Frequency, and Repeat Patient %</strong>.
                  The overall score (0-100) is calculated with weighted factors: Visits (30%), Patients (25%), Completion (25%), Prescriptions (20%).
                </Typography>
              </Alert>
            </Grid>
          </>
        )}
        
        {doctorPerformanceLoading && !doctorPerformanceData && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Reports;