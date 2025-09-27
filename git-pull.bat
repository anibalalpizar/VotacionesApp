@echo off
echo ============================
echo   Pulling from both remotes
echo ============================

git pull origin main
git pull azure main

echo ============================
echo       Pull completed
echo ============================
pause
