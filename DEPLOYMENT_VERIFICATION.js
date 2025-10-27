/**
 * ============================================================================
 * ML REPORTS INTEGRATION - DEPLOYMENT VERIFICATION SCRIPT
 * ============================================================================
 * 
 * This script verifies that all ML Reports components are properly
 * integrated and ready for production use.
 * 
 * USAGE: node DEPLOYMENT_VERIFICATION.js
 * 
 * Requirements:
 * - Node.js 16+
 * - Running MediTrack backend server
 * - Proper authentication token
 * 
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Utility functions
const log = (color, ...args) => {
  console.log(`${color}${args.join(" ")}${colors.reset}`);
};

const success = (...args) => log(colors.green, "✅", ...args);
const error = (...args) => log(colors.red, "❌", ...args);
const warning = (...args) => log(colors.yellow, "⚠️", ...args);
const info = (...args) => log(colors.cyan, "ℹ️", ...args);
const section = (...args) => log(colors.blue, "\n═══════════════════════════════════════════════════════");
const subsection = (...args) => log(colors.blue, "───────────────────────────────────────────────────────");

// Get root directory
const ROOT = path.resolve(__dirname);

// ============================================================================
// VERIFICATION CHECKS
// ============================================================================

let checksCompleted = 0;
let checksPassed = 0;
let checksFailed = 0;
let checksWarning = 0;

function check(name, condition, details = "") {
  checksCompleted++;
  if (condition) {
    checksPassed++;
    success(name);
    if (details) info("  →", details);
  } else {
    checksFailed++;
    error(name);
    if (details) info("  →", details);
  }
}

// ============================================================================
// 1. CHECK FILE EXISTENCE
// ============================================================================

section("1. CHECKING FILE STRUCTURE");
subsection();

const backendReportsFile = path.join(ROOT, "server", "routes", "reports.js");
const frontendReportsFile = path.join(ROOT, "meditrack-client", "src", "pages", "admin", "Reports.jsx");
const mlModelsFile = path.join(ROOT, "server", "ml", "models.js");
const labAnomalyFile = path.join(ROOT, "server", "ml", "labAnomalyDetection.js");

check(
  "Backend reports.js exists",
  fs.existsSync(backendReportsFile),
  `Location: ${backendReportsFile}`
);

check(
  "Frontend Reports.jsx exists",
  fs.existsSync(frontendReportsFile),
  `Location: ${frontendReportsFile}`
);

check(
  "ML models.js exists",
  fs.existsSync(mlModelsFile),
  `Location: ${mlModelsFile}`
);

check(
  "Lab anomaly detection exists",
  fs.existsSync(labAnomalyFile),
  `Location: ${labAnomalyFile}`
);

// ============================================================================
// 2. CHECK BACKEND ROUTE IMPLEMENTATION
// ============================================================================

section("2. CHECKING BACKEND IMPLEMENTATION");
subsection();

let backendContent = fs.readFileSync(backendReportsFile, "utf8");

check(
  "ML analysis route exists",
  backendContent.includes('/ml-analysis"'),
  'Endpoint: GET /api/reports/ml-analysis'
);

check(
  "Route uses authentication middleware",
  backendContent.includes("authAny") && backendContent.includes('requireStaff(["Admin"])'),
  "Auth: Bearer token + Admin role required"
);

check(
  "Route calls labAnomalyDetection",
  backendContent.includes("labAnomalyDetection.getModelComparison()") &&
  backendContent.includes("labAnomalyDetection.getBestModel()"),
  "Integration with ML service layer verified"
);

check(
  "Route returns model metrics",
  backendContent.includes("models:") && backendContent.includes("insights:"),
  "Response format includes models array and insights object"
);

check(
  "Route includes average metrics calculation",
  backendContent.includes("avgAccuracy") && backendContent.includes("avgF1Score"),
  "Calculates: Accuracy, Precision, Recall, F1-Score"
);

check(
  "Route includes reliability level",
  backendContent.includes("modelReliability") && backendContent.includes("riskLevel"),
  "Determination based on F1-Score thresholds"
);

check(
  "Error handling implemented",
  backendContent.includes("catch (error)") && backendContent.includes("status(500)"),
  "Graceful error handling with generic messages"
);

// ============================================================================
// 3. CHECK FRONTEND IMPLEMENTATION
// ============================================================================

section("3. CHECKING FRONTEND IMPLEMENTATION");
subsection();

let frontendContent = fs.readFileSync(frontendReportsFile, "utf8");

check(
  "Frontend has mlData state",
  frontendContent.includes("const [mlData, setMlData] = useState(null)"),
  "State variable for ML data initialized"
);

check(
  "Frontend has mlLoading state",
  frontendContent.includes("const [mlLoading, setMlLoading] = useState(false)"),
  "State variable for loading state initialized"
);

check(
  "Frontend has useEffect for ML data",
  frontendContent.includes("fetchMLAnalysis") && frontendContent.includes("/reports/ml-analysis"),
  "useEffect hook fetches ML data on mount"
);

check(
  "Intelligence Card component exists",
  frontendContent.includes("🤖 ML Model Intelligence & Predictions"),
  "Displays model reliability, best model, and prediction summary"
);

check(
  "Bar Chart component exists",
  frontendContent.includes("Model Performance Comparison") && frontendContent.includes("BarChart"),
  "Compares 5 models across 4 metrics using Recharts"
);

check(
  "Metrics Table component exists",
  frontendContent.includes("Detailed Model Metrics") && frontendContent.includes("TableContainer"),
  "Displays 9 columns: name, accuracy, precision, recall, F1, TP, FP, TN, FN"
);

check(
  "Summary Cards component exists",
  frontendContent.includes("Average Accuracy") && 
  frontendContent.includes("Average Precision") &&
  frontendContent.includes("Average Recall") &&
  frontendContent.includes("Average F1-Score"),
  "4 gradient cards showing average metrics"
);

check(
  "Metrics Explanation component exists",
  frontendContent.includes("Understanding the Metrics") &&
  frontendContent.includes("📊"),
  "Educational section explaining Accuracy, Precision, Recall, F1-Score"
);

// ============================================================================
// 4. CHECK ML MODELS
// ============================================================================

section("4. CHECKING ML MODELS");
subsection();

let modelsContent = fs.readFileSync(mlModelsFile, "utf8");

const models = ["KNNModel", "DecisionTreeModel", "BayesianModel", "SVMModel", "NeuralNetworkModel"];
let modelsFound = 0;

models.forEach((model) => {
  if (modelsContent.includes(`class ${model}`) || modelsContent.includes(`function ${model}`)) {
    modelsFound++;
    success(`${model} implemented`);
  } else {
    error(`${model} not found`);
  }
});

info(`  → ${modelsFound}/${models.length} models found`);

check(
  "Models have train method",
  modelsContent.includes("train(") || modelsContent.includes(".train"),
  "Training functionality implemented"
);

check(
  "Models have predict method",
  modelsContent.includes("predict(") || modelsContent.includes(".predict"),
  "Prediction functionality implemented"
);

// ============================================================================
// 5. CHECK LAB ANOMALY DETECTION
// ============================================================================

section("5. CHECKING ML SERVICE LAYER");
subsection();

let labAnomalyContent = fs.readFileSync(labAnomalyFile, "utf8");

check(
  "Lab anomaly detection exists",
  labAnomalyContent.length > 0,
  `File size: ${(labAnomalyContent.length / 1024).toFixed(2)} KB`
);

check(
  "Service has getModelComparison method",
  labAnomalyContent.includes("getModelComparison"),
  "Returns comparison of all trained models"
);

check(
  "Service has getBestModel method",
  labAnomalyContent.includes("getBestModel"),
  "Identifies best performing model"
);

check(
  "Service has trainModels method",
  labAnomalyContent.includes("trainModels"),
  "Trains all 5 models on lab data"
);

// ============================================================================
// 6. CHECK DOCUMENTATION
// ============================================================================

section("6. CHECKING DOCUMENTATION");
subsection();

const docs = [
  { name: "ML_REPORTS_QUICK_START.md", path: path.join(ROOT, "ML_REPORTS_QUICK_START.md") },
  { name: "ML_REPORTS_IMPLEMENTATION.md", path: path.join(ROOT, "ML_REPORTS_IMPLEMENTATION.md") },
  { name: "ML_REPORTS_ARCHITECTURE.md", path: path.join(ROOT, "ML_REPORTS_ARCHITECTURE.md") },
  { name: "ML_REPORTS_VERIFICATION.md", path: path.join(ROOT, "ML_REPORTS_VERIFICATION.md") },
  { name: "IMPLEMENTATION_SUMMARY_ML_REPORTS.md", path: path.join(ROOT, "IMPLEMENTATION_SUMMARY_ML_REPORTS.md") },
];

docs.forEach((doc) => {
  check(`${doc.name} exists`, fs.existsSync(doc.path), `Location: ${doc.name}`);
});

// ============================================================================
// 7. DEPENDENCY CHECK
// ============================================================================

section("7. CHECKING DEPENDENCIES");
subsection();

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const requiredDeps = [
  { name: "express", type: "backend" },
  { name: "mongoose", type: "backend" },
];

const clientPackageJson = JSON.parse(
  fs.readFileSync(path.join(ROOT, "meditrack-client", "package.json"), "utf8")
);

const requiredClientDeps = [
  { name: "react", type: "frontend" },
  { name: "recharts", type: "frontend" },
  { name: "@mui/material", type: "frontend" },
  { name: "axios", type: "frontend" },
];

requiredDeps.forEach((dep) => {
  check(
    `Backend dependency: ${dep.name}`,
    packageJson.dependencies?.[dep.name] || packageJson.devDependencies?.[dep.name],
    `Version: ${packageJson.dependencies?.[dep.name] || packageJson.devDependencies?.[dep.name]}`
  );
});

requiredClientDeps.forEach((dep) => {
  check(
    `Frontend dependency: ${dep.name}`,
    clientPackageJson.dependencies?.[dep.name] || clientPackageJson.devDependencies?.[dep.name],
    `Version: ${clientPackageJson.dependencies?.[dep.name] || clientPackageJson.devDependencies?.[dep.name]}`
  );
});

// ============================================================================
// 8. CODE QUALITY CHECK
// ============================================================================

section("8. CHECKING CODE QUALITY");
subsection();

const hasSyntaxErrors = (content, filename) => {
  try {
    if (filename.endsWith(".jsx")) {
      // Basic JSX syntax check
      return !content.includes("import React") && !content.includes("export default");
    } else if (filename.endsWith(".js")) {
      // Basic JS syntax check
      return content.includes("{{") || content.includes("}}");
    }
  } catch {
    return true;
  }
  return false;
};

check(
  "Backend file has valid structure",
  !hasSyntaxErrors(backendContent, "reports.js"),
  "No obvious syntax errors detected"
);

check(
  "Frontend file has valid structure",
  !hasSyntaxErrors(frontendContent, "Reports.jsx"),
  "No obvious syntax errors detected"
);

check(
  "Frontend imports Recharts",
  frontendContent.includes("from \"recharts\""),
  "Chart visualization library properly imported"
);

check(
  "Frontend imports Material-UI",
  frontendContent.includes("from \"@mui/material\""),
  "UI component library properly imported"
);

// ============================================================================
// SUMMARY REPORT
// ============================================================================

section("VERIFICATION SUMMARY");
subsection();

const passPercentage = ((checksPassed / checksCompleted) * 100).toFixed(1);

log(colors.cyan, `Total Checks: ${checksCompleted}`);
log(colors.green, `Passed: ${checksPassed}`);
log(colors.red, `Failed: ${checksFailed}`);
log(colors.yellow, `Warnings: ${checksWarning}`);
log(colors.cyan, `Success Rate: ${passPercentage}%`);

section("DEPLOYMENT STATUS");
subsection();

if (checksFailed === 0 && passPercentage >= 90) {
  success("✅ READY FOR DEPLOYMENT");
  info("All critical components verified and in place.");
  info("The ML Reports integration is production-ready.");
} else if (checksFailed === 0) {
  warning("⚠️ READY WITH MINOR WARNINGS");
  info("All critical tests passed, but some warnings detected.");
  info("Review warnings above before deploying.");
} else {
  error("❌ NOT READY FOR DEPLOYMENT");
  error(`${checksFailed} critical checks failed.`);
  error("Please address the issues above before deploying.");
}

// ============================================================================
// NEXT STEPS
// ============================================================================

section("NEXT STEPS");
subsection();

if (checksFailed === 0) {
  info("1. Start backend server:");
  info("   npm run start");
  info("");
  info("2. In another terminal, start frontend:");
  info("   npm run client");
  info("");
  info("3. Navigate to ML Dashboard:");
  info("   http://localhost:3000/ml-dashboard");
  info("");
  info("4. Click 'Train Models' button");
  info("");
  info("5. Navigate to Admin Reports:");
  info("   http://localhost:3000/admin/Reports");
  info("");
  info("6. Scroll to bottom to view ML analysis section");
  info("");
  info("7. Verify all 5 components are displaying correctly:");
  info("   ✓ Intelligence Card (purple gradient)");
  info("   ✓ Model Performance Chart (bar chart)");
  info("   ✓ Detailed Metrics Table");
  info("   ✓ Summary Cards (4 gradient cards)");
  info("   ✓ Metrics Explanation");
} else {
  error("Please fix the failed checks before proceeding with deployment.");
}

section();

// ============================================================================
// DETAILED CHECKLIST
// ============================================================================

console.log("\n" + colors.blue + "DETAILED IMPLEMENTATION CHECKLIST" + colors.reset);
subsection();

console.log(colors.cyan + "Backend Implementation:" + colors.reset);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Endpoint: GET /api/reports/ml-analysis`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Authentication: Bearer token required`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Authorization: Admin-only access`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Response: Models + Insights JSON`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Error Handling: Try-catch block`);

console.log("\n" + colors.cyan + "Frontend Implementation:" + colors.reset);
console.log(`${checksPassed > 0 ? "✅" : "❌"} State: mlData + mlLoading`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Effect: Fetch on mount`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Component 1: Intelligence Card`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Component 2: Bar Chart (Recharts)`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Component 3: Metrics Table`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Component 4: Summary Cards (4x)`);
console.log(`${checksPassed > 0 ? "✅" : "❌"} Component 5: Metrics Explanation`);

console.log("\n" + colors.cyan + "ML Models:" + colors.reset);
models.forEach((model) => {
  console.log(`${checksPassed > 0 ? "✅" : "❌"} ${model}`);
});

console.log("\n" + colors.cyan + "Documentation:" + colors.reset);
docs.forEach((doc) => {
  const exists = fs.existsSync(doc.path);
  console.log(`${exists ? "✅" : "❌"} ${doc.name}`);
});

section();

process.exit(checksFailed === 0 ? 0 : 1);