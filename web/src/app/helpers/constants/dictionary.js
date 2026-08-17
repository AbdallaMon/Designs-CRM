import { PAGE_INFO_TYPES, SALES_STAGE_TYPES } from "@dms/shared";

export const NotificationType = {
  NEW_LEAD: "New Lead",
  LEAD_ASSIGNED: "Lead Assigned",
  LEAD_STATUS_CHANGED: "Lead Status Changed",
  MY_DAY_DIGEST: "Morning Brief",
  LEAD_TRANSFERRED: "Lead Transferred",
  LEAD_UPDATED: "Lead Updated",
  LEAD_CONTACT: "Lead Contact",
  NOTE_ADDED: "Note Added",
  NEW_NOTE: "New Note",
  NEW_FILE: "New File",
  CALL_REMINDER_CREATED: "Call Reminder Created",
  CALL_REMINDER_STATUS: "Call Reminder Status",
  PRICE_OFFER_SUBMITTED: "Price Offer Submitted",
  PRICE_OFFER_UPDATED: "Price Offer Updated",
  FINAL_PRICE_ADDED: "Final Price Added",
  FINAL_PRICE_CHANGED: "Final Price Changed",
  OTHER: "Other",
};

export const dictionary = {
  Consultation: "استشارة",
  Design: "تصميم",
  "Interior design": "تصميم داخلي",
  "How can we serve you?": "كيف يمكننا مساعدتك؟",
  "Choose from options": "اختر من الخيارات",
  "Complete your register": "اكمل بياناتك للتسجيل",
  Room: "غرفة",
  Plan: "مخطط",
  "City Visit": "زيارة ميدانية",
  Apartment: "شقة",
  "Construction Villa": "فيلا مسكونة",
  "Villa Under Construction": "فيلا تحت الإنشاء",
  "Part of Home": "جزء من المنزل",
  Commercial: "تجاري",
  "29 dollars – fully deducted upon contracting.":
    "٢٩ دولار تُخصم بالكامل عند التعاقد",
  "Book Now 29 DOLLAR": "احجز الان ٢٩ دولار",

  "Success!": "نجاح!",
  "Your time and ours is valuable, which is why this appointment is reserved for serious clients with a small symbolic fee that will be fully deducted upon signing a contract.":
    "وقتك ووقتنا ثمين، ولهذا الحجز مخصص للعملاء الجادين بمبلغ رمزي بسيط يُخصم بالكامل عند التعاقد",
  // Emirates
  "Out side emirates": "خارج الإمارات",
  Dubai: "دبي",
  "Abu Dhabi": "أبو ظبي",
  Sharjah: "الشارقة",
  Ajman: "عجمان",
  "Umm Al Quwain": "أم القيوين",
  "Ras Al Khaimah": "رأس الخيمة",
  Fujairah: "الفجيرة",
  "Khor Fakkan": "خورفكان",
  // Price Ranges

  //   "400,000 AED or less": "أقل من  400,000 درهم اماراتي",
  "300,000 AED or less": "أقل من  300,000 درهم اماراتي",
  "300,000 to 400,000 AED": "من 300,000 إلى 400,000  درهم اماراتي",
  "400,000 to 600,000 AED": "من 400,000 إلى 600,000  درهم اماراتي",
  "600,000 to 800,000 AED": "من 600,000 إلى 800,000 درهم اماراتي",
  "800,000 AED and above": "اكثر من 800,000 درهم اماراتي",
  "25,000 AED or less": "أقل من 25,000 درهم اماراتي",
  "25,000 to 45,000 AED": "من 25,000 إلى 45,000 درهم اماراتي",
  "45,000 to 65,000 AED": "من 45,000 إلى 65,000 درهم اماراتي",
  "65,000 to 85,000 AED": "من 65,000 إلى 85,000 درهم اماراتي",
  "85,000 AED and above": "اكثر من 85,000 درهم اماراتي",
  // Additional phrases
  "Please fill all the fields.": "يرجى ملء جميع الحقول.",
  "Minimum price cannot be greater than maximum price.":
    "لا يمكن أن يكون الحد الأدنى للسعر أكبر من الحد الأقصى للسعر.",
  "Uploading file": "جارٍ تحميل الملف",
  Submitting: "جارٍ الإرسال",
  "Complete Your Request": "أكمل طلبك",
  Name: "الاسم",
  Phone: "الهاتف",
  "Select Location": "اختر الموقع",
  "Price Range": "نطاق السعر",
  Min: "الحد الأدنى",
  Max: "الحد الأقصى",
  "Add an attachment": "أضف مرفقًا",
  Submit: "تسجيل",
  "Submit Now": "سجل الأن",
  "Book a meeting": "احجز اجتماع",
  "With eng ahmed": "مع م.أحمد المبيض",
  "Planning - Design - Implementation - Consulting":
    "تخطيط - تصميم - تنفيذ - استشارات",
  Success: "تم بنجاح!",
  "Thank you for your submission. We will contact you soon.":
    "شكرًا لك على تقديم طلبك. سنتواصل معك قريبًا.",
  "You got a 10% discount!": "لقد حصلت على خصم 10٪",
  "Sorry!": "عذرًا!",
  Budget: "الميزانية",
  "We do not provide services outside the UAE.":
    "نحن لا نقدم خدمات خارج الإمارات العربية المتحدة.",
  "We do not provide services outside the UAE, But we will contact you soon.":
    "نحن لا نقدم خدمات خارج الإمارات العربية المتحدة, لكن سنتواصل معك قريبا.",
  "Add an attachment (optional)": "اضف مرفقا (اختياري)",
  "Date of birth": "تاريخ الميلاد",
  Email: "البريد الالكتروني",
  "Select a price ranges": "اختر نطاق سعر",
  "Inside UAE": "داخل الامارات",
  "Out side UAE": "خارج الامارات",
  "How much would you like to invest in your dream home?":
    "كم حابب تستثمر في منزل احلامك؟",
  "Additional information (optional)": "معلومات اضافية (اختياري)",
  "Choose a time to contact you? (optional)":
    "اختيار وقت للتواصل معك (اختياري)",
  Country: "الدولة",
  "Invalid phone": "رقم الهاتف غير صحيح",
  Courses: "الدورات",
  "Engineers courses": "دورات للمهندسين",
  Books: "الكتب",
  Store: "المتجر",
  "Coming Soon": "سيتوفر قريبًا",
  "Choose a time between 10 AM to 7 PM.":
    "اختر وقت بين الساعة 10 صباحًا و 7 مساءً.",
  "Book Your Consultation": "احجز استشارتك",
  "Make your home your personal brand": "اجعل منزلك براندك الخاص",
  "You're just one step away from starting your project!":
    "خطوة واحدة تفصلنا عن بدء العمل على مشروعك!",
};

