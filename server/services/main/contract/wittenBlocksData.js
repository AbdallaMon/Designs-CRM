// wittenBlocksData.js  (only the requested edits)
export const FIXED_TEXT = {
  titles: {
    partyOne: {
      ar: `الفريق الأول: المالك أو وكيله`,
      en: "Party One: The Owner or Authorized Representative",
    },
    amounts: { ar: `تكلفة التصميم`, en: "Design Cost" },
    includesStages: {
      ar: `يشمل هذا الاتفاق المراحل`,
      en: "This agreement includes the stages",
    },
    payments: { ar: `جدول الدفعات`, en: "Payment Schedule" },
    allStagesMatrix: { ar: `جدول المراحل`, en: "Stages Table" },
    drawings: { ar: `مساحات العمل)المخططات(`, en: "Work Areas (Drawings)" },
    confirmation: { ar: `إقرار الموافقة`, en: "Acknowledgement" },
  },
  currencyAED: { ar: `درهم إماراتي`, en: "AED" },
  confirmationLabel: {
    ar: `أقرّ بأنني قرأت جميع البنود وأوافق عليها`,
    en: "I confirm that I have read and agree to all terms",
  },
  todayWritten: {
    ar: (d) => `تاريخ كتابة العقد: ${d}`,
    en: (d) => `Contract written on: ${d}`,
  },
};

export const OBLIGATIONS_TEXT = {
  partyOne: {
    ar: {
      base:
        `التــــزامات الفـــــــريق الأول:\n` +
        `1) يتعهد الفريق الأول بتوفير كافة المخططات أو المعلومات المتعلقة بأعمال التصميم.\n` +
        `2) يتعهد الفريق الأول بدفع كامل المبلغ المتفق عليه حسب تكلفة التصميم، وذلك وفق جدول دفعات العقد التالي.`,
    },
    en: {
      base:
        "Obligations of Party One:\n" +
        "1) Provide all drawings and information related to the design works.\n" +
        "2) Pay the full agreed amount according to the following contract payment schedule.",
    },
  },
  partyTwo: {
    ar:
      `التــــزامات الفـــــــريق الثــاني:\n` +
      ` يتعهد الفريق الثاني بتسليم كافة المخططات والصور والمتطلبات التصميمية اللازمة حسب الأصول.\n` +
      ` يتم تنفيذ الأعمال ضمن إطار الشركة في المراحل الثانية والثالثة والرابعة والخامسة.\n` +
      ` إذا تم اعتماد توزيع المساحات في المرحلة الثانية فلا يحق تعديل التوزيع عند بدء المرحلة الثالثة أو بعدها إلا بعقد جديد.\n` +
      ` عند تحويل التصميم إلي قسم المخططات يُلغي بند التعديلات تلقائيًا وأي تعديلات لاحقة تكون بتكلفة إضافية.`,
    en:
      "Obligations of Party Two:\n" +
      " Deliver all required drawings, visuals, and design deliverables as per standards.\n" +
      " Work is executed within the company framework across stages 2–5.\n" +
      " Once space layouts are approved in Stage 2, changes in Stage 3 or later require a new contract.\n" +
      " After transfer to the drawings department, the revisions entitlement is void; further changes are chargeable.",
  },
};

