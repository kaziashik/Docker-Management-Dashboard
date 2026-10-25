import { Router } from "express";
import docker from "../docker.js";

const router = Router();

// GET /networks
router.get("/", async (req, res) => {
  try {
    const networks = await docker.listNetworks();
    res.json(networks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;