export const MediaType = {
  IMAGE: "Image",
  VIDEO: "Video",
};

export const PageInfoType = {
  BEFORE_PATTERN: PAGE_INFO_TYPES.BEFORE_PATTERN,
  BEFORE_MATERIAL: PAGE_INFO_TYPES.BEFORE_MATERIAL,
  BEFORE_STYLE: PAGE_INFO_TYPES.BEFORE_STYLE,
};

export const personalityEnum = {
  EXPRESSIVE: "ثرثار / اجتماعي",
  ANALYTICAL: "التحليلي الدقيق",
  INTROVERTED: "المنطوي / المتحفظ",
  DRIVER: "القيادي الحاسم",
};

export const meetingTypes = [
  { value: "SALES_MEETING", label: "Sales meeting" },
  { value: "DESIGN_MEETING", label: "Design consultant meeting" },
];

export const salesStageEnum = [
  { key: SALES_STAGE_TYPES.NOT_INITIATED, label: "لم يبدأ بعد", color: "#f5f5f5" },
  { key: SALES_STAGE_TYPES.INITIAL_CONTACT, label: "اتصال مبدائي بالعميل", color: "#e3f2fd" },
  {
    key: SALES_STAGE_TYPES.SOCIAL_MEDIA_CHECK,
    label: "محاولة الحصول علي احد صفحات شخصية للعميل من خلال سوشيال ميديا",
    color: "#e8f5e8",
  },
  {
    key: SALES_STAGE_TYPES.WHATSAPP_QA,
    label: "اجابة عن اسئلة العميل من خلال واتس اب",
    color: "#fff3e0",
  },
  {
    key: SALES_STAGE_TYPES.MEETING_BOOKED,
    label: "حجز اجتماع مع العميل لشرحة الية العمل واستخدام اسلوب SPIN",
    color: "#fce4ec",
  },
  {
    key: SALES_STAGE_TYPES.CLIENT_INFO_UPLOADED,
    label: "رفع ملفات وملخص اجوبة العميل علي السيستم",
    color: "#f3e5f5",
  },
  {
    key: SALES_STAGE_TYPES.CONSULTATION_BOOKED,
    label: "حجز موعد مع استشاري تصميم",
    color: "#e0f2f1",
  },
  {
    key: SALES_STAGE_TYPES.FOLLOWUP_AFTER_MEETING,
    label: "تواصل مع العميل بعد الاجتماع",
    color: "#fff8e1",
  },
  {
    key: SALES_STAGE_TYPES.HANDLE_OBJECTIONS,
    label: "تعامل مع اعتراضات العميل",
    color: "#ffebee",
  },
  { key: SALES_STAGE_TYPES.DEAL_CLOSED, label: "اغلاق الصفقة", color: "#e8f5e8" },
  {
    key: SALES_STAGE_TYPES.AFTER_SALES_FOLLOWUP,
    label: "متابعة العميل ما بعد البيع",
    color: "#e3f2fd",
  },
];

