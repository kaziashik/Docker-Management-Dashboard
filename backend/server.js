import express from "express";
import cors from "cors";
import docker from "./docker.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Docker Dashboard API is running" });
});

// Docker connection test
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



// List all containers (running and stopped)
app.get("/containers", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });

    const result = containers.map((c) => ({
      id: c.Id,
      shortId: c.Id.slice(0, 12),
      name: c.Names[0].replace("/", ""),
      image: c.Image,
      state: c.State,   // running, exited, created, paused
      status: c.Status, // "Up 2 hours", "Exited (0) 3 days ago"
      ports: c.Ports,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});