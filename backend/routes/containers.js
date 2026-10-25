import { Router } from "express";
import docker from "../docker.js";

const router = Router();

// GET /containers
router.get("/", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });

    const result = containers.map((c) => ({
      id: c.Id,
      shortId: c.Id.slice(0, 12),
      name: c.Names[0].replace("/", ""),
      image: c.Image,
      state: c.State,
      status: c.Status,
      ports: c.Ports,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;