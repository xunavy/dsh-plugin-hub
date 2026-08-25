@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo   DSH Plugin Hub - 拉取最新 DeepSeek Harness 插件
echo ================================================
node lib\update.mjs
echo.
pause