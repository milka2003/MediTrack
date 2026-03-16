const express = require("express");
const mongoose = require("mongoose");
const { authAny, requireStaff } = require("../middleware/auth");
const Department = require("../models/Department");
const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const Bill = require("../models/Bill");
const Doctor = require("../models/Doctor");
const LabTest = require("../models/LabTest");
const Medicine = require("../models/Medicine");
const Consultation = require("../models/Consultation");

const router = express.Router();

/**
 * Utility to build date filters for createdAt / appointmentDate etc.
 */
function buildDateMatch(startDate, endDate, field = "createdAt") {
  const match = {};
  if (startDate) {
    match[field] = match[field] || {};
    match[field].$gte = new Date(startDate);
  }
  if (endDate) {
    match[field] = match[field] || {};
    match[field].$lte = new Date(endDate);
  }
  return match;
}

/**
 * Helper to safely parse ObjectId filters.
 */
function parseObjectId(id) {
  if (!id) return null;
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

// GET /api/reports/patients
router.get(
  "/patients",
  authAny,
  requireStaff(["Admin"]),
  async (req, res) => {
    try {
      const { startDate, endDate, departmentId } = req.query;
      const dateMatch = buildDateMatch(startDate, endDate, "createdAt");
      const patientMatch = { ...dateMatch };

      const departmentObjectId = parseObjectId(departmentId);
      if (departmentObjectId) {
        const doctorIds = await Doctor.find({ department: departmentObjectId })
          .distinct("_id")
          .lean();

        if (!doctorIds.length) {
          return res.json({
            totalPatients: 0,
            newPatients: 0,
            demographics: [],
          });
        }

        const visitPatientIds = await Visit.distinct("patientId", {
          doctorId: { $in: doctorIds },
          ...(startDate || endDate
            ? {
                appointmentDate: {
                  ...(startDate ? { $gte: new Date(startDate) } : {}),
                  ...(endDate ? { $lte: new Date(endDate) } : {}),
                },
              }
            : {}),
        });

        if (!visitPatientIds.length) {
          return res.json({
            totalPatients: 0,
            newPatients: 0,
            demographics: [],
          });
        }

        patientMatch._id = { $in: visitPatientIds };
      }

      const [totalPatients, newPatients] = await Promise.all([
        Patient.countDocuments({}),
        Patient.countDocuments(patientMatch),
      ]);

      const demographics = await Patient.aggregate([
        { $match: patientMatch },
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 },
            averageAge: { $avg: "$age" },
          },
        },
        {
          $project: {
            gender: "$_id",
            count: 1,
            averageAge: { $round: ["$averageAge", 1] },
            _id: 0,
          },
        },
      ]);

      res.json({
        totalPatients,
        newPatients,
        demographics,
      });
    } catch (error) {
      console.error("Patient report error", error);
      res.status(500).json({ message: "Failed to generate patient report" });
    }
  }
);

// GET /api/reports/appointments
router.get(
  "/appointments",
  authAny,
  requireStaff(["Admin"]),
  async (req, res) => {
    try {
      const { startDate, endDate, doctorId, departmentId } = req.query;

      const match = {
        ...buildDateMatch(startDate, endDate, "appointmentDate"),
      };

      const doctorObjectId = parseObjectId(doctorId);
      if (doctorObjectId) {
        match.doctorId = doctorObjectId;
      }

      const appointmentsByDoctor = await Visit.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$doctorId",
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: "$doctor" },
        {
          $lookup: {
            from: "users",
            localField: "doctor.user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            doctorId: "$_id",
            doctorName: "$user.name",
            total: 1,
            _id: 0,
          },
        },
        { $sort: { total: -1 } },
      ]);

      const appointmentsByDepartment = await Visit.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$departmentId",
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "department",
          },
        },
        { $unwind: "$department" },
        {
          $project: {
            departmentId: "$_id",
            departmentName: "$department.name",
            total: 1,
            _id: 0,
          },
        },
        { $sort: { total: -1 } },
      ]);

      const appointmentsByDate = await Visit.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$appointmentDate",
              },
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            date: "$_id",
            total: 1,
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ]);

      res.json({
        appointmentsByDoctor,
        appointmentsByDepartment,
        appointmentsByDate,
      });
    } catch (error) {
      console.error("Appointment report error", error);
      res.status(500).json({ message: "Failed to generate appointment report" });
    }
  }
);

