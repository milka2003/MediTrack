import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Pagination,
  CircularProgress
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/patients?q=${search}&page=${page}`);
      setPatients(data.patients || []);
      setTotalPages(data.pages || 1);
    } catch (e) {
      console.error("Failed to load patients", e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: "#0D47A1" }}>Patient Management</Typography>
          <TextField
            size="small"
            placeholder="Search Name, OP Number, Phone"
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
            }}
            sx={{ minWidth: 300 }}
          />
          <Button startIcon={<RefreshIcon />} onClick={loadPatients} disabled={loading}>Refresh</Button>
        </Stack>
      </Paper>

      <Paper elevation={1} sx={{ p: 0, borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: "#f8f9fa" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>OP Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Age/Gender</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Registered On</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p._id} hover>
                  <TableCell sx={{ fontWeight: 600, color: "#0D47A1" }}>{p.opNumber}</TableCell>
                  <TableCell>{p.firstName} {p.lastName}</TableCell>
                  <TableCell>{p.age || "-"} / {p.gender || "-"}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View History">
                      <IconButton color="primary" onClick={() => navigate(`/dashboard/patient-history/${p._id}`)}>
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No patients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, v) => setPage(v)}
          color="primary"
        />
      </Box>
    </Box>
  );
}
