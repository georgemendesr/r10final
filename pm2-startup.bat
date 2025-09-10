@echo off
cd /d "c:\Users\George Mendes\Desktop\r10final"
pm2 start ecosystem.config.cjs
pm2 save
pause
