const ShiftTemplate = require('../models/ShiftTemplate');
const StaffShiftMapping = require('../models/StaffShiftMapping');

const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const isTimeInRange = (currentTime, startTime, endTime) => {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
};

const getActiveShiftTemplate = async (currentDateTime = null) => {
  const now = currentDateTime || new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  const templates = await ShiftTemplate.find({ isActive: true });

  for (const template of templates) {
    if (isTimeInRange(currentTime, template.startTime, template.endTime)) {
      return template;
    }
  }

  return null;
};

const getStaffOnActiveShift = async (requiredRole, currentDateTime = null) => {
  const activeShift = await getActiveShiftTemplate(currentDateTime);

  if (!activeShift) {
    return [];
  }

  const acceptedRoles = [requiredRole];
  if (requiredRole === 'Lab Technician') {
    acceptedRoles.push('Lab');
  }

  const now = currentDateTime || new Date();

  const staffMappings = await StaffShiftMapping.find({
    shiftTemplateId: activeShift._id,
    role: { $in: acceptedRoles },
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: now } }
    ]
  }).populate('staffId', 'name email');

  return staffMappings;
};

const getStaffWithLeastActiveTasks = async (staffMappings, Task) => {
  if (staffMappings.length === 0) {
    return null;
  }

  let staffWithLeastTasks = staffMappings[0];
  let minActiveTasksCount = await Task.countDocuments({
    assignedTo: staffMappings[0].staffId,
    status: { $ne: 'Completed' }
  });

  for (let i = 1; i < staffMappings.length; i++) {
    const activeTasksCount = await Task.countDocuments({
      assignedTo: staffMappings[i].staffId,
      status: { $ne: 'Completed' }
    });

    if (activeTasksCount < minActiveTasksCount) {
      minActiveTasksCount = activeTasksCount;
      staffWithLeastTasks = staffMappings[i];
    }
  }

  return staffWithLeastTasks;
};

module.exports = {
  getActiveShiftTemplate,
  getStaffOnActiveShift,
  getStaffWithLeastActiveTasks,
  timeToMinutes,
  isTimeInRange
};
