import React, { useEffect, useState } from 'react';
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
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import api from '../../api/client';

export default function PharmacyTasks() {
  const [tasks, setTasks] = useState([]);
  const [staffId, setStaffId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const id = user._id || user.id;
    if (id) {
      setStaffId(id);
      loadTasks(id);
    }
  }, []);

  const loadTasks = async (id) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks/staff/${id}`);
      setTasks(data.tasks?.filter(t => t.taskType === 'Pharmacy') || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setMessage('Task status updated successfully');
      await loadTasks(staffId);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const getTaskCounts = () => {
    return {
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length
    };
  };

  const counts = getTaskCounts();

  return (
    <Box>
      {message && (
        <Typography sx={{ mb: 2, color: '#4caf50' }}>{message}</Typography>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Pending Tasks
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                {counts.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                {counts.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {counts.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Total Tasks
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                {tasks.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 1 }} />
          Allocated Pharmacy Tasks
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>OP Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                      <Typography color="textSecondary">
                        No allocated pharmacy tasks
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => {
                    const patientName = task.relatedVisitId?.patientId
                      ? `${task.relatedVisitId.patientId.firstName} ${task.relatedVisitId.patientId.lastName}`
                      : 'Unknown';
                    const opNumber = task.relatedVisitId?.patientId?.opNumber || '-';
                    
                    return (
                      <TableRow key={task._id} hover>
                        <TableCell sx={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                          {task.description}
                        </TableCell>
                        <TableCell>{patientName}</TableCell>
                        <TableCell>{opNumber}</TableCell>
                        <TableCell>
                          <Chip
                            label={task.status}
                            size="small"
                            color={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'warning' : 'default'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {task.status === 'Pending' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => updateTaskStatus(task._id, 'In Progress')}
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'In Progress' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => updateTaskStatus(task._id, 'Completed')}
                              >
                                Complete
                              </Button>
                            )}
                            {task.status === 'Completed' && (
                              <Chip label="Done" size="small" icon={<CheckCircleIcon />} color="success" />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
