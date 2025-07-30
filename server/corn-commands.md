pm2 start cron-sender.js --name telegram-cron --interpreter node --watch
pm2 save
pm2 start imageWorker.js --name image-worker --interpreter node

ssh -L 6379:127.0.0.1:6379 root@147.93.127.34
ssh -L 3308:localhost:3306 root@147.93.127.34

pm2 start workers/telegramUploadWorker.js --name telegram-upload-worker
pm2 start workers/telegramMessageWorker.js --name telegram-message-worker
pm2 start workers/telegramChannelWorker.js --name telegram-channel-worker
pm2 start workers/telegramCronWorker.js --name telegram-cron-worker
pm2 start tele-cron.js --name telegram-cron
pm2 start workers/telegramAddUserWorker.js --name telegram-add-users-worker

15|telegra | ✅ Done in cron worker Lead ID: 933
