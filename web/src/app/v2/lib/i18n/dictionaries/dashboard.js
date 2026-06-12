// Per-feature UI dictionary: role-adaptive analytics dashboard (page chrome, section headings,
// widget titles, KPI / designer card labels, filter bar, action-queue copy, chart series labels,
// emirate labels, empty/error states). Namespaced under "dashboard.*".
//
// CONTRACT: ar is the existing/authoritative wording (verbatim); en is the additive translation.
// Excluded: backend message CODES (config/dashboardMessages.js) and the toast-runner defaults
// (dashboard.mutations.js — the surface is read-only).

export const ar = {
  // ── page-level copy ──────────────────────────────────────────────────────────
  "dashboard.title": "لوحة التحكم",
  "dashboard.subtitle": "نظرة سريعة على ما يحتاج انتباهك اليوم",
  "dashboard.denied": "لا تملك صلاحية الوصول إلى لوحة التحكم",
  "dashboard.queue.allGood.title": "كل شيء على ما يرام",
  "dashboard.queue.allGood.description": "لا يوجد ما يحتاج انتباهك الآن.",

  // ── section headings ─────────────────────────────────────────────────────────
  "dashboard.section.actionQueue": "يحتاج انتباهك",
  "dashboard.section.kpis": "المؤشرات الرئيسية",
  "dashboard.section.leadsStatus": "حالة العملاء المحتملين",
  "dashboard.section.latestLeads": "أحدث العملاء المحتملين",
  "dashboard.section.designerBoard": "لوحة الإنتاج",
  "dashboard.section.charts": "تحليلات الأداء",
  "dashboard.section.monthlyPerformance": "الأداء الشهري",
  "dashboard.section.weekPerformance": "أداء الأسبوع",
  "dashboard.section.emiratesAnalytics": "تحليلات الإمارات",
  "dashboard.section.leadsMonthlyOverview": "نظرة شهرية على العملاء",

  // ── latest-leads compact list ────────────────────────────────────────────────
  "dashboard.latestLeads.empty": "لا يوجد عملاء محتملون حديثون",
  "dashboard.latestLeads.actionLabel": "فتح الملف",

  // ── filter bar ───────────────────────────────────────────────────────────────
  "dashboard.filter.startDate": "من تاريخ",
  "dashboard.filter.endDate": "إلى تاريخ",
  "dashboard.filter.staffId": "معرّف الموظف (الإدارة فقط)",
  "dashboard.filter.staffHelper": "اتركه فارغاً لعرض الكل",
  "dashboard.filter.apply": "تطبيق",
  "dashboard.filter.reset": "إعادة الضبط",

  // ── action-queue copy ────────────────────────────────────────────────────────
  "dashboard.queue.latestLeads.groupTitle": "عملاء جدد بانتظار التواصل",
  "dashboard.queue.latestLeads.actionLabel": "تواصل الآن",
  "dashboard.queue.latestLeads.emptyHint": "لا يوجد عملاء جدد بانتظار التواصل.",
  "dashboard.queue.recentActivities.groupTitle": "آخر الأنشطة",
  "dashboard.queue.recentActivities.actionLabel": "عرض",
  "dashboard.queue.recentActivities.emptyHint": "لا توجد أنشطة حديثة.",
  "dashboard.queue.leadFallback": "عميل #",
  "dashboard.queue.activityFallback": "نشاط",

  // ── KPI card labels ──────────────────────────────────────────────────────────
  "dashboard.kpi.totalRevenue": "إجمالي الإيرادات",
  "dashboard.kpi.averageProjectValue": "متوسط قيمة المشروع",
  "dashboard.kpi.successRate": "نسبة النجاح",
  "dashboard.kpi.leadsCounts": "إجمالي العملاء",
  "dashboard.kpi.interactedLeads": "تفاعلات اليوم",
  "dashboard.kpi.newLeadCounts": "عملاء جدد",
  "dashboard.kpi.successLeadsCount": "صفقات ناجحة",
  "dashboard.kpi.empty": "لا توجد مؤشرات لعرضها",

  // ── designer / production board labels ───────────────────────────────────────
  "dashboard.designer.notStarted": "لم تبدأ",
  "dashboard.designer.inProgress": "قيد التنفيذ",
  "dashboard.designer.hold": "معلّقة",
  "dashboard.designer.completed": "مكتملة",
  "dashboard.designer.totalProjects": "إجمالي المشاريع",
  "dashboard.designer.totalArea": "إجمالي المساحة",
  "dashboard.designer.currentMonthArea": "مساحة هذا الشهر",
  "dashboard.designer.totalTimeSpent": "ساعات العمل",
  "dashboard.designer.empty.title": "لا توجد مشاريع إنتاج",
  "dashboard.designer.empty.description":
    "لم تُسند إليك مشاريع بعد، أو لا توجد مشاريع ضمن النطاق المحدد.",

  // ── chart series / axis labels ───────────────────────────────────────────────
  "dashboard.chart.leads": "العملاء",
  "dashboard.chart.finalized": "المنتهية",
  "dashboard.chart.week.newLeads": "عملاء جدد",
  "dashboard.chart.week.success": "نجاحات",
  "dashboard.chart.week.followUps": "متابعات",
  "dashboard.chart.week.meetings": "اجتماعات",
  "dashboard.chart.thisWeek": "هذا الأسبوع",
  "dashboard.chart.overview.inside": "داخل الدولة",
  "dashboard.chart.overview.outside": "خارج الدولة",
  "dashboard.chart.overview.incomplete": "غير مكتمل",
  "dashboard.chart.overview.finalized": "منتهية",
  "dashboard.chart.leadsSeries": "عملاء",
  "dashboard.chart.empty": "لا توجد بيانات كافية لعرض الرسم",

  // ── emirate labels ───────────────────────────────────────────────────────────
  "dashboard.emirate.DUBAI": "دبي",
  "dashboard.emirate.ABU_DHABI": "أبوظبي",
  "dashboard.emirate.SHARJAH": "الشارقة",
  "dashboard.emirate.AJMAN": "عجمان",
  "dashboard.emirate.UMM_AL_QUWAIN": "أم القيوين",
  "dashboard.emirate.RAS_AL_KHAIMAH": "رأس الخيمة",
  "dashboard.emirate.FUJAIRAH": "الفجيرة",

  // ── fixed-data reference card (read-only) ────────────────────────────────────
  "dashboard.fixedData.title": "البيانات الثابتة",
  "dashboard.fixedData.subtitle": "بيانات مرجعية ثابتة للاطّلاع فقط.",
  "dashboard.fixedData.empty.title": "لا توجد بيانات ثابتة",
  "dashboard.fixedData.empty.description": "لم تُضَف أي بيانات ثابتة بعد.",

  // ── widget empty / error states ──────────────────────────────────────────────
  "dashboard.leadsStatus.empty": "لا توجد عملاء في أي حالة",
  "dashboard.widget.emptyDefault": "لا توجد بيانات",
};

