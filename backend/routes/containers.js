import { Router } from "express";
import docker from "../docker.js";

const router = Router();

const handleError = (res, err) => {
  if (err.statusCode === 304) {
    return res
      .status(200)
      .json({ message: "No change: container is already in that state" });
  }
  res.status(err.statusCode || 500).json({ error: err.message });
};

// GET /containers
router.get("/", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });

    const result = containers
      .map((c) => ({
        id: c.Id,
        shortId: c.Id.slice(0, 12),
        name: c.Names[0]?.replace("/", "") || c.Id.slice(0, 12),
        image: c.Image,
        state: c.State,
        status: c.Status,
        ports: c.Ports,
        created: c.Created,
      }))
      .sort((a, b) => b.created - a.created); // newest first

    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// POST /containers/:id/start
router.post("/:id/start", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).start();
    res.json({ message: "Container started" });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /containers/:id/stop
router.post("/:id/stop", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).stop();
    res.json({ message: "Container stopped" });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /containers/:id/restart
router.post("/:id/restart", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).restart();
    res.json({ message: "Container restarted" });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /containers/:id
router.delete("/:id", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).remove({ force: true });
    res.json({ message: "Container removed" });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;