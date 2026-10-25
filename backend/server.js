import express from "express";
import cors from "cors";
import docker from "./docker.js";
import containersRouter from "./routes/containers.js";
import volumesRouter from "./routes/volumes.js";
import networksRouter from "./routes/networks.js";

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
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use("/containers", containersRouter);
app.use("/volumes", volumesRouter);
app.use("/networks", networksRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});