export const en = {
  // ── page-level copy ──────────────────────────────────────────────────────────
  "dashboard.title": "Dashboard",
  "dashboard.subtitle": "A quick look at what needs your attention today",
  "dashboard.denied": "You don't have permission to access the dashboard",
  "dashboard.queue.allGood.title": "All good",
  "dashboard.queue.allGood.description": "Nothing needs your attention right now.",

  // ── section headings ─────────────────────────────────────────────────────────
  "dashboard.section.actionQueue": "Needs your attention",
  "dashboard.section.kpis": "Key metrics",
  "dashboard.section.leadsStatus": "Lead status",
  "dashboard.section.latestLeads": "Latest leads",
  "dashboard.section.designerBoard": "Production board",
  "dashboard.section.charts": "Performance analytics",
  "dashboard.section.monthlyPerformance": "Monthly performance",
  "dashboard.section.weekPerformance": "Week performance",
  "dashboard.section.emiratesAnalytics": "Emirates analytics",
  "dashboard.section.leadsMonthlyOverview": "Leads monthly overview",

  // ── latest-leads compact list ────────────────────────────────────────────────
  "dashboard.latestLeads.empty": "No recent leads",
  "dashboard.latestLeads.actionLabel": "Open profile",

  // ── filter bar ───────────────────────────────────────────────────────────────
  "dashboard.filter.startDate": "From date",
  "dashboard.filter.endDate": "To date",
  "dashboard.filter.staffId": "Staff ID (admin only)",
  "dashboard.filter.staffHelper": "Leave empty to show all",
  "dashboard.filter.apply": "Apply",
  "dashboard.filter.reset": "Reset",

  // ── action-queue copy ────────────────────────────────────────────────────────
  "dashboard.queue.latestLeads.groupTitle": "New leads awaiting contact",
  "dashboard.queue.latestLeads.actionLabel": "Contact now",
  "dashboard.queue.latestLeads.emptyHint": "No new leads awaiting contact.",
  "dashboard.queue.recentActivities.groupTitle": "Recent activity",
  "dashboard.queue.recentActivities.actionLabel": "View",
  "dashboard.queue.recentActivities.emptyHint": "No recent activity.",
  "dashboard.queue.leadFallback": "Lead #",
  "dashboard.queue.activityFallback": "Activity",

  // ── KPI card labels ──────────────────────────────────────────────────────────
  "dashboard.kpi.totalRevenue": "Total revenue",
  "dashboard.kpi.averageProjectValue": "Average project value",
  "dashboard.kpi.successRate": "Success rate",
  "dashboard.kpi.leadsCounts": "Total leads",
  "dashboard.kpi.interactedLeads": "Today's interactions",
  "dashboard.kpi.newLeadCounts": "New leads",
  "dashboard.kpi.successLeadsCount": "Successful deals",
  "dashboard.kpi.empty": "No metrics to display",

  // ── designer / production board labels ───────────────────────────────────────
  "dashboard.designer.notStarted": "Not started",
  "dashboard.designer.inProgress": "In progress",
  "dashboard.designer.hold": "On hold",
  "dashboard.designer.completed": "Completed",
  "dashboard.designer.totalProjects": "Total projects",
  "dashboard.designer.totalArea": "Total area",
  "dashboard.designer.currentMonthArea": "This month's area",
  "dashboard.designer.totalTimeSpent": "Work hours",
  "dashboard.designer.empty.title": "No production projects",
  "dashboard.designer.empty.description":
    "No projects have been assigned to you yet, or there are no projects within the selected scope.",

  // ── chart series / axis labels ───────────────────────────────────────────────
  "dashboard.chart.leads": "Leads",
  "dashboard.chart.finalized": "Finalized",
  "dashboard.chart.week.newLeads": "New leads",
  "dashboard.chart.week.success": "Successes",
  "dashboard.chart.week.followUps": "Follow-ups",
  "dashboard.chart.week.meetings": "Meetings",
  "dashboard.chart.thisWeek": "This week",
  "dashboard.chart.overview.inside": "Inside the country",
  "dashboard.chart.overview.outside": "Outside the country",
  "dashboard.chart.overview.incomplete": "Incomplete",
  "dashboard.chart.overview.finalized": "Finalized",
  "dashboard.chart.leadsSeries": "Leads",
  "dashboard.chart.empty": "Not enough data to display the chart",

  // ── emirate labels ───────────────────────────────────────────────────────────
  "dashboard.emirate.DUBAI": "Dubai",
  "dashboard.emirate.ABU_DHABI": "Abu Dhabi",
  "dashboard.emirate.SHARJAH": "Sharjah",
  "dashboard.emirate.AJMAN": "Ajman",
  "dashboard.emirate.UMM_AL_QUWAIN": "Umm Al Quwain",
  "dashboard.emirate.RAS_AL_KHAIMAH": "Ras Al Khaimah",
  "dashboard.emirate.FUJAIRAH": "Fujairah",

  // ── fixed-data reference card (read-only) ────────────────────────────────────
  "dashboard.fixedData.title": "Fixed data",
  "dashboard.fixedData.subtitle": "Read-only reference data.",
  "dashboard.fixedData.empty.title": "No fixed data",
  "dashboard.fixedData.empty.description": "No fixed data has been added yet.",

  // ── widget empty / error states ──────────────────────────────────────────────
  "dashboard.leadsStatus.empty": "No leads in any status",
  "dashboard.widget.emptyDefault": "No data",
};
