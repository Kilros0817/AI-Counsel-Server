import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import surveyRouter from "./routes/survey";
import companyRouter from "./routes/company";
import { seedDefaultProject } from "./seed";
import { getUsageSummary, getUsageLog } from "./llm";

dotenv.config();
seedDefaultProject();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "interview-backend" });
});

// Usage telemetry endpoint
app.get("/usage", (_req, res) => {
  res.json({ summary: getUsageSummary(), log: getUsageLog() });
});

app.use("/survey", surveyRouter);
app.use("/companies", companyRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