export const FAB_QUESTIONS_WITH_ANSWERS_AR = {
  "هل في بيت او فندق دخلته وحسيت حالك مرتاح فيه ؟":
    "هاد الشعور هو تمامًا اللي بنشتغل عليه… راحة ما بتعرف سببها، بس بتحسها بكل زاوية.",
  "من وين عم تأخذ الهامك وافكارك لتصميم البيت":
    "حلو… من هون بنقدر نبلّش نكوّن ستايل خاص فيك، مو مجرد تجميع صور.",
  "في حدا عم يساعدك في اتخاذ القرار ولا الأمر بالكامل عندك":
    "ممتاز، هيك منقدر نراعي كل الآراء من البداية، ويصير القرار النهائي سلس ومريح.",
  "شو اكتر غرفة او مساحة حاسسها تمام حاليا":
    "واضح إن فيها شي مريح لإلك… منقدر نحلل شو السبب ونكرره بباقي المساحات.",
  "شو اكثر غرفة حاسس بدها إعادة نظر":
    'تمام… الغرف يلي بتحس فيها شي "مش مريح" هي أول شي بنبدأ فيه، ونحلّها بدون ما تغيّر هويتك.',
  "هل حاسس مساحاتك مش مستغلة بشكل كويس":
    "فعليًا أغلب البيوت الجديدة بيصير فيها هالشي… بس لما كل متر يكون محسوب، بتحس كأنك زدت مساحة بدون ما تبني زيادة",
  "هل لك تجربة سابقة بالتصميم وبالتنفيذ وكيف كانت كمية التطابق ؟":
    "دائما تصميم بينعمل وأول خطوة منفكر فيها هيي التنفيذ بحيث يتطابق معاه ويطلع بالنهاية نفس تصميم",
  "لو تركنا الوضع على ما هو كيف ممكن يأثر عليك":
    "بنشتغل على توزيع مدروس بيمنع أخطاء ما بتنشاف إلا بعد التنفيذ بتتجنّب ترميم وتعديلات مكلفة",
  "برأيك لو ما انتبهنا لتوزيع الكهرباء والسباكة بشكل مثل فنادق هل ح يأثر على راحتكم ؟":
    "نحنا منوزّع الكهربا والسباكة حسب استخدامك الفعلي… هيك كل نقطة بتخدمك صح، وبتتفادى الإزعاجات اليومية يلي الناس ما بتنتبه إلها إلا بعد ما تسكن.",
  "لو صار كل البيت مثل غرفة ../يلي ذكرها ب البند 4 خانة الوضع الحالي / هل رح تشعر ب راحة اكبر ؟":
    "نحنا منحلل شو خلاك ترتاح بهالغرفة… ومنكرّر نفس التوازن بباقي البيت، لتصير كل زاوية فيها إحساس مريح ومتناسق",
  "اذا اشتغل معك فريق فاهم وعندك خطة واضحة من البداية للنهاية,كيف بتحس راح يكون الموضوع؟":
    "ومع فريق فاهم وخطة واضحة… بتكون فعليًا بلّشت أول خطوة صحيحة. اجتماعك الجاي مع مستشار التصميم هو اللحظة يلي بيتحوّل فيها كل شي بخيالك لخطة حقيقية نبدأ فيها سوا",
};
