@echo off
set /p msg="Enter your commit message: "

echo ============================
echo   Adding all changes
echo ============================
git add .

echo ============================
echo   Committing with message: %msg%
echo ============================
git commit -m "%msg%"

echo ============================
echo       Commit completed
echo ============================
pause
