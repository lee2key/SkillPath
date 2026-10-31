@echo off
setlocal
pushd "%~dp0"
if errorlevel 1 (
    echo Could not open the project folder.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo Node.js and npm are required to start the editor.
    echo Install Node.js, then run this file again.
    popd
    pause
    exit /b 1
)

call npm.cmd run admin
set "admin_exit=%errorlevel%"
popd
if not "%admin_exit%"=="0" pause
exit /b %admin_exit%
