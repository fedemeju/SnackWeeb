@echo off
cd /d "%~dp0"
npx --yes http-server -p 8744 -c-1
