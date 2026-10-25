import { Router } from "express";
import docker from "../docker.js";

const router = Router();

// GET /volumes
router.get("/", async (req, res) => {
  try {
    const data = await docker.listVolumes();
    res.json(data.Volumes || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;