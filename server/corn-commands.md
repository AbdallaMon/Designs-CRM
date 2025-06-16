pm2 start cron-sender.js --name telegram-cron --interpreter node --watch
pm2 save

ssh -L 6379:127.0.0.1:6379 root@147.93.127.34