// GET /api/reports/billing
router.get(
  "/billing",
  authAny,
  requireStaff(["Admin"]),
  async (req, res) => {
    try {
      const { startDate, endDate, departmentId } = req.query;

      const match = buildDateMatch(startDate, endDate, "createdAt");

      const bills = await Bill.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "visits",
            localField: "visitId",
            foreignField: "_id",
            as: "visit",
          },
        },
        { $unwind: "$visit" },
        {
          $lookup: {
            from: "doctors",
            localField: "visit.doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "departments",
            localField: "visit.departmentId",
            foreignField: "_id",
            as: "department",
          },
        },
        { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
        {
          $match: departmentId
            ? { "department._id": parseObjectId(departmentId) }
            : {},
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$paidAmount" },
            totalBilled: { $sum: "$totalAmount" },
            unpaidAmount: { $sum: "$balance" },
            byDepartment: {
              $push: {
                departmentId: "$department._id",
                departmentName: "$department.name",
                totalRevenue: "$paidAmount",
                totalBilled: "$totalAmount",
                unpaid: "$balance",
              },
            },
          },
        },
      ]);

      const aggregationResult = bills[0] || {
        totalRevenue: 0,
        totalBilled: 0,
        unpaidAmount: 0,
        byDepartment: [],
      };

      const departmentAggregation = aggregationResult.byDepartment.reduce(
        (acc, item) => {
          const key = item.departmentId?.toString() || "unknown";
          if (!acc[key]) {
            acc[key] = {
              departmentId: item.departmentId,
              departmentName: item.departmentName || "Unknown",
              totalRevenue: 0,
              totalBilled: 0,
              unpaid: 0,
            };
          }
          acc[key].totalRevenue += item.totalRevenue || 0;
          acc[key].totalBilled += item.totalBilled || 0;
          acc[key].unpaid += item.unpaid || 0;
          return acc;
        },
        {}
      );

      const byDepartment = Object.values(departmentAggregation);

      const unpaidBills = await Bill.aggregate([
        {
          $match: {
            ...buildDateMatch(startDate, endDate, "createdAt"),
            balance: { $gt: 0 },
          },
        },
        {
          $lookup: {
            from: "visits",
            localField: "visitId",
            foreignField: "_id",
            as: "visit",
          },
        },
        { $unwind: "$visit" },
        {
          $lookup: {
            from: "patients",
            localField: "patientId",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "departments",
            localField: "visit.departmentId",
            foreignField: "_id",
            as: "department",
          },
        },
        { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
        {
          $match: departmentId
            ? { "department._id": parseObjectId(departmentId) }
            : {},
        },
        {
          $project: {
            billId: "$_id",
            patient: {
              _id: "$patient._id",
              name: {
                $concat: [
                  { $ifNull: ["$patient.firstName", ""] },
                  " ",
                  { $ifNull: ["$patient.lastName", ""] },
                ],
              },
              gender: "$patient.gender",
              age: "$patient.age",
            },
            visitId: "$visit._id",
            department: "$department.name",
            totalAmount: 1,
            paidAmount: 1,
            balance: 1,
            status: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
      ]);

      res.json({
        totalRevenue: aggregationResult.totalRevenue,
        totalBilled: aggregationResult.totalBilled,
        unpaidAmount: aggregationResult.unpaidAmount,
        byDepartment,
        unpaidBills,
      });
    } catch (error) {
      console.error("Billing report error", error);
      res.status(500).json({ message: "Failed to generate billing report" });
    }
  }
);

