@ECHO OFF

title Main Inertia Server Under Development

if not exist ".\temporary" mkdir ".\temporary"

:start_bot
node .\index.js --trace-warnings
timeout /T 5 /NOBREAK
goto :start_bot

pause
