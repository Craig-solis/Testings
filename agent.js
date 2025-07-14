// agent.js - Node.js agent for remote system info, file access, and terminal commands

const express = require('express');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Endpoint: System Info
app.get('/api/system-info', (req, res) => {
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    uptime: os.uptime(),
    userInfo: os.userInfo(),
    networkInterfaces: os.networkInterfaces(),
  });
});

// Endpoint: List files in a directory
app.get('/api/list-files', (req, res) => {
  const dir = req.query.dir || process.cwd();
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(files.map(f => ({ name: f.name, isDirectory: f.isDirectory() })));
  });
});

// Endpoint: View file content
app.get('/api/view-file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Missing file path' });
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ content: data });
  });
});

// Endpoint: Run terminal command
app.post('/api/run-command', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Missing command' });
  exec(command, { shell: 'powershell.exe' }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: err.message, stderr });
    res.json({ stdout, stderr });
  });
});

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`);
});
