const express = require('express');
const { authAny, requireStaff } = require('../middleware/auth');
const Task = require('../models/Task');
const Shift = require('../models/Shift');
const { getStaffOnActiveShift, getStaffWithLeastActiveTasks } = require('../utils/shiftResolver');

const router = express.Router();

const getTodayDate = () => {
  const today = new Date();
  return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
};

const getRequiredRole = (taskType) => {
  if (taskType === 'Lab Test') return 'Lab Technician';
  if (taskType === 'Pharmacy') return 'Pharmacist';
  return null;
};

const assignTaskToAvailableStaff = async (taskType) => {
  const requiredRole = getRequiredRole(taskType);
  if (!requiredRole) {
    throw new Error('Invalid task type');
  }

  const staffMappings = await getStaffOnActiveShift(requiredRole);

  if (staffMappings.length === 0) {
    return null;
  }

  const selectedStaff = await getStaffWithLeastActiveTasks(staffMappings, Task);

  if (!selectedStaff) {
    return null;
  }

  return {
    staffId: selectedStaff.staffId._id.toString(),
    staffName: selectedStaff.staffName,
    role: requiredRole
  };
};

router.post('/', authAny, requireStaff(['Doctor', 'Admin']), async (req, res) => {
  try {
    const { taskType, description, relatedVisitId } = req.body;

    if (!taskType || !description) {
      return res.status(400).json({ message: 'Task type and description are required' });
    }

    const staffAssignment = await assignTaskToAvailableStaff(taskType);

    const task = new Task({
      taskType,
      description,
      assignedTo: staffAssignment ? staffAssignment.staffId : null,
      staffName: staffAssignment ? staffAssignment.staffName : 'Unassigned',
      role: staffAssignment ? staffAssignment.role : getRequiredRole(taskType),
      relatedVisitId: relatedVisitId || null,
      status: staffAssignment ? 'Pending' : 'Pending - No Staff Available'
    });

    await task.save();

    res.status(201).json({
      message: staffAssignment ? 'Task created and assigned successfully' : 'Task created but no staff available for assignment',
      task
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', authAny, requireStaff(['Doctor', 'Admin', 'Lab', 'Lab Technician', 'Pharmacist']), async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/staff/:staffId', authAny, requireStaff(['Lab', 'Lab Technician', 'Pharmacist', 'Admin']), async (req, res) => {
  try {
    const { staffId } = req.params;
    const tasks = await Task.find({ assignedTo: staffId })
      .populate({
        path: 'relatedVisitId',
        select: 'opNumber patientId',
        populate: {
          path: 'patientId',
          select: 'firstName lastName opNumber'
        }
      })
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authAny, requireStaff(['Lab', 'Lab Technician', 'Pharmacist', 'Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed', 'Pending - No Staff Available'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