// ====== UPDATED with your exact Arabic clauses ======
export const STAGE_CLAUSES_DEFAULT = {
  1: {
    ar:
      `تعريف: تعتبر المرحلة الاولي اجتماع اولي بين الشركة والمالك لتحديد الاحتياجات ودراسة الافكار والمقترحات وتعتبر مرجع اساسي للمراحل القادمة و يتم عقد الاجتماع من خلال الحضور الي المكتب او اونلاين ) جوجل ميت او غيرها من الخدمات (\n` +
      ` في حال توقيع العقد يقدم نموذج يتم تعبئته من قبل المالك لتحديد صلاحيات التعديلات المطلوبة في المراحل القادمة.`,
    en: "Definition: Stage 1 is an initial meeting between the company and the owner to identify needs and proposals; it becomes the reference for subsequent stages. Meeting in-office or online. • Upon signing, a form is provided to define revision permissions for later stages.",
  },
  2: {
    ar:
      `تعريف: يتم من خلالها تطبيق الافكار المقترحة خلال الاجتماع في المرحلة الاولي علي المساحات المشمولة في العقد وبناءا علي الصلاحيات المحددة في النموذج الموقع سابقا يتم من خلالها دراسة المساحات وتوزيع الاثاث و توزيع الكهرباء  سوكيت فقط توزيع الخدمات و الحمامات و حل كافة المشاكل الموجودة بالمخطط الذي تم استلامه من قبل المالك\n` +
      `مكونات المرحلة:\n` +
      `                  تطبيق الافكار المعتمدة خلال المرحلة الاولي\n` +
      `                  اجتماع لمناقشة الافكار التي تم تطبيقها علي المخططات\n` +
      `                  في حال وجود تعديلات يتم تعديل التعديلات\n` +
      `                  اجتماع نهائي لمناقشة التعديلات المطلوبة وانهاء المرحلة الثانية\n` +
      `                  اي اجتماعات جديدة او تعديلات اضافية تكون بتكلفة اضافية\n` +
      `بنود المرحلة:\n` +
      ` تعتبر الملفات المستلمة من المالك هي مرجع اساسي واي اخطاء او نقص بالمعلومات الشركة لا تتحمل اي مسؤولية نتيجة ذلك. واي تعديلات تحدث نتيجة ذلك تكون بتكلفة اضافية.\n` +
      ` يتعهد الفريق الثاني بتسليم اعمال المرحلة الثانية  بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة.  تشمل فقط ايام الدوام الرسمي. لا يشمل مدة اعمال التعديلات.\n` +
      ` في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n` +
      ` في حال تاخر الفريق الاول  عن الرد علي استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n` +
      ` في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال التصميم والتسليم.\n` +
      ` يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n` +
      ` يسمح بتعديل واحد فقط من قبل العميل.\n` +
      ` * في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n` +
      ` في حال تم الاعتماد وعدم طلب تعديلات  خلال اجتماع المناقشة يتم انهاء المرحلة الثانية.\n` +
      ` التسليم النهائي هو ملفات بصيغة بي دي اف .`,
    en: "Definition: Apply Stage-1 ideas to the areas covered by the contract within defined permissions; 2D study, furniture layout, sockets, services, bathrooms, and fixes to owner-provided plan. Components: apply ideas, discussion meeting, perform edits if needed, final meeting; any extra meetings/edits are chargeable. Terms: owner files are the reference; delivery cap from start (workdays; excludes revisions), responses and payments affect timing; communication via email/WhatsApp; one revision; final delivery PDF.",
  },
  3: {
    ar:
      `تعريف: تشمل اعمال تصميم الديكور حسب الستايل المحدد من قبل المالك ومتابعة فريق التصميم يشمل تنفيذ الافكار المقترحة بالتصميم واظهارها بالتصميم ثلاثي الابعاد.\n` +
      `مكونات المرحلة:\n` +
      `                  تحديد ستايل التصميم .\n` +
      `                  بدء اعمال التصميم من قبل فريق العمل  .\n` +
      `                  اجتماع يتم من خلاله تقديم التصميم للمالك سواء الحضور بالمكتب او اونلاين .\n` +
      `                  احقية تصميم وتعديلان علي التصميم.\n` +
      `                  انهاء الاعمال والانتقال الي المرحلة النهائية.\n` +
      `بنود المرحلة:\n` +
      ` تعتبر الملفات المستلمة من المالك هي مرجع اساسي واي اخطاء او نقص بالمعلومات الشركة لا تتحمل اي مسؤولية نتيجة ذلك. واي تعديلات تحدث نتيجة ذلك تكون بتكلفة اضافية.\n` +
      ` يتعهد الفريق الثاني بتسليم اعمال المرحلة الثالثه بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة.  تشمل فقط ايام الدوام الرسمي . لا يشمل مدة اعمال التعديلات.\n` +
      ` في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n` +
      ` في حال تاخر الفريق الاول  عن الرد علي استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n` +
      ` في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال التصميم والتسليم.\n` +
      ` يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n` +
      ` يسمح بتعديلان  فقط من قبل العميل.\n` +
      ` * في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n` +
      ` في حال تم الاعتماد وعدم طلب تعديلات  خلال اجتماع المناقشة يتم انهاء المرحلة الثالثة.\n` +
      ` التسليم النهائي هو ملفات بصيغة PDF .`,
    en: "Definition: Interior design per selected style with 3D visuals. Components: style selection, design start, presentation meeting, two revisions right, finish and move to final stage. Terms as provided in Arabic.",
  },
  4: {
    ar:
      `تعريف: بدء اعمال تجهيز المخططات التفصيلية للمشروع تشمل كافة الاعمال العقد الموقع وفي حال بدء هذه المرحلة لا يحق طلب اي تعديلات علي التصميم الاساسي او التوزيع.\n` +
      `بنود المرحلة:\n` +
      ` يتعهد الفريق الثاني بتسليم اعمال المرحلة الثانية  بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة.  تشمل فقط ايام الدوام الرسمي . لا يشمل مدة اعمال التعديلات.\n` +
      ` في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n` +
      ` في حال تاخر الفريق الاول  عن الرد علي استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n` +
      ` في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال االمخططات والتسليم.\n` +
      ` يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n` +
      `  في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n` +
      ` عند الانتقال الي مرحلة المخططات النهائية لا يحق اجراء اي تعديل علي التصميم المعتمد.\n` +
      ` التسليم النهائي هو ملفات بصيغة PDF .\n` +
      ` يتم تسليم المخططات بنسخة PDF  فقط وفي حال طلب نسخ اضافية بصيغ اخرى قد يطلب تكلفة اضافية.`,
    en: "Definition: Begin detailed drawings; no changes to base design/layout once started. Terms as provided in Arabic.",
  },
  5: {
    ar:
      `تعريف: بدء حساب الكميات وتحديد المواصفات والاسعار الخاصة بالمشروع\n` +
      `بنود المرحلة:\n` +
      ` يتعهد الفريق الثاني بتسليم اعمال المرحلة الثانية  بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة.  تشمل فقط ايام الدوام الرسمي . لا يشمل مدة اعمال التعديلات.\n` +
      ` في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n` +
      ` يتم تحديد المواصفات حسب السوق الاماراتي فقط .\n` +
      ` تحديد الاسعار فقط للمشاريع الخاصة بالامارات.\n` +
      ` قد تختلف الكميات من شركة لاخري سحب طرق الحساب المعتمدة حسب كل بند .\n` +
      ` في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n` +
      ` في حال تاخر الفريق الاول  عن الرد علي استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n` +
      ` في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال االمخططات والتسليم.\n` +
      ` يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n` +
      `  في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n` +
      ` عند الانتقال الي مرحلة المخططات النهائية لا يحق اجراء اي تعديل علي التصميم المعتمد.\n` +
      ` التسليم النهائي هو ملفات بصيغة PDF .\n` +
      ` يتم تسليم المخططات بنسخة PDF  فقط وفي حال طلب نسخ اضافية بصيغ اخرى قد يطلب تكلفة اضافية.`,
    en: "Definition: BOQ/specs/pricing; UAE market/specs scope; terms as provided in Arabic.",
  },
  6: {
    ar:
      `تعريف: مرحلة البدء باعمال التنفيذ بعد توقيع عقد التنفيذ المفصل  \n` +
      ` هذه المرحلة لها عقد منفصل .`,
    en: "Definition: Execution stage after signing a separate detailed execution contract (separate agreement).",
  },
};

