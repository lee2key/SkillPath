@echo off
setlocal
pushd "%~dp0"
if errorlevel 1 (
    echo Could not open the project folder.
    pause
    exit /b 1
)
call npm.cmd run release
set "build_exit=%errorlevel%"
popd
echo.
if "%build_exit%"=="0" (echo Release build completed.) else (echo Release build failed.)
pause
exit /b %build_exit%
