@echo off
setlocal

rem [INPUT]: Uses cmd.exe, optional vault path argument, and the manual-palette fork's scripts/install.ps1 when present.
rem [OUTPUT]: Launches the Windows PowerShell installer with execution-policy bypass for this process only.
rem [POS]: Windows double-click and cmd wrapper for users who do not want to type PowerShell details.
rem [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md

set "LOCAL_SCRIPT=%~dp0install.ps1"
set "TEMP_SCRIPT=%TEMP%\install-axl-light.ps1"

if exist "%LOCAL_SCRIPT%" (
  set "SCRIPT=%LOCAL_SCRIPT%"
) else (
  echo Downloading Axl Light Windows installer...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/ShengLi-Wang/axl-light-manual-palette/main/scripts/install.ps1' -OutFile '%TEMP_SCRIPT%'"
  if errorlevel 1 exit /b %errorlevel%
  set "SCRIPT=%TEMP_SCRIPT%"
)

if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" "%~1"
)

exit /b %errorlevel%