export const HANDWRITTEN_SPECIAL_CLAUSES = {
  ar: [
    `موعد التسليم المجمل للاعمال ..... يوم من تاريخ استلام الدفعة الاولي لا يشمل ايام التعديلات او التاخير الذي يحصل من طرف المالك في اي مرحلة من مراحل العمل.`,
    `في حالة فسخ العقد قبل البدء باي اعمال تخص الطرف الاول يتم ارجاع 50 % من قيمة الدفعة الاولي .`,
    `اي مخططات اضافيه يطلبها الفريق الاول تكون بتكلفة اضافيه يحددها قسم المحاسبه للشركه.`,
    `في حالة فسخ الاتفاق بعد البدء بأي اعمال تخص الطرف الاول  تعتبر الدفعة الأولى غير مستردة ولا يحق المطالبة بها.`,
    `يتوجب حضور الفريق الأول لمناقشة  تفاصيل المشروع في المكتب او اي وسيله رسميه للتواصل.`,
    `تتم المطالبات المالية من خلال محاسب الشركه او من خلال ممثل الشركه فقط .`,
    `يحق للفريق الثاني مشاركه كافه اعمال التصميم علي وسائل التواصل الخاصه بالشركه او اي وسيله اعلاميه وفي حال رفض الفريق الاول ذلك يتم زيادة 20٪ علي قيمه المبلغ الاساسي لاعمال التصميم وتدفع خلال الدفعه الاولي.`,
    `تنتهي صلاحية هذه الاتفاقية بعد  تسليم المخططات النهائية الي الطرف الاول ولا يجوز طلب تعديلات او اضافات علي المشروع الا بعقد جديد.`,
    `لطلب اي معلومات او استشارات او تفاصيل عن المشروع اثناء مرحلة التنفيذ يتم من خلال اتفاقية جديدة يندرج تحت مسمى الاشراف الهندسي او الاستشرات الهندسيه`,
    `في حال تم تسليم اعمال التصميم ولم نتلقى رد من العميل  خلال مدة 20 يوم من تسليم التصميم يتحول المشروع  لمرحلة المخططات تلقائيا  ويفقد المالك احقية التعديلات واي مستحقات مالية تخص المرحلة يكون العميل مطالب فيها`,
    `في حال تأخر العميل عن سداد أي دفعة لأكثر من 30 يوما من تاريخ الاستحقاق، يحق للشركة اتخاذ الاجراءيت التاليين:\n• الغاء أي خصم تم منحه مسبقا ضمن الاتفاق\n• إعادة احتساب قيمة الخصم بما يتناسب مع مدة التأخير، واعتبار الخصم غير ساري جزئياً او كلياً وفقاً لتقدير الشركة`,
  ],
  en: [
    "The overall project delivery time is ..... days from the date of receipt of the first payment. This does not include revision days or any delays caused by the owner at any stage of the works.",
    "If the contract is terminated before any work by Party One has commenced, 50% of the first payment shall be refunded.",
    "Any additional drawings requested by Party One shall incur extra charges as determined by the company's accounting department.",
    "If the agreement is terminated after any work by Party One has begun, the first payment shall be non-refundable.",
    "Party One is required to attend discussions regarding project details at the office or via an official communication channel.",
    "Financial claims shall be handled only through the company's accountant or an authorized company representative.",
    "Party Two has the right to share all design works on the company's social media or any media outlet. If Party One objects to this, a 20% surcharge on the base design fee shall be applied and paid with the first payment.",
    "This agreement expires upon delivery of the final drawings to Party One, and no modifications or additions to the project may be requested except under a new contract.",
    "Any requests for information, consultations, or project details during the execution phase shall be governed by a new agreement under the title 'Engineering Supervision' or 'Engineering Consultations'.",
    "If the design deliverables are submitted and the client does not respond within 20 days of delivery, the project will automatically proceed to the drawings phase, the owner will forfeit the right to revisions, and the client will remain liable for any financial dues related to that phase.",
    "If the client delays payment of any installment for more than 30 days from the due date, the company shall be entitled to take the following measures:\n• Cancel any discount previously granted under the agreement.\n• Recalculate the discount value proportionate to the duration of the delay, and consider the discount partially or fully void at the company's discretion.",
  ],
};

