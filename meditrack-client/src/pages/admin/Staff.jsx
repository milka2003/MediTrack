// src/pages/admin/Staff.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import api from "../../api/client";

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snack, setSnack] = useState({ open: false, error: false, text: "" });

  const [roleFilter, setRoleFilter] = useState("");
  const [query, setQuery] = useState("");

  const [resetDialog, setResetDialog] = useState({ open: false, user: null, temp: "" });

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/staff" + (roleFilter ? `?role=${encodeURIComponent(roleFilter)}` : ""));
      setUsers(data.users || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const resetPassword = async (user) => {
    try {
      const { data } = await api.post(`/admin/staff/${user._id}/reset-password`);
      setResetDialog({ open: true, user, temp: data.tempPassword || "" });
      setSnack({ open: true, error: false, text: "Temporary password generated" });
      // Refresh list to reflect any status/firstLogin changes
      load();
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to reset password";
      setSnack({ open: true, error: true, text: msg });
    }
  };

  const copyTemp = async () => {
    try {
      await navigator.clipboard.writeText(resetDialog.temp);
      setSnack({ open: true, error: false, text: "Copied to clipboard" });
    } catch {
      setSnack({ open: true, error: true, text: "Copy failed" });
    }
  };

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: "#0D47A1" }}>Staff</Typography>
          <TextField
            size="small"
            label="Search"
            placeholder="Search name, username, email, role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <TextField select size="small" label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Reception">Reception</MenuItem>
            <MenuItem value="Doctor">Doctor</MenuItem>
            <MenuItem value="Nurse">Nurse</MenuItem>
            <MenuItem value="Lab">Lab</MenuItem>
            <MenuItem value="Pharmacist">Pharmacist</MenuItem>
            <MenuItem value="Billing">Billing</MenuItem>
          </TextField>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>Refresh</Button>
        </Stack>
      </Paper>

      {message && (
        <Typography color="error" sx={{ mb: 2 }}>{message}</Typography>
      )}

      <Paper elevation={1} sx={{ p: 0, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u._id} hover>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email || "—"}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={u.status || 'active'} color={u.status === 'active' ? 'success' : 'default'} />
                    {u.firstLogin ? <Chip size="small" label="first login" /> : null}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Reset Password">
                    <span>
                      <IconButton color="primary" onClick={() => resetPassword(u)} disabled={loading}>
                        <LockResetIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">No staff found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.error ? 'error' : 'success'} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.text}
        </Alert>
      </Snackbar>

      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, user: null, temp: '' })} fullWidth maxWidth="xs">
        <DialogTitle>Temporary Password</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>Share this temporary password securely with the staff:</Typography>
          <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{resetDialog.temp || '—'}</Typography>
            <IconButton onClick={copyTemp}><ContentCopyIcon /></IconButton>
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They will be forced to change password on next login.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog({ open: false, user: null, temp: '' })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}