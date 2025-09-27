@echo off
echo ============================
echo   Pushing to both remotes
echo ============================

git push origin main
git push azure main

echo ============================
echo       Push completed
echo ============================
pause