// GET /api/reports/lab
router.get(
  "/lab",
  authAny,
  requireStaff(["Admin"]),
  async (req, res) => {
    try {
      const { startDate, endDate, departmentId } = req.query;
      const departmentObjectId = parseObjectId(departmentId);

      const match = buildDateMatch(startDate, endDate, "createdAt");
      const labTestsMatch = departmentObjectId
        ? { ...match, department: departmentObjectId }
        : match;

      const totalTests = await LabTest.countDocuments(labTestsMatch);

      const topTests = await LabTest.aggregate([
        { $match: labTestsMatch },
        {
          $group: {
            _id: "$name",
            count: { $sum: 1 },
            departmentId: { $first: "$department" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      res.json({
        totalTests,
        topTests,
      });
    } catch (error) {
      console.error("Lab report error", error);
      res.status(500).json({ message: "Failed to generate lab report" });
    }
  }
);

// GET /api/reports/pharmacy
router.get(
  "/pharmacy",
  authAny,
  requireStaff(["Admin"]),
  async (req, res) => {
    try {
      const { startDate, endDate, doctorId } = req.query;
      const doctorObjectId = parseObjectId(doctorId);

      const match = buildDateMatch(startDate, endDate, "createdAt");

      const totalSales = await Medicine.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalSoldValue: { $sum: "$totalSalesValue" },
            totalQuantitySold: { $sum: "$totalQuantitySold" },
          },
        },
      ]);

      const topMedicines = await Medicine.aggregate([
        { $match: match },
        {
          $project: {
            name: 1,
            totalQuantitySold: 1,
            totalSalesValue: 1,
            prescribedBy: 1,
          },
        },
        { $sort: { totalSalesValue: -1 } },
        { $limit: 10 },
      ]);

      let filteredTopMedicines = topMedicines;
      if (doctorObjectId) {
        filteredTopMedicines = topMedicines.filter((medicine) => {
          if (!medicine.prescribedBy) return false;
          return medicine.prescribedBy.some((id) => id.equals(doctorObjectId));
        });
      }

      res.json({
        totalSales: totalSales[0] || {
          totalSoldValue: 0,
          totalQuantitySold: 0,
        },
        topMedicines: filteredTopMedicines,
      });
    } catch (error) {
      console.error("Pharmacy report error", error);
      res.status(500).json({ message: "Failed to generate pharmacy report" });
    }
  }
);

// GET /api/reports/ml-analysis
// ML Model Analysis and Comparison (calls Python ML service)
router.get(
  "/ml-analysis",
  authAny,
  requireStaff(["Admin"]),
  async (req, res) => {
    try {
      const axios = require("axios");
      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

      // Get metrics from Python ML service
      const response = await axios.get(`${ML_SERVICE_URL}/api/ml/metrics`);
      const mlData = response.data.data;

      // Format response
      let insights = {
        modelsTrained: true,
        lastTrainingDate: new Date().toISOString(),
        totalModels: Object.keys(mlData.models).length,
      };

      if (mlData.average_metrics) {
        insights.averageMetrics = {
          avgAccuracy: mlData.average_metrics.accuracy,
          avgPrecision: mlData.average_metrics.precision,
          avgRecall: mlData.average_metrics.recall,
          avgF1Score: mlData.average_metrics.f1_score,
        };
      }

      if (mlData.best_model) {
        const bestModelData = mlData.models[mlData.best_model];
        insights.bestModel = {
          name: mlData.best_model,
          f1Score: bestModelData.f1_score * 100,
          accuracy: bestModelData.accuracy * 100,
        };
      }

      insights.modelReliability = mlData.reliability_level || "MEDIUM";

      // Convert models to array format for frontend
      const modelsArray = Object.entries(mlData.models).map(([name, metrics]) => ({
        modelName: name,
        accuracy: metrics.accuracy * 100,
        precision: metrics.precision * 100,
        recall: metrics.recall * 100,
        f1Score: metrics.f1_score * 100,
        confusion_matrix: metrics.confusion_matrix,
      }));

      res.json({
        success: true,
        models: modelsArray,
        insights,
      });
    } catch (error) {
      console.error("ML analysis report error", error.message);
      res.status(500).json({ message: "ML service unavailable. Train models first." });
    }
  }
);

module.exports = router;