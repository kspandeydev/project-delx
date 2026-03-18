@echo off
git config user.email "kshitijpandeydev@gmail.com"
git config user.name "kspandeydev"
git init
git add .
git commit -m "feat: Initial commit of DELo P2P delivery app UI"
git branch -M feature-v1

echo ---
echo Attempting to push... 
echo If you get a 403 error, it's because your local git is logged in as 'kshitijpandeyt'.
echo You can try:
echo 1. Run "gh auth login" in your terminal (if you have GitHub CLI)
echo 2. Or change the remote to use a Personal Access Token:
echo    git remote set-url origin https://<YOUR_TOKEN>@github.com/kspandeydev/project-delx.git
echo ---

git remote add origin https://github.com/kspandeydev/project-delx.git 2>nul
git remote set-url origin https://github.com/kspandeydev/project-delx.git
git push -u origin feature-v1
pause

