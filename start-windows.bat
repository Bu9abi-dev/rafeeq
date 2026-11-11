@echo off
cd /d "%~dp0"
if not exist .env (
  copy .env.example .env >nul
  echo Put your API key in the .env file, then run this again.
  notepad .env
  pause
  exit /b
)
if not exist node_modules call npm install
start "" http://localhost:3000
npm start
pause
