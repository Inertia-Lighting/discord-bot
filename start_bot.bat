@ECHO OFF

title Installing Dependencies
call npm install

title Listing Outdated Dependencies
call npm outdated

echo Creating Directories
if not exist ".\temporary" mkdir ".\temporary"

:start_program
title Inertia Lighting Discord Bot API Server TEST
echo Starting Discord Bot API Server
node --trace-warnings .\index.js
timeout /T 5 /NOBREAK
goto :start_program

pause
