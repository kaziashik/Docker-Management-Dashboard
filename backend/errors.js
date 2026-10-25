// Dockerode prefixes API errors as "(HTTP code 404) unexpected - ...".
// Prefer the JSON message Docker actually sent, then drop that prefix.
export function errorText(err) {
  if (typeof err === "string") return cleanDockerMessage(err);
  if (!err || typeof err !== "object") return "Unexpected error";

  const fromJson =
    err.json && (typeof err.json === "string" ? err.json : err.json.message);

  const raw =
    (typeof fromJson === "string" && fromJson.trim() && fromJson) ||
    (typeof err.message === "string" && err.message.trim() && err.message) ||
    "Unexpected error";

  return cleanDockerMessage(raw);
}

function cleanDockerMessage(text) {
  return String(text)
    .replace(/^\(HTTP code \d+\)\s+[^-]*-\s*/, "")
    .trim();
}

// Socket failures mean the engine is down or this process cannot reach it.
// Real Docker API errors always carry a statusCode, so those stay out of this path.
export function isDockerDown(err) {
  if (!err || typeof err !== "object" || err.statusCode) return false;

  if (
    ["ENOENT", "ECONNREFUSED", "EACCES", "EPERM", "ENOTFOUND", "ECONNRESET", "EPIPE"].includes(
      err.code
    )
  ) {
    return true;
  }

  const message = String(err.message || "");
  return /docker daemon is not running|docker_engine|docker\.sock|connect ENOENT|connect ECONNREFUSED/i.test(
    message
  );
}

export function dockerDownMessage(err) {
  if (err?.code === "EACCES" || err?.code === "EPERM") {
    return "Cannot connect to Docker. Permission denied on the Docker socket";
  }
  return "Cannot connect to Docker. Is Docker running?";
}

function httpStatus(err) {
  const code = err?.statusCode || err?.status;
  if (typeof code === "number" && code >= 400 && code < 600) return code;
  return 500;
}

// known[status] overrides the message for that HTTP status.
// known[304] is sent as 200, because a 304 response cannot include a body.
// known.byMessage catches Docker errors that omit statusCode.
export function respondError(res, err, known = {}) {
  if (isDockerDown(err)) {
    return res.status(503).json({ error: dockerDownMessage(err) });
  }

  const text = errorText(err);

  if (err?.statusCode === 304) {
    return res.status(200).json({
      message:
        typeof known[304] === "string"
          ? known[304]
          : "No change: already in that state",
    });
  }

  for (const rule of known.byMessage || []) {
    if (rule.test.test(text)) {
      return res.status(rule.status).json({ error: rule.error });
    }
  }

  const status = httpStatus(err);
  if (typeof known[status] === "string") {
    return res.status(status).json({ error: known[status] });
  }

  return res.status(status).json({ error: text || "Unexpected error" });
}

const PORT_IN_USE =
  /port is already allocated|address already in use|only one usage of each socket address|ports are not available/i;

export function portInUseMessage(err, requestedPort) {
  const text = errorText(err);
  if (!PORT_IN_USE.test(text)) return null;

  const match = text.match(/(?:0\.0\.0\.0|127\.0\.0\.1|\[::\]|:::):(\d+)/);
  const port = match?.[1] || requestedPort;
  return port ? `Port ${port} is already in use` : "That port is already in use";
}

export function classifyImageError(err, imageName) {
  const text = errorText(err);
  const missing =
    err?.statusCode === 404 ||
    /manifest unknown|manifest for .+ not found|no such image|repository does not exist|\bnot found\b/i.test(
      text
    );

  if (missing) {
    return { status: 404, error: `Image "${imageName}" not found` };
  }

  if (/pull access denied|unauthorized|authentication required/i.test(text)) {
    return {
      status: 401,
      error: `Cannot pull "${imageName}". It may be private or you may need to log in to Docker`,
    };
  }

  // A space in the name fails inside Dockerode, before Docker can say
  // "invalid reference format".
  if (/invalid reference format|invalid repository name|unescaped characters/i.test(text)) {
    return { status: 400, error: `Invalid image name "${imageName}"` };
  }

  return null;
}

export function jsonBodyError(err) {
  if (!err || typeof err !== "object") return null;

  if (err.type === "entity.parse.failed") {
    return { status: 400, error: "Invalid JSON body" };
  }

  if (err.type === "entity.too.large") {
    return { status: 413, error: "Request body is too large" };
  }

  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400)) {
    return { status: 400, error: "Invalid JSON body" };
  }

  return null;
}
