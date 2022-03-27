@ECHO OFF

title Installing Dependencies
call npm install

title Listing Outdated Dependencies
call npm outdated

echo Creating Directories
if not exist ".\temporary" mkdir ".\temporary"

:start_program
npm run start
timeout /T 5 /NOBREAK
goto :start_program

pause
