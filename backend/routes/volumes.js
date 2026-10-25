import { Router } from "express";
import docker from "../docker.js";

const router = Router();

const handleError = (res, err) => {
  res.status(err.statusCode || 500).json({ error: err.message });
};

// GET /volumes
router.get("/", async (req, res) => {
  try {
    const data = await docker.listVolumes();

    const result = (data.Volumes || [])
      .map((v) => ({
        name: v.Name,
        driver: v.Driver,
        mountpoint: v.Mountpoint,
        scope: v.Scope,
        createdAt: v.CreatedAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first

    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// POST /volumes/create
router.post("/create", async (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    return res.status(400).json({ error: "Volume name is required" });
  }

  // Docker rule: starts with a letter or digit, then letters, digits, _ . -
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/.test(name)) {
    return res.status(400).json({
      error:
        "Invalid name. Use at least 2 characters: letters, digits, _ . - (must start with a letter or digit)",
    });
  }

  try {
    // Docker silently returns an existing volume if the name is taken, so check first
    try {
      await docker.getVolume(name).inspect();
      return res
        .status(409)
        .json({ error: `Volume "${name}" already exists` });
    } catch (err) {
      if (err.statusCode !== 404) throw err;
    }

    const volume = await docker.createVolume({ Name: name });

    res.status(201).json({
      message: "Volume created",
      name: volume.Name,
      driver: volume.Driver,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /volumes/:name
router.delete("/:name", async (req, res) => {
  try {
    await docker.getVolume(req.params.name).remove();
    res.json({ message: "Volume removed" });
  } catch (err) {
    if (err.statusCode === 409) {
      return res
        .status(409)
        .json({ error: "Volume is in use by a container. Remove that container first" });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Volume not found" });
    }
    handleError(res, err);
  }
});

export default router;