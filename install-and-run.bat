@echo off
cd /d "%~dp0"
echo Installing dependencies...
call "C:\Program Files\nodejs\npm.cmd" install
if errorlevel 1 exit /b 1
echo.
echo Starting dev server...
call "C:\Program Files\nodejs\npm.cmd" run dev
pause
