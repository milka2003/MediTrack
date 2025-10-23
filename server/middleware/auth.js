const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function authAny(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = h.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.auth = payload; // { kind: 'staff'|'patient', id, role? }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function requireStaff(roles = []) {
  return (req, res, next) => {
    if (!req.auth || req.auth.kind !== 'staff') return res.status(403).json({ message: 'Forbidden' });
    if (roles.length && !roles.includes(req.auth.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { authAny, requireStaff };
