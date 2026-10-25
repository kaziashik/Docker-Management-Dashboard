import { Router } from "express";
import { classifyImageError, errorText, portInUseMessage, respondError } from "../../errors.js";
import {
  createContainer,
  listContainers,
  removeContainer,
  restartContainer,
  startContainer,
  stopContainer,
} from "./service.js";

const router = Router();

const handleError = (res, err) =>
  respondError(res, err, {
    304: "No change: container is already in that state",
    404: "Container not found",
    byMessage: [
      { test: /no such container/i, status: 404, error: "Container not found" },
    ],
  });

// Turn "8080:80" into host and container ports. "80" means 80:80.
const parsePort = (port) => {
  const [hostPort, containerPort] = String(port).trim().split(":");
  const host = hostPort;
  const container = containerPort || hostPort;

  const valid = (p) => /^\d+$/.test(p) && +p > 0 && +p <= 65535;
  if (!valid(host) || !valid(container)) return null;

  return { host, container };
};

// GET /containers
router.get("/", async (req, res) => {
  try {
    res.json(await listContainers());
  } catch (err) {
    handleError(res, err);
  }
});

// POST /containers/create
router.post("/create", async (req, res) => {
  const { image, name, port } = req.body;

  if (typeof image !== "string" || !image.trim()) {
    return res.status(400).json({ error: "Image name is required" });
  }

  const imageInput = image.trim();

  let containerName;
  if (name != null && name !== "") {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Container name must be a non-empty string" });
    }
    containerName = name.trim();
  }

  let parsedPort = null;
  if (port != null && String(port).trim()) {
    parsedPort = parsePort(port);
    if (!parsedPort) {
      return res.status(400).json({ error: 'Invalid port. Use the format "8080:80"' });
    }
  }

  try {
    const created = await createContainer({
      image: imageInput,
      name: containerName,
      port: parsedPort,
    });

    res.status(201).json({
      message: "Container created and started",
      id: created.id,
      shortId: created.shortId,
    });
  } catch (err) {
    const portError = portInUseMessage(err, parsedPort?.host);
    if (portError) {
      return res.status(409).json({ error: portError });
    }

    const imageError = classifyImageError(err, imageInput);
    if (imageError) {
      return res.status(imageError.status).json({ error: imageError.error });
    }

    if (err.statusCode === 409 || /already in use by container/i.test(errorText(err))) {
      return res.status(409).json({ error: "A container with that name already exists" });
    }

    handleError(res, err);
  }
});

// POST /containers/:id/start
router.post("/:id/start", async (req, res) => {
  try {
    await startContainer(req.params.id);
    res.json({ message: "Container started" });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /containers/:id/stop
router.post("/:id/stop", async (req, res) => {
  try {
    await stopContainer(req.params.id);
    res.json({ message: "Container stopped" });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /containers/:id/restart
router.post("/:id/restart", async (req, res) => {
  try {
    await restartContainer(req.params.id);
    res.json({ message: "Container restarted" });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /containers/:id
router.delete("/:id", async (req, res) => {
  try {
    await removeContainer(req.params.id);
    res.json({ message: "Container removed" });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
