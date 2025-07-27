pm2 start cron-sender.js --name telegram-cron --interpreter node --watch
pm2 save
pm2 start imageWorker.js --name image-worker --interpreter node

ssh -L 6379:127.0.0.1:6379 root@147.93.127.34
ssh -L 3308:localhost:3306 root@147.93.127.34
