@echo off
rem 可选：以本地 HTTP 服务器方式运行（与直接打开行为一致）
cd /d "%~dp0"
py -m http.server 8080 2>nul || python -m http.server 8080
