import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import companyRoutes from "./routes/companyroutes.js";
import studentRoutes from "./routes/studentroutes.js";
import jobRoutes from "./routes/jobroutes.js";
import interviewRoutes from "./routes/interviewroutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/companies", companyRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