export const PAYMENT_ORDINAL = {
  ar: [
    null,
    `دفعه أولي`,
    `دفعه ثانية`,
    `دفعة ثالثة`,
    `دفعة رابعة`,
    `دفعة خامسة`,
    `دفعة سادسة`,
    `دفعة سابعة`,
    `دفعة ثامنة`,
    `دفعة تاسعة`,
    `دفعة عاشرة`,
    `دفعة حادية عشرة`,
    `دفعة ثانية عشرة`,
    `دفعة ثالثة عشرة`,
    `دفعة رابعة عشرة`,
    `دفعة خامسة عشرة`,
    `دفعة سادسة عشرة`,
    `دفعة سابعة عشرة`,
    `دفعة ثامنة عشرة`,
    `دفعة تاسعة عشرة`,
    `دفعة عشرون`,
  ],
  en: [
    null,
    "First payment",
    "Second payment",
    "Third payment",
    "Fourth payment",
    "Fifth payment",
    "Sixth payment",
    "Seventh payment",
    "Eighth payment",
    "Ninth payment",
    "Tenth payment",
    "Eleventh payment",
    "Twelfth payment",
    "Thirteenth payment",
    "Fourteenth payment",
    "Fifteenth payment",
    "Sixteenth payment",
    "Seventeenth payment",
    "Eighteenth payment",
    "Nineteenth payment",
    "Twentieth payment",
  ],
};

export const defaultStageLabels = {
  1: { ar: `اجتماع أولي`, en: "Initial Meeting" },
  2: { ar: `تخطيط المساحات`, en: "2D Study" },
  3: { ar: `تصميم ثلاثي الأبعاد`, en: "3D Design" },
  4: { ar: `مخططات تنفيذية`, en: "Working Drawings" },
  5: { ar: `حساب كميات وأسعار`, en: "BOQ & Specs" },
  6: { ar: `تنفيذ`, en: "Execution" },
};

export const STAGE_PROGRESS = {
  1: {
    ar: [`اجتماع أولي لتحديد الاحتياجات والأفكار للمراحل القادمة`],
    en: ["Kick-off meeting to capture needs and ideas for next stages"],
  },
  2: {
    ar: [
      `تطبيق الأفكار المعتمدة`,
      `اجتماع مناقشة`,
      `إجراء التعديلات إن وجدت`,
      `اجتماع نهائي للمرحلة`,
    ],
    en: [
      "Apply approved ideas",
      "Discussion meeting",
      "Implement edits if any",
      "Final meeting for the stage",
    ],
  },
  3: {
    ar: [
      `تحديد ستايل التصميم`,
      `بدء أعمال التصميم`,
      `اجتماع تقديم التصميم`,
      `تعديل 1 إن وجد`,
      `تعديل 2 إن وجد`,
      `انتهاء أعمال تطبيق الأفكار`,
      `اجتماع مناقشة`,
      `تعديلات إن وجدت`,
      `اجتماع نهائي`,
    ],
    en: [
      "Select style",
      "Start design work",
      "Design presentation meeting",
      "Revision 1 if needed",
      "Revision 2 if needed",
      "Finalize design ideas application",
      "Discussion meeting",
      "Further edits if any",
      "Final meeting",
    ],
  },
  4: {
    ar: [
      `بدء أعمال تجهيز المخططات التفصيلية تشمل كافة الأعمال حسب العقد`,
      `لا يحق طلب تعديلات علي التصميم الأساسي أو التوزيع بعد البدء`,
    ],
    en: [
      "Start detailed working drawings for all agreed scopes",
      "No changes to base design/layout once started",
    ],
  },
  5: {
    ar: [
      `بدء حساب الكميات`,
      `تحديد المواصفات الخاصة بالمشروع`,
      `تسعير بنطاق الإمارات`,
    ],
    en: [
      "Start quantities take-off",
      "Define project specifications",
      "Pricing (UAE scope)",
    ],
  },
  6: {
    ar: [`بدء أعمال التنفيذ عقد منفصل`],
    en: ["Begin execution works (separate contract)"],
  },
  7: {
    ar: [
      `تحديد ستايل التصميم`,
      `بدء أعمال التصميم`,
      `اجتماع تقديم التصميم`,
      `تعديل 1 إن وجد`,
      `تعديل 2 إن وجد`,
      `انتهاء أعمال تطبيق الأفكار`,
      `اجتماع مناقشة`,
      `تعديلات إن وجدت`,
      `اجتماع نهائي`,
    ],
    en: [
      "Select style",
      "Start design work",
      "Design presentation meeting",
      "Revision 1 if needed",
      "Revision 2 if needed",
      "Finalize design ideas application",
      "Discussion meeting",
      "Further edits if any",
      "Final meeting",
    ],
  },
};

