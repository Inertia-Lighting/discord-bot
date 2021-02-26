@ECHO OFF

title Inertia Lighting Discord Bot API Server

if not exist ".\temporary" mkdir ".\temporary"

:start_bot
node .\index.js --trace-warnings
timeout /T 5 /NOBREAK
goto :start_bot

pause
