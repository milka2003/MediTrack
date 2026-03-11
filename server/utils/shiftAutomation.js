const StaffShiftMapping = require('../models/StaffShiftMapping');
const ShiftTemplate = require('../models/ShiftTemplate');
const DoctorAvailability = require('../models/DoctorAvailability');
const User = require('../models/User');
const { getActiveShiftTemplate } = require('./shiftResolver');

/**
 * Automates shift rotations based on rotationType
 */
const rotateShifts = async () => {
  const now = new Date();
  const mappings = await StaffShiftMapping.find({ 
    isActive: true, 
    rotationType: { $ne: 'None' } 
  }).populate('shiftTemplateId');

  for (const mapping of mappings) {
    let shouldRotate = false;
    const lastRotated = mapping.lastRotated || mapping.effectiveFrom;
    const daysSinceRotation = (now - lastRotated) / (1000 * 60 * 60 * 24);

    if (mapping.rotationType === 'Weekly' && daysSinceRotation >= 7) shouldRotate = true;
    else if (mapping.rotationType === 'Bi-weekly' && daysSinceRotation >= 14) shouldRotate = true;
    else if (mapping.rotationType === 'Monthly' && daysSinceRotation >= 30) shouldRotate = true;

    if (shouldRotate && mapping.shiftTemplateId.nextTemplateId) {
      mapping.shiftTemplateId = mapping.shiftTemplateId.nextTemplateId;
      mapping.lastRotated = now;
      mapping.updatedAt = now;
      await mapping.save();
      console.log(`Rotated shift for ${mapping.staffName} to next template.`);
    }
  }
};

/**
 * Updates Doctor availability status based on current active shifts
 */
const updateStaffAvailability = async () => {
  const activeTemplate = await getActiveShiftTemplate();
  if (!activeTemplate) return;

  const staffOnShift = await StaffShiftMapping.find({
    shiftTemplateId: activeTemplate._id,
    isActive: true
  }).select('staffId role');

  const doctorIdsOnShift = staffOnShift
    .filter(m => m.role === 'Doctor')
    .map(m => m.staffId);

  // Mark doctors on shift as Available (if not Busy)
  for (const doctorId of doctorIdsOnShift) {
    const availability = await DoctorAvailability.findOne({ doctorId });
    if (availability && availability.availabilityStatus === 'Off-duty') {
      availability.availabilityStatus = 'Available';
      await availability.save();
    } else if (!availability) {
      await DoctorAvailability.create({
        doctorId,
        availabilityStatus: 'Available'
      });
    }
  }

  // Mark doctors NOT on shift as Off-duty
  const allDoctors = await User.find({ role: 'Doctor' }).select('_id');
  const doctorIdsNotOnShift = allDoctors
    .map(d => d._id)
    .filter(id => !doctorIdsOnShift.some(sid => sid.equals(id)));

  for (const doctorId of doctorIdsNotOnShift) {
    const availability = await DoctorAvailability.findOne({ doctorId });
    if (availability && availability.availabilityStatus !== 'Off-duty') {
      availability.availabilityStatus = 'Off-duty';
      await availability.save();
    }
  }
};

/**
 * Automatically assigns a shift to a new staff member
 */
const autoAssignShift = async (user) => {
  const { _id: staffId, name: staffName, role } = user;
  
  // Find templates for this role (assuming all templates can apply)
  const templates = await ShiftTemplate.find({ isActive: true });
  if (templates.length === 0) return null;

  // Find which template has the least staff of this role
  let bestTemplate = templates[0];
  let minStaffCount = await StaffShiftMapping.countDocuments({
    shiftTemplateId: templates[0]._id,
    role,
    isActive: true
  });

  for (let i = 1; i < templates.length; i++) {
    const count = await StaffShiftMapping.countDocuments({
      shiftTemplateId: templates[i]._id,
      role,
      isActive: true
    });
    if (count < minStaffCount) {
      minStaffCount = count;
      bestTemplate = templates[i];
    }
  }

  const mapping = new StaffShiftMapping({
    staffId,
    staffName,
    role,
    shiftTemplateId: bestTemplate._id,
    effectiveFrom: new Date(),
    rotationType: 'Weekly' // Default to weekly rotation for automation
  });

  await mapping.save();
  return mapping;
};

module.exports = {
  rotateShifts,
  updateStaffAvailability,
  autoAssignShift
};