export const CONTRACT_LEVELSENUM = [
  {
    enum: "LEVEL_1",
    label: "تحليل وتقييم",
    labelAr: "تحليل وتقييم",
    labelEn: "Analysis & Assessment",
  },
  {
    enum: "LEVEL_2",
    label: "تخطيط المساحات",
    labelAr: "تخطيط المساحات",
    labelEn: "Space Planning",
  },
  {
    enum: "LEVEL_3",
    label: "تصميم ثري دي",
    labelAr: "تصميم ثري دي",
    labelEn: "3D Design",
  },
  {
    enum: "LEVEL_4",
    label: "مخططات تنفيذية",
    labelAr: "مخططات تنفيذية",
    labelEn: "Working Drawings",
  },
  {
    enum: "LEVEL_5",
    label: "حساب كميات واسعار",
    labelAr: "حساب كميات واسعار",
    labelEn: "BOQ & Pricing",
  },
  { enum: "LEVEL_6", label: "تنفيذ", labelAr: "تنفيذ", labelEn: "Execution" },
  { enum: "LEVEL_7", label: "تسويق", labelAr: "تسويق", labelEn: "Marketing" },
];

export const STAGE_STATUS_LABEL = {
  ar: {
    NOT_STARTED: `لم يبدأ`,
    IN_PROGRESS: `قيد التنفيذ`,
    COMPLETED: `تم الإنجاز`,
  },
  en: {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
  },
};

export const STAGE_STATUS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export const PAYMENT_STATUS_AR = {
  NOT_DUE: `غير مستحق`,
  DUE: `مستحق`,
  RECEIVED: `تم الاستلام`,
  TRANSFERRED: `تم التحويل`,
};

export const UAE_LABEL = {
  ar: `الإمارات العربية المتحدة`,
  en: "United Arab Emirates",
};
export const EMIRATE_LABEL = {
  ar: {
    DUBAI: `دبي`,
    ABU_DHABI: `أبوظبي`,
    SHARJAH: `الشارقة`,
    AJMAN: `عجمان`,
    UMM_AL_QUWAIN: `أم القيوين`,
    RAS_AL_KHAIMAH: `رأس الخيمة`,
    FUJAIRAH: `الفجيرة`,
    KHOR_FAKKAN: `خورفكان`,
    OUTSIDE: `خارج الإمارات`,
  },
  en: {
    DUBAI: "Dubai",
    ABU_DHABI: "Abu Dhabi",
    SHARJAH: "Sharjah",
    AJMAN: "Ajman",
    UMM_AL_QUWAIN: "Umm Al Quwain",
    RAS_AL_KHAIMAH: "Ras Al Khaimah",
    FUJAIRAH: "Fujairah",
    KHOR_FAKKAN: "Khor Fakkan",
    OUTSIDE: "Outside UAE",
  },
};

