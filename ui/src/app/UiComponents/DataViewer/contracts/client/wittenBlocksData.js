// wittenBlocksData.js  (only the requested edits)
export const FIXED_TEXT = {
  titles: {
    partyOne: {
      ar: "الفريق الأول: المالك أو وكيله",
      en: "Party One: The Owner or Authorized Representative",
    },
    amounts: { ar: "تكلفة التصميم", en: "Design Cost" },
    includesStages: {
      ar: "يشمل هذا الاتفاق المراحل",
      en: "This agreement includes the stages",
    },
    payments: { ar: "جدول الدفعات", en: "Payment Schedule" },
    allStagesMatrix: { ar: "جدول المراحل", en: "Stages Table" },
    drawings: { ar: "مساحات العمل (المخططات)", en: "Work Areas (Drawings)" },
    confirmation: { ar: "إقرار الموافقة", en: "Acknowledgement" },
  },
  currencyAED: { ar: "درهم إماراتي", en: "AED" },
  confirmationLabel: {
    ar: "أقرّ بأنني قرأت جميع البنود وأوافق عليها",
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
        "التــــزامات الفـــــــريق الأول:\n" +
        "1) يتعهد الفريق الأول بتوفير كافة المخططات أو المعلومات المتعلقة بأعمال التصميم.\n" +
        "2) يتعهد الفريق الأول بدفع كامل المبلغ المتفق عليه حسب تكلفة التصميم، وذلك وفق جدول دفعات العقد التالي.",
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
      "التــــزامات الفـــــــريق الثــاني:\n" +
      "• يتعهد الفريق الثاني بتسليم كافة المخططات والصور والمتطلبات التصميمية اللازمة حسب الأصول.\n" +
      "• يتم تنفيذ الأعمال ضمن إطار الشركة في المراحل الثانية والثالثة والرابعة والخامسة.\n" +
      "• إذا تم اعتماد توزيع المساحات في المرحلة الثانية فلا يحق تعديل التوزيع عند بدء المرحلة الثالثة أو بعدها إلا بعقد جديد.\n" +
      "• عند تحويل التصميم إلى قسم المخططات يُلغى بند التعديلات تلقائيًا وأي تعديلات لاحقة تكون بتكلفة إضافية.",
    en:
      "Obligations of Party Two:\n" +
      "• Deliver all required drawings, visuals, and design deliverables as per standards.\n" +
      "• Work is executed within the company framework across stages 2–5.\n" +
      "• Once space layouts are approved in Stage 2, changes in Stage 3 or later require a new contract.\n" +
      "• After transfer to the drawings department, the revisions entitlement is void; further changes are chargeable.",
  },
};

