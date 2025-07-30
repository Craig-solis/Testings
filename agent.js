// agent.js - Node.js agent for remote system info, file access, and terminal commands

const express = require("express");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Restrict CORS to your dashboard domain
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://yourdomain.com",
      null, // Allow file:// protocol for local testing
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Basic authentication middleware (you should implement proper auth)
const API_KEY = process.env.API_KEY || "your-secret-api-key";
function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Endpoint: System Info
app.get("/api/system-info", authenticate, (req, res) => {
  try {
    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      totalmem: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
      freemem: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
      uptime: Math.round(os.uptime() / 60), // minutes
      userInfo: { username: os.userInfo().username },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get system info" });
  }
});

// Endpoint: Security scan (basic)
app.get("/api/security-scan", authenticate, (req, res) => {
  try {
    const scanResults = {
      openPorts: [], // You'd implement actual port scanning
      processes: [], // You'd implement process monitoring
      diskUsage: Math.round(
        ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      ),
      lastScan: new Date().toISOString(),
      threatLevel: "LOW", // You'd implement actual threat assessment
    };
    res.json(scanResults);
  } catch (error) {
    res.status(500).json({ error: "Security scan failed" });
  }
});

// Endpoint: List files in a directory (restricted)
app.get("/api/list-files", authenticate, (req, res) => {
  const dir = req.query.dir || process.cwd();
  // Security: Restrict to certain directories only
  const allowedDirs = [
    process.cwd(),
    os.homedir(),
    path.join(os.homedir(), "Documents"),
  ];
  const isAllowed = allowedDirs.some((allowed) => dir.startsWith(allowed));

  if (!isAllowed) {
    return res.status(403).json({ error: "Directory access denied" });
  }

  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      files
        .slice(0, 50)
        .map((f) => ({ name: f.name, isDirectory: f.isDirectory() }))
    );
  });
});

// Endpoint: View file content (restricted)
app.get("/api/view-file", authenticate, (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: "Missing file path" });

  // Security: Only allow certain file types
  const allowedExtensions = [".txt", ".log", ".json", ".md"];
  const ext = path.extname(filePath);
  if (!allowedExtensions.includes(ext)) {
    return res.status(403).json({ error: "File type not allowed" });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    // Limit file size
    if (data.length > 100000) {
      data = data.substring(0, 100000) + "... [truncated]";
    }
    res.json({ content: data });
  });
});

// Endpoint: Run terminal command (very restricted)
app.post("/api/run-command", authenticate, (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "Missing command" });

  // Security: Only allow whitelisted commands
  const allowedCommands = [
    "systeminfo",
    "tasklist",
    "netstat -an",
    "whoami",
    "date",
    "hostname",
  ];
  const isAllowed = allowedCommands.some((allowed) =>
    command.startsWith(allowed)
  );

  if (!isAllowed) {
    return res.status(403).json({ error: "Command not allowed" });
  }

  exec(
    command,
    { shell: "powershell.exe", timeout: 10000 },
    (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: err.message, stderr });
      res.json({ stdout: stdout.substring(0, 10000), stderr }); // Limit output
    }
  );
});

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`);
});