export const PAYMENT_CONDITION_LABEL = {
  ar: {
    SIGNATURE: `دفعة أولي عند توقيع العقد`,
    DELIVERY: `دفعة عند التسليم`,
    MILESTONE: `دفعة عند مرحلة محددة`,
    DATE: `دفعة بتاريخ محدد`,
  },
  en: {
    SIGNATURE: "Initial payment on contract signature",
    DELIVERY: "Payment on delivery",
    MILESTONE: "Payment at milestone",
    DATE: "Payment on specific date",
  },
};
export const COUNTRY_LABEL = {
  "United Arab Emirates": {
    ar: `الإمارات العربية المتحدة`,
    en: "United Arab Emirates",
  },

  // Asia
  Afghanistan: { ar: `أفغانستان`, en: "Afghanistan" },
  Armenia: { ar: `أرمينيا`, en: "Armenia" },
  Azerbaijan: { ar: `أذربيجان`, en: "Azerbaijan" },
  Bahrain: { ar: `البحرين`, en: "Bahrain" },
  Bangladesh: { ar: `بنغلاديش`, en: "Bangladesh" },
  Bhutan: { ar: `بوتان`, en: "Bhutan" },
  Brunei: { ar: `بروناي`, en: "Brunei" },
  Cambodia: { ar: `كمبوديا`, en: "Cambodia" },
  China: { ar: `الصين`, en: "China" },
  Cyprus: { ar: `قبرص`, en: "Cyprus" },
  Georgia: { ar: `جورجيا`, en: "Georgia" },
  India: { ar: `الهند`, en: "India" },
  Indonesia: { ar: `إندونيسيا`, en: "Indonesia" },
  Iran: { ar: `إيران`, en: "Iran" },
  Iraq: { ar: `العراق`, en: "Iraq" },
  Israel: { ar: `إسرائيل`, en: "Israel" },
  Japan: { ar: `اليابان`, en: "Japan" },
  Jordan: { ar: `الأردن`, en: "Jordan" },
  Kazakhstan: { ar: `كازاخستان`, en: "Kazakhstan" },
  Kuwait: { ar: `الكويت`, en: "Kuwait" },
  Kyrgyzstan: { ar: `قرغيزستان`, en: "Kyrgyzstan" },
  Laos: { ar: `لاوس`, en: "Laos" },
  Lebanon: { ar: `لبنان`, en: "Lebanon" },
  Malaysia: { ar: `ماليزيا`, en: "Malaysia" },
  Maldives: { ar: `المالديف`, en: "Maldives" },
  Mongolia: { ar: `منغوليا`, en: "Mongolia" },
  Myanmar: { ar: `ميانمار`, en: "Myanmar" },
  Nepal: { ar: `نيبال`, en: "Nepal" },
  "North Korea": { ar: `كوريا الشمالية`, en: "North Korea" },
  Oman: { ar: `عُمان`, en: "Oman" },
  Pakistan: { ar: `باكستان`, en: "Pakistan" },
  Palestine: { ar: `فلسطين`, en: "Palestine" },
  Philippines: { ar: `الفلبين`, en: "Philippines" },
  Qatar: { ar: `قطر`, en: "Qatar" },
  "Saudi Arabia": { ar: `المملكة العربية السعودية`, en: "Saudi Arabia" },
  Singapore: { ar: `سنغافورة`, en: "Singapore" },
  "South Korea": { ar: `كوريا الجنوبية`, en: "South Korea" },
  "Sri Lanka": { ar: `سريلانكا`, en: "Sri Lanka" },
  Syria: { ar: `سوريا`, en: "Syria" },
  Taiwan: { ar: `تايوان`, en: "Taiwan" },
  Tajikistan: { ar: `طاجيكستان`, en: "Tajikistan" },
  Thailand: { ar: `تايلاند`, en: "Thailand" },
  "Timor-Leste": { ar: `تيمور الشرقية`, en: "Timor-Leste" },
  Turkey: { ar: `تركيا`, en: "Turkey" },
  Turkmenistan: { ar: `تركمانستان`, en: "Turkmenistan" },
  Uzbekistan: { ar: `أوزبكستان`, en: "Uzbekistan" },
  Vietnam: { ar: `فيتنام`, en: "Vietnam" },
  Yemen: { ar: `اليمن`, en: "Yemen" },

  // Europe
  Albania: { ar: `ألبانيا`, en: "Albania" },
  Andorra: { ar: `أندورا`, en: "Andorra" },
  Austria: { ar: `النمسا`, en: "Austria" },
  Belarus: { ar: `بيلاروسيا`, en: "Belarus" },
  Belgium: { ar: `بلجيكا`, en: "Belgium" },
  "Bosnia and Herzegovina": {
    ar: `البوسنة والهرسك`,
    en: "Bosnia and Herzegovina",
  },
  Bulgaria: { ar: `بلغاريا`, en: "Bulgaria" },
  Croatia: { ar: `كرواتيا`, en: "Croatia" },
  "Czech Republic": { ar: `جمهورية التشيك`, en: "Czech Republic" },
  Denmark: { ar: `الدنمارك`, en: "Denmark" },
  Estonia: { ar: `إستونيا`, en: "Estonia" },
  Finland: { ar: `فنلندا`, en: "Finland" },
  France: { ar: `فرنسا`, en: "France" },
  Germany: { ar: `ألمانيا`, en: "Germany" },
  Greece: { ar: `اليونان`, en: "Greece" },
  Hungary: { ar: `المجر`, en: "Hungary" },
  Iceland: { ar: `آيسلندا`, en: "Iceland" },
  Ireland: { ar: `أيرلندا`, en: "Ireland" },
  Italy: { ar: `إيطاليا`, en: "Italy" },
  Kosovo: { ar: `كوسوفو`, en: "Kosovo" },
  Latvia: { ar: `لاتفيا`, en: "Latvia" },
  Liechtenstein: { ar: `ليختنشتاين`, en: "Liechtenstein" },
  Lithuania: { ar: `ليتوانيا`, en: "Lithuania" },
  Luxembourg: { ar: `لوكسمبورغ`, en: "Luxembourg" },
  Malta: { ar: `مالطا`, en: "Malta" },
  Moldova: { ar: `مولدوفا`, en: "Moldova" },
  Monaco: { ar: `موناكو`, en: "Monaco" },
  Montenegro: { ar: `الجبل الأسود`, en: "Montenegro" },
  Netherlands: { ar: `هولندا`, en: "Netherlands" },
  "North Macedonia": { ar: `مقدونيا الشمالية`, en: "North Macedonia" },
  Norway: { ar: `النرويج`, en: "Norway" },
  Poland: { ar: `بولندا`, en: "Poland" },
  Portugal: { ar: `البرتغال`, en: "Portugal" },
  Romania: { ar: `رومانيا`, en: "Romania" },
  Russia: { ar: `روسيا`, en: "Russia" },
  "San Marino": { ar: `سان مارينو`, en: "San Marino" },
  Serbia: { ar: `صربيا`, en: "Serbia" },
  Slovakia: { ar: `سلوفاكيا`, en: "Slovakia" },
  Slovenia: { ar: `سلوفينيا`, en: "Slovenia" },
  Spain: { ar: `إسبانيا`, en: "Spain" },
  Sweden: { ar: `السويد`, en: "Sweden" },
  Switzerland: { ar: `سويسرا`, en: "Switzerland" },
  Ukraine: { ar: `أوكرانيا`, en: "Ukraine" },
  "United Kingdom": { ar: `المملكة المتحدة`, en: "United Kingdom" },
  "Vatican City": { ar: `مدينة الفاتيكان`, en: "Vatican City" },

  // Africa
  Algeria: { ar: `الجزائر`, en: "Algeria" },
  Angola: { ar: `أنغولا`, en: "Angola" },
  Benin: { ar: `بنين`, en: "Benin" },
  Botswana: { ar: `بوتسوانا`, en: "Botswana" },
  "Burkina Faso": { ar: `بوركينا فاسو`, en: "Burkina Faso" },
  Burundi: { ar: `بوروندي`, en: "Burundi" },
  "Cabo Verde": { ar: `الرأس الأخضر`, en: "Cabo Verde" },
  Cameroon: { ar: `الكاميرون`, en: "Cameroon" },
  "Central African Republic": {
    ar: `جمهورية أفريقيا الوسطى`,
    en: "Central African Republic",
  },
  Chad: { ar: `تشاد`, en: "Chad" },
  Comoros: { ar: `جزر القمر`, en: "Comoros" },
  Congo: { ar: `الكونغو`, en: "Congo" },
  Djibouti: { ar: `جيبوتي`, en: "Djibouti" },
  Egypt: { ar: `مصر`, en: "Egypt" },
  "Equatorial Guinea": { ar: `غينيا الاستوائية`, en: "Equatorial Guinea" },
  Eritrea: { ar: `إريتريا`, en: "Eritrea" },
  Eswatini: { ar: `إسواتيني`, en: "Eswatini" },
  Ethiopia: { ar: `إثيوبيا`, en: "Ethiopia" },
  Gabon: { ar: `الغابون`, en: "Gabon" },
  Gambia: { ar: `غامبيا`, en: "Gambia" },
  Ghana: { ar: `غانا`, en: "Ghana" },
  Guinea: { ar: `غينيا`, en: "Guinea" },
  "Guinea-Bissau": { ar: `غينيا بيساو`, en: "Guinea-Bissau" },
  Kenya: { ar: `كينيا`, en: "Kenya" },
  Lesotho: { ar: `ليسوتو`, en: "Lesotho" },
  Liberia: { ar: `ليبيريا`, en: "Liberia" },
  Libya: { ar: `ليبيا`, en: "Libya" },
  Madagascar: { ar: `مدغشقر`, en: "Madagascar" },
  Malawi: { ar: `مالاوي`, en: "Malawi" },
  Mali: { ar: `مالي`, en: "Mali" },
  Mauritania: { ar: `موريتانيا`, en: "Mauritania" },
  Mauritius: { ar: `موريشيوس`, en: "Mauritius" },
  Morocco: { ar: `المغرب`, en: "Morocco" },
  Mozambique: { ar: `موزمبيق`, en: "Mozambique" },
  Namibia: { ar: `ناميبيا`, en: "Namibia" },
  Niger: { ar: `النيجر`, en: "Niger" },
  Nigeria: { ar: `نيجيريا`, en: "Nigeria" },
  Rwanda: { ar: `رواندا`, en: "Rwanda" },
  "Sao Tome and Principe": {
    ar: `ساو تومي وبرينسيبي`,
    en: "Sao Tome and Principe",
  },
  Senegal: { ar: `السنغال`, en: "Senegal" },
  Seychelles: { ar: `سيشل`, en: "Seychelles" },
  "Sierra Leone": { ar: `سيراليون`, en: "Sierra Leone" },
  Somalia: { ar: `الصومال`, en: "Somalia" },
  "South Africa": { ar: `جنوب أفريقيا`, en: "South Africa" },
  "South Sudan": { ar: `جنوب السودان`, en: "South Sudan" },
  Sudan: { ar: `السودان`, en: "Sudan" },
  Tanzania: { ar: `تنزانيا`, en: "Tanzania" },
  Togo: { ar: `توغو`, en: "Togo" },
  Tunisia: { ar: `تونس`, en: "Tunisia" },
  Uganda: { ar: `أوغندا`, en: "Uganda" },
  Zambia: { ar: `زامبيا`, en: "Zambia" },
  Zimbabwe: { ar: `زيمبابوي`, en: "Zimbabwe" },

  // North America
  "Antigua and Barbuda": { ar: `أنتيغوا وبربودا`, en: "Antigua and Barbuda" },
  Bahamas: { ar: `جزر البهاما`, en: "Bahamas" },
  Barbados: { ar: `بربادوس`, en: "Barbados" },
  Belize: { ar: `بليز`, en: "Belize" },
  Canada: { ar: `كندا`, en: "Canada" },
  "Costa Rica": { ar: `كوستاريكا`, en: "Costa Rica" },
  Cuba: { ar: `كوبا`, en: "Cuba" },
  Dominica: { ar: `دومينيكا`, en: "Dominica" },
  "Dominican Republic": { ar: `جمهورية الدومينيكان`, en: "Dominican Republic" },
  "El Salvador": { ar: `السلفادور`, en: "El Salvador" },
  Grenada: { ar: `غرينادا`, en: "Grenada" },
  Guatemala: { ar: `غواتيمالا`, en: "Guatemala" },
  Haiti: { ar: `هايتي`, en: "Haiti" },
  Honduras: { ar: `هندوراس`, en: "Honduras" },
  Jamaica: { ar: `جامايكا`, en: "Jamaica" },
  Mexico: { ar: `المكسيك`, en: "Mexico" },
  Nicaragua: { ar: `نيكاراغوا`, en: "Nicaragua" },
  Panama: { ar: `بنما`, en: "Panama" },
  "Saint Kitts and Nevis": {
    ar: `سانت كيتس ونيفيس`,
    en: "Saint Kitts and Nevis",
  },
  "Saint Lucia": { ar: `سانت لوسيا`, en: "Saint Lucia" },
  "Saint Vincent and the Grenadines": {
    ar: `سانت فنسنت وجزر غرينادين`,
    en: "Saint Vincent and the Grenadines",
  },
  "Trinidad and Tobago": { ar: `ترينيداد وتوباغو`, en: "Trinidad and Tobago" },
  "United States": { ar: `الولايات المتحدة`, en: "United States" },

  // South America
  Argentina: { ar: `الأرجنتين`, en: "Argentina" },
  Bolivia: { ar: `بوليفيا`, en: "Bolivia" },
  Brazil: { ar: `البرازيل`, en: "Brazil" },
  Chile: { ar: `تشيلي`, en: "Chile" },
  Colombia: { ar: `كولومبيا`, en: "Colombia" },
  Ecuador: { ar: `الإكوادور`, en: "Ecuador" },
  Guyana: { ar: `غيانا`, en: "Guyana" },
  Paraguay: { ar: `باراغواي`, en: "Paraguay" },
  Peru: { ar: `بيرو`, en: "Peru" },
  Suriname: { ar: `سورينام`, en: "Suriname" },
  Uruguay: { ar: `أوروغواي`, en: "Uruguay" },
  Venezuela: { ar: `فنزويلا`, en: "Venezuela" },

  // Oceania
  Australia: { ar: `أستراليا`, en: "Australia" },
  Fiji: { ar: `فيجي`, en: "Fiji" },
  Kiribati: { ar: `كيريباتي`, en: "Kiribati" },
  "Marshall Islands": { ar: `جزر مارشال`, en: "Marshall Islands" },
  Micronesia: { ar: `ولايات ميكرونيزيا المتحدة`, en: "Micronesia" },
  Nauru: { ar: `ناورو`, en: "Nauru" },
  "New Zealand": { ar: `نيوزيلندا`, en: "New Zealand" },
  Palau: { ar: `بالاو`, en: "Palau" },
  "Papua New Guinea": { ar: `بابوا غينيا الجديدة`, en: "Papua New Guinea" },
  Samoa: { ar: `ساموا`, en: "Samoa" },
  "Solomon Islands": { ar: `جزر سليمان`, en: "Solomon Islands" },
  Tonga: { ar: `تونغا`, en: "Tonga" },
  Tuvalu: { ar: `توفالو`, en: "Tuvalu" },
  Vanuatu: { ar: `فانواتو`, en: "Vanuatu" },
};

export const PROJECT_TYPES_LABELS = {
  "3D_Designer": {
    ar: `تصميم ثري دي`,
    en: "3D Design",
  },
  "3D_Modification": {
    ar: `تعديل ثري دي`,
    en: "3D Modification",
  },
  "2D_Study": {
    ar: `تخطيط المساحات`,
    en: "2D Study",
  },
  "2D_Final_Plans": {
    ar: `مخططات تنفيذية`,
    en: "2D Final Plans",
  },
  "2D_Quantity_Calculation": {
    ar: `حساب كميات واسعار`,
    en: "2D Quantity Calculation",
  },
};