// ====== UPDATED with your exact Arabic clauses ======
export const STAGE_CLAUSES_DEFAULT = {
  1: {
    ar:
      "تعريف: تعتبر المرحلة الاولى اجتماع اولي بين الشركة والمالك لتحديد الاحتياجات ودراسة الافكار والمقترحات وتعتبر مرجع اساسي للمراحل القادمة و يتم عقد الاجتماع من خلال الحضور الى المكتب او اونلاين ( جوجل ميت او غيرها من الخدمات )\n" +
      "• في حال توقيع العقد يقدم نموذج يتم تعبئته من قبل المالك لتحديد صلاحيات التعديلات المطلوبة في المراحل القادمة.",
    en: "Definition: Stage 1 is an initial meeting between the company and the owner to identify needs and proposals; it becomes the reference for subsequent stages. Meeting in-office or online. • Upon signing, a form is provided to define revision permissions for later stages.",
  },
  2: {
    ar:
      "تعريف: يتم من خلالها تطبيق الافكار المقترحة خلال الاجتماع في المرحلة الاولى على المساحات المشمولة في العقد وبناءا على الصلاحيات المحددة في النموذج الموقع سابقا يتم من خلالها دراسة المساحات وتوزيع الاثاث و توزيع الكهرباء ( سوكيت فقط ) توزيع الخدمات و الحمامات و حل كافة المشاكل الموجودة بالمخطط الذي تم استلامه من قبل المالك\n" +
      "مكونات المرحلة:\n" +
      "                  تطبيق الافكار المعتمدة خلال المرحلة الاولى\n" +
      "                  اجتماع لمناقشة الافكار التي تم تطبيقها على المخططات\n" +
      "                  في حال وجود تعديلات يتم تعديل التعديلات\n" +
      "                  اجتماع نهائي لمناقشة التعديلات المطلوبة وانهاء المرحلة الثانية\n" +
      "                  اي اجتماعات جديدة او تعديلات اضافية تكون بتكلفة اضافية\n" +
      "بنود المرحلة:\n" +
      "• تعتبر الملفات المستلمة من المالك هي مرجع اساسي واي اخطاء او نقص بالمعلومات الشركة لا تتحمل اي مسؤولية نتيجة ذلك. واي تعديلات تحدث نتيجة ذلك تكون بتكلفة اضافية.\n" +
      "• يتعهد الفريق الثاني بتسليم اعمال المرحلة الثانية  بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة. ( تشمل فقط ايام الدوام الرسمي) . لا يشمل مدة اعمال التعديلات.\n" +
      "• في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n" +
      "• في حال تاخر الفريق الاول  عن الرد على استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n" +
      "• في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال التصميم والتسليم.\n" +
      "• يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n" +
      "• يسمح بتعديل واحد فقط من قبل العميل.\n" +
      "• * في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n" +
      "• في حال تم الاعتماد وعدم طلب تعديلات  خلال اجتماع المناقشة يتم انهاء المرحلة الثانية.\n" +
      "• التسليم النهائي هو ملفات بصيغة PDF .",
    en: "Definition: Apply Stage-1 ideas to the areas covered by the contract within defined permissions; 2D study, furniture layout, sockets, services, bathrooms, and fixes to owner-provided plan. Components: apply ideas, discussion meeting, perform edits if needed, final meeting; any extra meetings/edits are chargeable. Terms: owner files are the reference; delivery cap from start (workdays; excludes revisions), responses and payments affect timing; communication via email/WhatsApp; one revision; final delivery PDF.",
  },
  3: {
    ar:
      "تعريف: تشمل اعمال تصميم الديكور حسب الستايل المحدد من قبل المالك ومتابعة فريق التصميم يشمل تنفيذ الافكار المقترحة بالتصميم واظهارها بالتصميم ثلاثي الابعاد.\n" +
      "مكونات المرحلة:\n" +
      "                  تحديد ستايل التصميم .\n" +
      "                  بدء اعمال التصميم من قبل فريق العمل  .\n" +
      "                  اجتماع يتم من خلاله تقديم التصميم للمالك سواء الحضور بالمكتب او اونلاين .\n" +
      "                  احقية تصميم وتعديلان على التصميم.\n" +
      "                  انهاء الاعمال والانتقال الى المرحلة النهائية.\n" +
      "بنود المرحلة:\n" +
      "• تعتبر الملفات المستلمة من المالك هي مرجع اساسي واي اخطاء او نقص بالمعلومات الشركة لا تتحمل اي مسؤولية نتيجة ذلك. واي تعديلات تحدث نتيجة ذلك تكون بتكلفة اضافية.\n" +
      "• يتعهد الفريق الثاني بتسليم اعمال المرحلة الثالثه بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة. ( تشمل فقط ايام الدوام الرسمي) . لا يشمل مدة اعمال التعديلات.\n" +
      "• في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n" +
      "• في حال تاخر الفريق الاول  عن الرد على استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n" +
      "• في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال التصميم والتسليم.\n" +
      "• يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n" +
      "• يسمح بتعديلان  فقط من قبل العميل.\n" +
      "• * في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n" +
      "• في حال تم الاعتماد وعدم طلب تعديلات  خلال اجتماع المناقشة يتم انهاء المرحلة الثالثة.\n" +
      "• التسليم النهائي هو ملفات بصيغة PDF .",
    en: "Definition: Interior design per selected style with 3D visuals. Components: style selection, design start, presentation meeting, two revisions right, finish and move to final stage. Terms as provided in Arabic.",
  },
  4: {
    ar:
      "تعريف: بدء اعمال تجهيز المخططات التفصيلية للمشروع تشمل كافة الاعمال العقد الموقع وفي حال بدء هذه المرحلة لا يحق طلب اي تعديلات على التصميم الاساسي او التوزيع.\n" +
      "بنود المرحلة:\n" +
      "• يتعهد الفريق الثاني بتسليم اعمال المرحلة الثانية  بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة. ( تشمل فقط ايام الدوام الرسمي) . لا يشمل مدة اعمال التعديلات.\n" +
      "• في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n" +
      "• في حال تاخر الفريق الاول  عن الرد على استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n" +
      "• في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال االمخططات والتسليم.\n" +
      "• يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n" +
      "•  في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n" +
      "• عند الانتقال الى مرحلة المخططات النهائية لا يحق اجراء اي تعديل على التصميم المعتمد.\n" +
      "• التسليم النهائي هو ملفات بصيغة PDF .\n" +
      "• يتم تسليم المخططات بنسخة PDF  فقط وفي حال طلب نسخ اضافية بصيغ اخرى قد يطلب تكلفة اضافية.",
    en: "Definition: Begin detailed drawings; no changes to base design/layout once started. Terms as provided in Arabic.",
  },
  5: {
    ar:
      "تعريف: بدء حساب الكميات وتحديد المواصفات والاسعار الخاصة بالمشروع\n" +
      "بنود المرحلة:\n" +
      "• يتعهد الفريق الثاني بتسليم اعمال المرحلة الثانية  بمدة اقصاها                ايام من تاريخ بدء المرحله ودفع الطرف الاول الدفعات المرتبطة بهذه المرحلة. ( تشمل فقط ايام الدوام الرسمي) . لا يشمل مدة اعمال التعديلات.\n" +
      "• في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n" +
      "• يتم تحديد المواصفات حسب السوق الاماراتي فقط .\n" +
      "• تحديد الاسعار فقط للمشاريع الخاصة بالامارات.\n" +
      "• قد تختلف الكميات من شركة لاخرى سحب طرق الحساب المعتمدة حسب كل بند .\n" +
      "• في حال لم يحدد عدد ايام التسليم يتم تسليم المشروع ضمن جدول اعمال الشركه.\n" +
      "• في حال تاخر الفريق الاول  عن الرد على استفسارات فريق الثاني يتحمل الفريق الاول كافه المسئوليه عن اي عمليه تاخير تحصل .\n" +
      "• في حال تاخر المالك عن الالتزام بالدفعات حسب العقد يكون مسؤول عن تأخير اعمال االمخططات والتسليم.\n" +
      "• يتم التعامل من خلال البريد الالكتروني او الواتس اب  بين الطرفين في ارسال الدراسات  والمخططات التفصيلة\n" +
      "•  في حال اي اجتماع جديد او اي اعمال تعديلات اضافية تكون بتكلفة اضافية.\n" +
      "• عند الانتقال الى مرحلة المخططات النهائية لا يحق اجراء اي تعديل على التصميم المعتمد.\n" +
      "• التسليم النهائي هو ملفات بصيغة PDF .\n" +
      "• يتم تسليم المخططات بنسخة PDF  فقط وفي حال طلب نسخ اضافية بصيغ اخرى قد يطلب تكلفة اضافية.",
    en: "Definition: BOQ/specs/pricing; UAE market/specs scope; terms as provided in Arabic.",
  },
  6: {
    ar:
      "تعريف: مرحلة البدء باعمال التنفيذ بعد توقيع عقد التنفيذ المفصل  \n" +
      "• هذه المرحلة لها عقد منفصل .",
    en: "Definition: Execution stage after signing a separate detailed execution contract (separate agreement).",
  },
};

