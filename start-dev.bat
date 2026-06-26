@echo off
title AI 企业数字化工作台 - 开发服务器
cd /d "E:\AI项目\ai-workspace"
echo [Dev] 启动后端服务...
start "Backend" cmd /c "cd /d ai-digital-workspace-server && npm start"
timeout /t 4 /nobreak >nul
echo [Dev] 启动前端服务...
start "Frontend" cmd /c "cd /d ai-digital-workspace-client && npm run dev"
timeout /t 6 /nobreak >nul
echo.
echo ====================================
echo  AI 企业数字化工作台 - 开发模式
echo ====================================
echo  前端: http://localhost:5173
echo  后端: http://localhost:3001
echo.
echo  按任意键关闭所有服务...
pause >nul
taskkill /f /im node.exe 2>nul
echo 已关闭。
exit
