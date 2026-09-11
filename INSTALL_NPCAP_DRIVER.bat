@echo off
title Wi-Fi Sentinel - Hardware Packet Driver Setup
echo ========================================================
echo   WI-FI SENTINEL - HARDWARE PACKET DRIVER SETUP
echo ========================================================
echo.
echo This installs the standard Npcap driver required for autonomous
echo Layer 2 network control (used by NetCut, Fing, and Wireshark).
echo.
echo Launching installer with Administrator privileges...
echo [!] Please click 'YES' when the Windows permission prompt appears!
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~dp0drivers\npcap-installer.exe' -ArgumentList '/winpcap_mode=yes' -Verb RunAs"
echo.
echo Setup launched. Please finish the wizard on your screen.
echo (Make sure 'Install Npcap in WinPcap API-compatible Mode' is checked).
echo.
pause
