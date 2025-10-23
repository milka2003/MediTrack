const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function signStaffToken(user) {
  return jwt.sign(
    { kind: 'staff', id: user._id.toString(), role: user.role },
    SECRET,
    { expiresIn: '8h' }
  );
}

function signPatientToken(patient) {
  return jwt.sign(
    { kind: 'patient', id: patient._id.toString() },
    SECRET,
    { expiresIn: '8h' }
  );
}

module.exports = { signStaffToken, signPatientToken };
