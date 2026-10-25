import express from "express";
import cors from "cors";
import docker from "./docker.js";
import containersRouter from "./routes/containers.js";
import volumesRouter from "./routes/volumes.js";
import networksRouter from "./routes/networks.js";
import { jsonBodyError, respondError } from "./errors.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get("/", (req, res) => {
  res.json({ message: "Docker Dashboard API is running" });
});

app.get("/docker/info", async (req, res) => {
  try {
    const info = await docker.info();
    res.json({
      containers: info.Containers,
      running: info.ContainersRunning,
      images: info.Images,
      version: info.ServerVersion,
    });
  } catch (err) {
    respondError(res, err);
  }
});

// Routes
app.use("/containers", containersRouter);
app.use("/volumes", volumesRouter);
app.use("/networks", networksRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const bodyError = jsonBodyError(err);
  if (bodyError) {
    return res.status(bodyError.status).json({ error: bodyError.error });
  }

  return respondError(res, err);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});