import docker from "../../docker.js";
import { errorText } from "../../errors.js";

export async function listContainers() {
  const containers = await docker.listContainers({ all: true });

  return containers
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
    .sort((a, b) => b.created - a.created);
}

export async function startContainer(id) {
  await docker.getContainer(id).start();
}

export async function stopContainer(id) {
  await docker.getContainer(id).stop();
}

export async function restartContainer(id) {
  await docker.getContainer(id).restart();
}

export async function removeContainer(id) {
  await docker.getContainer(id).remove({ force: true });
}

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
      docker.modem.followProgress(stream, (pullErr) => {
        if (!pullErr) return resolve();
        // Pull progress errors are often a plain string, with no statusCode.
        reject(pullErr instanceof Error ? pullErr : new Error(errorText(pullErr)));
      });
    });
  }
};

// image is already trimmed. port is { host, container } or omitted.
export async function createContainer({ image, name, port }) {
  const imageName = withTag(image);
  const config = { Image: imageName, HostConfig: {} };

  if (name) config.name = name;

  if (port) {
    const key = `${port.container}/tcp`;
    config.ExposedPorts = { [key]: {} };
    config.HostConfig.PortBindings = { [key]: [{ HostPort: port.host }] };
  }

  let container;
  try {
    await ensureImage(imageName);
    container = await docker.createContainer(config);
    await container.start();

    return {
      id: container.id,
      shortId: container.id.slice(0, 12),
    };
  } catch (err) {
    // Container was created but couldn't start (for example, port already in use)
    if (container) await container.remove({ force: true }).catch(() => {});
    throw err;
  }
}
