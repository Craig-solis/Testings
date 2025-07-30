@echo off
echo Installing Security Agent...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Create agent directory
set AGENT_DIR=%USERPROFILE%\SecurityAgent
if not exist "%AGENT_DIR%" (
    mkdir "%AGENT_DIR%"
    echo Created agent directory: %AGENT_DIR%
)

REM Copy agent.js
if exist "agent.js" (
    copy "agent.js" "%AGENT_DIR%\agent.js"
    echo Copied agent.js to %AGENT_DIR%
) else (
    echo agent.js not found in current directory
    pause
    exit /b 1
)

REM Create package.json
echo Creating package.json...
(
echo {
echo   "name": "security-agent",
echo   "version": "1.0.0",
echo   "description": "Security monitoring agent",
echo   "main": "agent.js",
echo   "scripts": {
echo     "start": "node agent.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "cors": "^2.8.5"
echo   }
echo }
) > "%AGENT_DIR%\package.json"

REM Create .env file
(
echo API_KEY=your-secret-api-key
echo PORT=5000
) > "%AGENT_DIR%\.env"

REM Install dependencies
cd /d "%AGENT_DIR%"
echo Installing dependencies...
npm install

if %errorlevel% equ 0 (
    echo.
    echo === Installation Complete ===
    echo Agent installed in: %AGENT_DIR%
    echo To start the agent:
    echo   cd "%AGENT_DIR%"
    echo   npm start
    echo.
    echo Agent will run on port 5000
    echo API Key: your-secret-api-key
    echo.
    set /p START_NOW="Start the agent now? (y/n): "
    if /i "%START_NOW%"=="y" (
        echo Starting security agent...
        start "Security Agent" cmd /k "cd /d "%AGENT_DIR%" && node agent.js"
        echo Agent started! Check http://localhost:5000/api/system-info to verify.
    )
) else (
    echo Failed to install dependencies
)

pause
