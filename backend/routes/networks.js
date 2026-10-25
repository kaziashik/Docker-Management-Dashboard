import { Router } from "express";
import docker from "../docker.js";
import { errorText, respondError } from "../errors.js";

const router = Router();

const PROTECTED = ["bridge", "host", "none"]; // Docker's built-in networks
const DRIVERS = ["bridge", "host", "none"];

const handleError = (res, err) => respondError(res, err);

// GET /networks
router.get("/", async (req, res) => {
  try {
    const networks = await docker.listNetworks();

    const result = networks
      .map((n) => ({
        id: n.Id,
        shortId: n.Id.slice(0, 12),
        name: n.Name,
        driver: n.Driver,
        scope: n.Scope,
        internal: n.Internal,
        subnet: n.IPAM?.Config?.[0]?.Subnet || null,
        gateway: n.IPAM?.Config?.[0]?.Gateway || null,
        created: n.Created,
        builtIn: PROTECTED.includes(n.Name),
      }))
      .sort((a, b) => new Date(b.created) - new Date(a.created)); // newest first

    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// POST /networks/create
router.post("/create", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const rawDriver = req.body.driver;
  const driver =
    rawDriver == null || rawDriver === ""
      ? "bridge"
      : typeof rawDriver === "string"
        ? rawDriver.trim()
        : "";

  if (!name) {
    return res.status(400).json({ error: "Network name is required" });
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/.test(name)) {
    return res.status(400).json({
      error:
        "Invalid name. Use at least 2 characters: letters, digits, _ . - (must start with a letter or digit)",
    });
  }

  if (!DRIVERS.includes(driver)) {
    return res
      .status(400)
      .json({ error: `Invalid driver. Use one of: ${DRIVERS.join(", ")}` });
  }

  try {
    // Docker allows duplicate network names, so check first
    const existing = await docker.listNetworks({ filters: { name: [name] } });
    if (existing.some((n) => n.Name === name)) {
      return res
        .status(409)
        .json({ error: `Network "${name}" already exists` });
    }

    const network = await docker.createNetwork({ Name: name, Driver: driver });

    res.status(201).json({
      message: "Network created",
      id: network.id,
      shortId: network.id.slice(0, 12),
      name,
      driver,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /networks/:id
router.delete("/:id", async (req, res) => {
  try {
    await docker.getNetwork(req.params.id).remove();
    res.json({ message: "Network removed" });
  } catch (err) {
    const text = errorText(err);
    // Docker 29 uses 403 both for built-in networks and for networks that still have containers.
    if (/active endpoints/i.test(text)) {
      return res.status(409).json({
        error: "Network has containers connected. Remove or disconnect them first",
      });
    }
    if (err.statusCode === 403) {
      return res
        .status(403)
        .json({ error: "This is a built-in Docker network and can't be removed" });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Network not found" });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: "Network has containers connected. Remove or disconnect them first",
      });
    }
    handleError(res, err);
  }
});

export default router;