import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import api from '../../api/client';

export default function TaskAllocation() {
  const [taskType, setTaskType] = useState('Lab Test');
  const [description, setDescription] = useState('');
  const [relatedVisitId, setRelatedVisitId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadTasks();
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setVisitsLoading(true);
      const { data } = await api.get('/visits');
      const visitList = (data.visits || [])
        .map(v => ({
          ...v,
          visitId: v.opNumber,
          patient: v.patientId
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);
      setVisits(visitList);
    } catch (error) {
      console.error('Failed to load visits:', error);
    } finally {
      setVisitsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks');
      setTasks(data.tasks || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load tasks');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setMessage('Please enter a task description');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/tasks', {
        taskType,
        description,
        relatedVisitId: relatedVisitId?._id || null
      });

      setMessage(data.message || 'Task created and assigned successfully!');
      setMessageType('success');

      setTaskType('Lab Test');
      setDescription('');
      setRelatedVisitId(null);
      setOpenDialog(false);

      await loadTasks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create task');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#ff9800';
      case 'Pending - No Staff Available':
        return '#d32f2f';
      case 'In Progress':
        return '#2196f3';
      case 'Completed':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getTaskTypeColor = (type) => {
    return type === 'Lab Test' ? '#e3f2fd' : '#f3e5f5';
  };

  const getTaskTypeTextColor = (type) => {
    return type === 'Lab Test' ? '#1976d2' : '#7b1fa2';
  };

  return (
    <Box sx={{ p: 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
        <AssignmentIcon sx={{ fontSize: 32, color: '#1976d2' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Task Allocation System
        </Typography>
      </Stack>

      {message && (
        <Alert severity={messageType} onClose={() => setMessage('')} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1a237e' }}>
                <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Create New Task
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#424242' }}>
                    Task Type
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    size="small"
                    SelectProps={{
                      native: true
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <option value="Lab Test">Lab Test</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </TextField>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#424242' }}>
                    Task Description *
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task details..."
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#424242' }}>
                    Related Visit ID (Optional)
                  </Typography>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={visits}
                    value={relatedVisitId}
                    onChange={(event, newValue) => setRelatedVisitId(newValue)}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      const patientName = option.patient?.firstName && option.patient?.lastName 
                        ? `${option.patient.firstName} ${option.patient.lastName}` 
                        : 'Unknown';
                      return `${option.visitId} - ${patientName} (${new Date(option.createdAt).toLocaleDateString()})`;
                    }}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    loading={visitsLoading}
                    placeholder="Search and select visit..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search visit ID, patient name, or date..."
                      />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      if (!inputValue) return options;
                      const query = inputValue.toLowerCase();
                      return options.filter(option => {
                        const patientName = option.patient?.firstName && option.patient?.lastName 
                          ? `${option.patient.firstName} ${option.patient.lastName}`.toLowerCase()
                          : '';
                        return (
                          option.visitId?.toLowerCase().includes(query) ||
                          patientName.includes(query) ||
                          option.patient?.opNumber?.toLowerCase().includes(query) ||
                          new Date(option.createdAt).toLocaleDateString().includes(query)
                        );
                      });
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: '#fff',
                    fontWeight: 'bold',
                    py: 1.2,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '16px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                      boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)'
                    }
                  }}
                >
                  Create Task
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#1a237e', display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1 }} />
                All Tasks
              </Typography>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && tasks.length === 0 ? (
                <Typography sx={{ color: '#757575', textAlign: 'center', py: 3 }}>
                  No tasks created yet
                </Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>Task Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>Assigned Staff</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow
                          key={task._id}
                          sx={{
                            '&:hover': { backgroundColor: '#f9f9f9' },
                            borderBottom: '1px solid #e0e0e0'
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={task.taskType}
                              sx={{
                                backgroundColor: getTaskTypeColor(task.taskType),
                                color: getTaskTypeTextColor(task.taskType),
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#424242' }}>
                            {task.description}
                          </TableCell>
                          <TableCell sx={{ color: '#424242' }}>
                            {task.staffName}
                          </TableCell>
                          <TableCell sx={{ color: '#424242' }}>
                            {task.role}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={task.status}
                              sx={{
                                backgroundColor: getStatusColor(task.status),
                                color: '#fff',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Task Creation</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to create this task? It will be automatically assigned to an available staff member based on their shift schedule.
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            • Task Type: <strong>{taskType}</strong>
            <br />
            • Description: <strong>{description.substring(0, 50)}...</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
