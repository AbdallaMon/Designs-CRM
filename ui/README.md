21 - button to download notes,files ,and call reminders for each lead
28- allow admin to change status from leads/{id}
29- generate metadata
25- file limit 50mb
9- reports page
19- report page staff conversion rate , success rate , filter by emirates
24- render user attachment
27- fix error after searching for a staff in the notifications
23- search by email
26- font from their website
30- user name
15 - عروض الأسعار فيها اضافة فايلات ايضا
36 - logo animation
31 - No automatic
34 - arabic in pdf
36 - upload functionality
37 - delete temp file
32 - Today statics for each user
39 - lead card date(assigned at)
38 - filter leads by user
33 - import via excel
36- start end date deals
37- ban a user
35 - check reports
38- search by client in deals
39- dates
40- leads
41- commission 5%
42- حساب البنك
43- سعر المتر
اضافة اجزاء من قبل الادمن
فتح الايميلات علي الجيميل
حابب ضيف معلومات اضافية
44- client enter data one time per day
commission 5 %
remove final price
plan
pays

- Upcomming call reminders
- Interior design instead of design
- Remove sorry from outside emirates
- Redirect to consult page directly
- 300 : 400 and
- less than 300 instead of less than 400
- call reminder time
- call reminders colors and arrangments
- whatsapp button for the staff,email too
- country code for outside emirates
- خورفقان as emirate
- Courses and store cards
- Chat button(whats app)
- best time to contact
- when back to consult still redirecting
- More than one file upload
- Optioanl file name and description
- Search by name or phone
- Remove from pdf the final price
- Note with discount

- Email Image
- make it pages (to enhance the back functioanlity)

- Number of leads (maximux for each staff by admin)
- To check when last staff logged in and when not logged in

ALTER TABLE User
ADD COLUMN lastSeenAt DATETIME NULL,
ADD COLUMN maxLeadsCounts INT NULL;

1- مرحلة التواصل مع العميل
2- رسم المخططات المبدائية
3- تصميم ثري دي
4- موافقه الثري دي
بعد الثري دي ينتقل لموظف اخر
1- رسم مخطط دروب شوبينج
2- تم التسليم
عند التسليم شو دفع العميل واسمه موقعه وتاريخ الدفع وهل متبقي دفع عدد الدفعات هل سيتدفع مره اخري لم يتم استلام الدفعه

dJkmjERCZGCEgaxl
root@dreamstudiio:~# sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
