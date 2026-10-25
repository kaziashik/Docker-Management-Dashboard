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







///Containers: create and run (pull image if missing, parse port like 8080:80)



// Add a tag if the image has none (nginx -> nginx:latest)
const withTag = (image) => {
  const lastPart = image.split("/").pop();
  return lastPart.includes(":") || lastPart.includes("@")
    ? image
    : `${image}:latest`;
};



// Pull an image only if it isn't already on this machine
const ensureImage = async (image) => {
  try {
    await docker.getImage(image).inspect();
  } catch (err) {
    if (err.statusCode !== 404) throw err;

    const stream = await docker.pull(image);
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (e) => (e ? reject(e) : resolve()));
    });
  }
};




// Turn "8080:80" into the format Docker expects
const parsePort = (port) => {
  const [hostPort, containerPort] = String(port).trim().split(":");
  const host = hostPort;
  const container = containerPort || hostPort; // "80" means 80:80

  const valid = (p) => /^\d+$/.test(p) && +p > 0 && +p <= 65535;
  if (!valid(host) || !valid(container)) return null;

  return { host, container };
};

// POST /containers/create
router.post("/create", async (req, res) => {
  const { image, name, port } = req.body;

  if (!image || !image.trim()) {
    return res.status(400).json({ error: "Image name is required" });
  }

  const imageName = withTag(image.trim());
  const config = { Image: imageName, HostConfig: {} };

  if (name && name.trim()) config.name = name.trim();

  if (port && String(port).trim()) {
    const parsed = parsePort(port);
    if (!parsed) {
      return res
        .status(400)
        .json({ error: 'Invalid port. Use the format "8080:80"' });
    }
    const key = `${parsed.container}/tcp`;
    config.ExposedPorts = { [key]: {} };
    config.HostConfig.PortBindings = { [key]: [{ HostPort: parsed.host }] };
  }

  let container;
  try {
    await ensureImage(imageName);
    container = await docker.createContainer(config);
    await container.start();

    res.status(201).json({
      message: "Container created and started",
      id: container.id,
      shortId: container.id.slice(0, 12),
    });
  } catch (err) {
    // Container was created but couldn't start (for example, port already in use)
    if (container) await container.remove({ force: true }).catch(() => {});

    if (err.statusCode === 404) {
      return res.status(404).json({ error: `Image "${imageName}" not found` });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({ error: "A container with that name already exists" });
    }
    handleError(res, err);
  }
});

export default router;