# PowerShell script to install and run the security agent
# Run this on target endpoints

param(
    [string]$ApiKey = "your-secret-api-key",
    [int]$Port = 5000
)

Write-Host "Installing Security Agent..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Create agent directory
$agentDir = "$env:USERPROFILE\SecurityAgent"
if (!(Test-Path $agentDir)) {
    New-Item -ItemType Directory -Path $agentDir
    Write-Host "Created agent directory: $agentDir" -ForegroundColor Green
}

# Copy agent.js to the directory
$sourceAgent = ".\agent.js"
if (Test-Path $sourceAgent) {
    Copy-Item $sourceAgent "$agentDir\agent.js"
    Write-Host "Copied agent.js to $agentDir" -ForegroundColor Green
} else {
    Write-Host "agent.js not found in current directory" -ForegroundColor Red
    exit 1
}

# Create package.json
$packageJson = @"
{
  "name": "security-agent",
  "version": "1.0.0",
  "description": "Security monitoring agent",
  "main": "agent.js",
  "scripts": {
    "start": "node agent.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
"@

$packageJson | Out-File -FilePath "$agentDir\package.json" -Encoding UTF8
Write-Host "Created package.json" -ForegroundColor Green

# Create environment file
$envContent = @"
API_KEY=$ApiKey
PORT=$Port
"@

$envContent | Out-File -FilePath "$agentDir\.env" -Encoding UTF8
Write-Host "Created .env file with API key" -ForegroundColor Green

# Install dependencies
Set-Location $agentDir
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    
    Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
    Write-Host "Agent installed in: $agentDir" -ForegroundColor White
    Write-Host "To start the agent:" -ForegroundColor White
    Write-Host "  cd $agentDir" -ForegroundColor Yellow
    Write-Host "  npm start" -ForegroundColor Yellow
    Write-Host "`nOr run as a service using:" -ForegroundColor White
    Write-Host "  pm2 start agent.js --name security-agent" -ForegroundColor Yellow
    Write-Host "`nAgent will run on port $Port" -ForegroundColor White
    Write-Host "API Key: $ApiKey" -ForegroundColor White
    
    # Ask if user wants to start the agent now
    $start = Read-Host "`nStart the agent now? (y/n)"
    if ($start -eq "y" -or $start -eq "Y") {
        Write-Host "Starting security agent..." -ForegroundColor Green
        Start-Process -FilePath "node" -ArgumentList "agent.js" -WorkingDirectory $agentDir
        Write-Host "Agent started! Check http://localhost:$Port/api/system-info to verify." -ForegroundColor Green
    }
} else {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}