export const HANDWRITTEN_SPECIAL_CLAUSES = {
  ar: [
    "موعد التسليم المجمل للاعمال ..... يوم من تاريخ استلام الدفعة الاولى لا يشمل ايام التعديلات او التاخير الذي يحصل من طرف المالك في اي مرحلة من مراحل العمل.",
    "في حالة فسخ العقد قبل البدء باي اعمال تخص الطرف الاول يتم ارجاع 50 % من قيمة الدفعة الاولى .",
    "اي مخططات اضافيه يطلبها الفريق الاول تكون بتكلفة اضافيه يحددها قسم المحاسبه للشركه.",
    "في حالة فسخ الاتفاق بعد البدء بأي اعمال تخص الطرف الاول  تعتبر الدفعة الأولى غير مستردة ولا يحق المطالبة بها.",
    "يتوجب حضور الفريق الأول لمناقشة  تفاصيل المشروع في المكتب او اي وسيله رسميه للتواصل.",
    "تتم المطالبات المالية من خلال محاسب الشركه او من خلال ممثل الشركه فقط .",
    "يحق للفريق الثاني مشاركه كافه اعمال التصميم على وسائل التواصل الخاصه بالشركه او اي وسيله اعلاميه وفي حال رفض الفريق الاول ذلك يتم زيادة 20% على قيمه المبلغ الاساسي لاعمال التصميم وتدفع خلال الدفعه الاولى.",
    "تنتهي صلاحية هذه الاتفاقية بعد  تسليم المخططات النهائية الى الطرف الاول ولا يجوز طلب تعديلات او اضافات على المشروع الا بعقد جديد.",
    "لطلب اي معلومات او استشارات او تفاصيل عن المشروع اثناء مرحلة التنفيذ يتم من خلال اتفاقية جديدة يندرج تحت مسمى الاشراف الهندسي او الاستشرات الهندسيه",
    "في حال تم تسليم اعمال التصميم ولم نتلقى رد من العميل  خلال مدة 20 يوم من تسليم التصميم يتحول المشروع  لمرحلة المخططات تلقائيا  ويفقد المالك احقية التعديلات واي مستحقات مالية تخص المرحلة يكون العميل مطالب فيها",
    "في حال تأخر العميل عن سداد أي دفعة لأكثر من 30 يوما من تاري الاستحقاق، يحق للشركة اتخاذ الاجراءيت التاليين:\n• الغاء أي خصم تم منحه مسبقا ضمن الاتفاق\n• إعادة احتساب قيمة الخصم بما يتناسب مع مدة التأخير، واعتبار الخصم غير ساري جزئياً او كلياً وفقاً لتقدير الشركة",
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
    "دفعه أولى",
    "دفعه ثانية",
    "دفعة ثالثة",
    "دفعة رابعة",
    "دفعة خامسة",
    "دفعة سادسة",
    "دفعة سابعة",
    "دفعة ثامنة",
    "دفعة تاسعة",
    "دفعة عاشرة",
    "دفعة حادية عشرة",
    "دفعة ثانية عشرة",
    "دفعة ثالثة عشرة",
    "دفعة رابعة عشرة",
    "دفعة خامسة عشرة",
    "دفعة سادسة عشرة",
    "دفعة سابعة عشرة",
    "دفعة ثامنة عشرة",
    "دفعة تاسعة عشرة",
    "دفعة عشرون",
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
  1: { ar: "اجتماع أولي", en: "Initial Meeting" },
  2: { ar: "تخطيط المساحات", en: "2D Study" },
  3: { ar: "تصميم ثلاثي الأبعاد", en: "3D Design" },
  4: { ar: "مخططات تنفيذية", en: "Working Drawings" },
  5: { ar: "حساب كميات وأسعار", en: "BOQ & Specs" },
  6: { ar: "تنفيذ", en: "Execution" },
};

export const STAGE_PROGRESS = {
  1: {
    ar: ["اجتماع أولي لتحديد الاحتياجات والأفكار للمراحل القادمة"],
    en: ["Kick-off meeting to capture needs and ideas for next stages"],
  },
  2: {
    ar: [
      "تطبيق الأفكار المعتمدة",
      "اجتماع مناقشة",
      "إجراء التعديلات إن وجدت",
      "اجتماع نهائي للمرحلة",
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
      "تحديد ستايل التصميم",
      "بدء أعمال التصميم",
      "اجتماع تقديم التصميم",
      "تعديل 1 إن وجد",
      "تعديل 2 إن وجد",
      "انتهاء أعمال تطبيق الأفكار",
      "اجتماع مناقشة",
      "تعديلات إن وجدت",
      "اجتماع نهائي",
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
      "بدء أعمال تجهيز المخططات التفصيلية تشمل كافة الأعمال حسب العقد",
      "لا يحق طلب تعديلات على التصميم الأساسي أو التوزيع بعد البدء",
    ],
    en: [
      "Start detailed working drawings for all agreed scopes",
      "No changes to base design/layout once started",
    ],
  },
  5: {
    ar: [
      "بدء حساب الكميات",
      "تحديد المواصفات الخاصة بالمشروع",
      "تسعير بنطاق الإمارات",
    ],
    en: [
      "Start quantities take-off",
      "Define project specifications",
      "Pricing (UAE scope)",
    ],
  },
  6: {
    ar: ["بدء أعمال التنفيذ (عقد منفصل)"],
    en: ["Begin execution works (separate contract)"],
  },
};
