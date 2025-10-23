// utils/counters.js
const Counter = require('../models/Counter');

async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc.seq;
}

module.exports = { nextSeq };
