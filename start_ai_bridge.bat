@echo off
echo ========================================================
echo        HANDIVOICE PRO - STARTING AI HARDWARE BRIDGE
echo ========================================================
echo.
echo Starting Python AI Bridge (ESP32 Serial ^<--^> Random Forest ^<--^> WebSocket)...
echo Server: http://localhost:8765
echo WebSocket: ws://localhost:8765/ws
echo.

set PYTHON_EXEC=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
        set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else if exist "C:\Python314\python.exe" (
        set PYTHON_EXEC="C:\Python314\python.exe"
    )
)

%PYTHON_EXEC% PYTHON/handivoice_bridge.py
pause
