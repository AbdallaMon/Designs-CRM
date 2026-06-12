// Per-feature UI dictionary: real-time chat
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "chat.*" (e.g. "chat.title", "chat.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("chat.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording; en is the additive translation. Keep keys
// identical across ar and en. Arabic stays the default — an empty stub changes nothing.

export const ar = {
  // ── container / page-level ──────────────────────────────────────────────────
  "chat.emptyPickOrCreate": "اختر محادثة أو أنشئ واحدة جديدة لبدء المراسلة",
  "chat.pickToStart": "اختر محادثة لبدء المراسلة",
  "chat.noAccess": "لا تملك صلاحية الوصول إلى المحادثات",

  // ── room type labels ────────────────────────────────────────────────────────
  "chat.roomType.STAFF_TO_STAFF": "محادثة مباشرة",
  "chat.roomType.PROJECT_GROUP": "مجموعة مشروع",
  "chat.roomType.CLIENT_TO_STAFF": "عميل محتمل",
  "chat.roomType.MULTI_PROJECT": "متعدد المشاريع",
  "chat.roomType.GROUP": "مجموعة",

  // ── filter chips ────────────────────────────────────────────────────────────
  "chat.filter.ALL": "الكل",
  "chat.filter.UNREAD": "غير مقروء",
  "chat.filter.ARCHIVED": "مؤرشف",
  "chat.filter.DIRECT": "مباشر",
  "chat.filter.GROUP": "مجموعة",
  "chat.filter.PROJECT": "مشروع",
  "chat.filter.CLIENT_LEADS": "عملاء محتملون",

  // ── member role labels ──────────────────────────────────────────────────────
  "chat.role.admin": "مشرف",
  "chat.role.moderator": "مدير",
  "chat.role.client": "عميل",
  "chat.role.member": "عضو",

  // ── AddMembersDialog ────────────────────────────────────────────────────────
  "chat.members.dialogTitle": "أعضاء المحادثة",
  "chat.members.current": "الأعضاء الحاليون ({count})",
  "chat.members.unknown": "غير معروف",
  "chat.members.addNew": "إضافة أعضاء جدد",
  "chat.members.noneToAdd": "لا يوجد أعضاء متاحون للإضافة",
  "chat.members.selected": "محدد",
  "chat.members.select": "تحديد",
  "chat.members.selectedForAdd": "محددون للإضافة ({count})",
  "chat.members.close": "إغلاق",
  "chat.members.addAction": "إضافة الأعضاء ({count})",
  "chat.members.updatingRole": "تحديث الدور...",
  "chat.members.markAs": "تعيين كـ {role}",
  "chat.members.markConfirmTitle": "تعيين {name} كـ {role}",
  "chat.members.markConfirmDescription": "هل أنت متأكد من تغيير دور هذا العضو؟",
  "chat.members.confirmYes": "نعم، تأكيد",
  "chat.members.defaultUser": "المستخدم",

  // ── ConfirmDialog defaults ──────────────────────────────────────────────────
  "chat.confirm.delete": "حذف",
  "chat.confirm.cancel": "إلغاء",

  // ── CreateGroupDialog ───────────────────────────────────────────────────────
  "chat.create.title": "إنشاء مجموعة جديدة",
  "chat.create.nameRequired": "الاسم مطلوب",
  "chat.create.nameLabel": "اسم المجموعة",
  "chat.create.typeLabel": "النوع",
  "chat.create.cancel": "إلغاء",
  "chat.create.submit": "إنشاء",

  // ── ForwardMessagesDialog ───────────────────────────────────────────────────
  "chat.forward.title": "إعادة توجيه {count} رسالة",
  "chat.forward.action": "إعادة توجيه",

  // ── typing indicator ────────────────────────────────────────────────────────
  "chat.typing.default": "يكتب الآن",
  "chat.typing.many": "{count} أشخاص يكتبون",

  // ── load more ───────────────────────────────────────────────────────────────
  "chat.loadMore.cannot": "لا يمكن تحميل المزيد.",
  "chat.loadMore.loading": "جاري التحميل...",
  "chat.loadMore.action": "تحميل المزيد",

  // ── new member alert ────────────────────────────────────────────────────────
  "chat.newMember.fallback": "عضو",
  "chat.newMember.added": "تمت إضافته إلى المحادثة.",

  // ── LastSeenAt / OnlineStatus ───────────────────────────────────────────────
  "chat.lastSeen.online": "متصل الآن",
  "chat.lastSeen.minutes": "آخر ظهور قبل {n} دقيقة",
  "chat.lastSeen.hours": "آخر ظهور قبل {n} ساعة",
  "chat.lastSeen.yesterday": "آخر ظهور أمس {time}",
  "chat.lastSeen.date": "آخر ظهور {date}",
  "chat.lastSeen.onlineTitle": "متصل",
  "chat.lastSeen.offlineTitle": "غير متصل",

  // ── attachments ─────────────────────────────────────────────────────────────
  "chat.attachment.file": "ملف",

  // ── ChatInput ───────────────────────────────────────────────────────────────
  "chat.input.cancel": "إلغاء",
  "chat.input.stop": "إيقاف",
  "chat.input.sendVoice": "إرسال الصوت",
  "chat.input.voiceUnsupported": "تسجيل الصوت غير مدعوم في هذا المتصفح.",
  "chat.input.micDenied": "تم رفض إذن الميكروفون أو غير متاح.",
  "chat.input.stopFailed": "فشل إيقاف التسجيل.",
  "chat.input.voiceUploadFailed": "فشل رفع الرسالة الصوتية.",
  "chat.input.voiceSendFailed": "فشل إرسال الرسالة الصوتية.",
  "chat.input.replyTo": "رد على {name}",
  "chat.input.megabytes": "ميجابايت",
  "chat.input.fileTextPlaceholder": "نص اختياري لهذا الملف...",
  "chat.input.uploadFailed": "فشل رفع {name}",
  "chat.input.fileTooLarge": 'الملف "{name}" يتجاوز الحد المسموح',
  "chat.input.fileTypeNotAllowed": 'نوع الملف "{type}" غير مسموح',
  "chat.input.sendFailed": "فشل إرسال الرسالة",
  "chat.input.placeholder": "اكتب رسالة... (Shift+Enter لسطر جديد)",
  "chat.input.attachFiles": "إرفاق ملفات",
  "chat.input.emoji": "رمز تعبيري",
  "chat.input.recordVoice": "تسجيل صوتي",
  "chat.input.send": "إرسال",
  "chat.input.emojiTitle": "الرموز التعبيرية",

  // ── ChatMessage ─────────────────────────────────────────────────────────────
  "chat.message.unknownSender": "غير معروف",
  "chat.message.deletedReply": "(رسالة محذوفة)",
  "chat.message.emptyReply": "(بدون نص)",
  "chat.message.replyTo": "رد على {name}",
  "chat.message.deleted": "تم حذف هذه الرسالة",
  "chat.message.deletedTag": " • محذوفة",
  "chat.message.editedTag": " • معدّلة",
  "chat.message.actionReply": "رد",
  "chat.message.actionUnpin": "إلغاء التثبيت",
  "chat.message.actionPin": "تثبيت",
  "chat.message.actionDelete": "حذف",
  "chat.message.actionDeselect": "إلغاء التحديد",
  "chat.message.actionSelect": "تحديد",

  // ── MultiActions ────────────────────────────────────────────────────────────
  "chat.multi.selected": "{count} محددة",

  // ── ChatFilesTab ────────────────────────────────────────────────────────────
  "chat.files.category.image": "صور",
  "chat.files.category.video": "فيديو",
  "chat.files.category.audio": "صوت",
  "chat.files.category.document": "مستندات",
  "chat.files.title": "ملفات المحادثة",
  "chat.files.empty": "لا توجد ملفات",

  // ── ChatRoomsList ───────────────────────────────────────────────────────────
  "chat.rooms.createTab": "محادثة جماعية",
  "chat.rooms.createGroup": "مجموعة",
  "chat.rooms.searchPlaceholder": "ابحث في المحادثات...",
  "chat.rooms.empty": "لا توجد محادثات",
  "chat.rooms.openInNewWindow": "فتح في نافذة جديدة",
  "chat.rooms.typingOne": "شخص يكتب",
  "chat.rooms.typingMany": "أشخاص يكتبون",
  "chat.rooms.noMessages": "لا توجد رسائل بعد",
  "chat.rooms.file": "ملف",
  "chat.rooms.deleteTitle": "حذف المحادثة؟",
  "chat.rooms.deleteDescription": "لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الرسائل.",
  "chat.rooms.deleteConfirm": "حذف",
  "chat.rooms.leaveTitle": "مغادرة المحادثة؟",
  "chat.rooms.leaveDescription": "لن تتلقى رسائل من هذه المحادثة بعد المغادرة.",
  "chat.rooms.leaveConfirm": "مغادرة",
  "chat.rooms.cancel": "إلغاء",

  // ── RoomActions ─────────────────────────────────────────────────────────────
  "chat.roomActions.unmute": "إلغاء الكتم",
  "chat.roomActions.mute": "كتم",
  "chat.roomActions.unarchive": "إلغاء الأرشفة",
  "chat.roomActions.archive": "أرشفة",
  "chat.roomActions.delete": "حذف",
  "chat.roomActions.leave": "مغادرة",

  // ── ChatSettings ────────────────────────────────────────────────────────────
  "chat.settings.allowFiles": "السماح بمشاركة الملفات",
  "chat.settings.isChatEnabled": "تفعيل المحادثة",
  "chat.settings.allowMeetings": "السماح بالاجتماعات",
  "chat.settings.allowCalls": "السماح بالمكالمات",
  "chat.settings.name": "اسم المجموعة",
  "chat.settings.button": "إعدادات المحادثة",
  "chat.settings.title": "إعدادات المحادثة",
  "chat.settings.saving": "جاري حفظ الإعدادات...",
  "chat.settings.cancel": "إلغاء",
  "chat.settings.save": "حفظ",

  // ── ChatWindowHeader ────────────────────────────────────────────────────────
  "chat.header.voiceCall": "مكالمة صوتية",
  "chat.header.videoCall": "مكالمة فيديو",
  "chat.header.members": "الأعضاء",

  // ── PinnedMessages ──────────────────────────────────────────────────────────
  "chat.pinned.file": "ملف",
  "chat.pinned.message": "رسالة",
  "chat.pinned.title": "الرسائل المثبتة",
  "chat.pinned.unknownUser": "مستخدم غير معروف",

  // ── ChatWindow ──────────────────────────────────────────────────────────────
  "chat.window.confirm": "تأكيد",
  "chat.window.addingMembers": "جاري إضافة الأعضاء...",
  "chat.window.removingMember": "جاري إزالة العضو...",
  "chat.window.defaultMember": "هذا العضو",
  "chat.window.removeMemberTitle": "إزالة العضو؟",
  "chat.window.removeMemberDescription": "هل تريد إزالة {name} من المحادثة؟",
  "chat.window.deleteMessageTitle": "حذف الرسالة؟",
  "chat.window.deleteMessageDescription": "سيتم حذف الرسالة للجميع في المحادثة.",
  "chat.window.deleteMessagesTitle": "حذف الرسائل؟",
  "chat.window.deleteMessagesDescription": "سيتم حذف الرسائل للجميع في المحادثة.",
  "chat.window.pickToStart": "اختر محادثة لبدء المراسلة",
  "chat.window.noMessagesYet": "لا توجد رسائل بعد. ابدأ المحادثة!",
  "chat.window.noMoreMessages": "لا مزيد من الرسائل",

  // ── ClientChatPage ──────────────────────────────────────────────────────────
  "chat.client.invalidLink": "رابط غير صالح: لا يوجد رمز وصول.",
  "chat.client.validateFailed": "تعذر التحقق من رمز الوصول.",
  "chat.client.invalidToken": "رمز الوصول غير صالح أو منتهي الصلاحية.",

  // ── utils: room labels ──────────────────────────────────────────────────────
  "chat.util.loading": "جاري التحميل...",
  "chat.util.client": "عميل",
  "chat.util.conversation": "محادثة",

  // ── hooks: mutation toasts + load errors ────────────────────────────────────
  "chat.toast.creatingRoom": "جاري إنشاء المحادثة...",
  "chat.toast.updatingRoom": "جاري تحديث المحادثة...",
  "chat.toast.deletingRoom": "جاري حذف المحادثة...",
  "chat.toast.leavingRoom": "جاري مغادرة المحادثة...",
  "chat.error.loadRooms": "فشل تحميل المحادثات",
  "chat.error.loadRoom": "فشل تحميل المحادثة",
  "chat.error.loadFiles": "فشل تحميل الملفات",
};

export const en = {
  // ── container / page-level ──────────────────────────────────────────────────
  "chat.emptyPickOrCreate": "Select a conversation or create a new one to start messaging",
  "chat.pickToStart": "Select a conversation to start messaging",
  "chat.noAccess": "You don't have permission to access the chat",

  // ── room type labels ────────────────────────────────────────────────────────
  "chat.roomType.STAFF_TO_STAFF": "Direct chat",
  "chat.roomType.PROJECT_GROUP": "Project group",
  "chat.roomType.CLIENT_TO_STAFF": "Lead",
  "chat.roomType.MULTI_PROJECT": "Multi-project",
  "chat.roomType.GROUP": "Group",

  // ── filter chips ────────────────────────────────────────────────────────────
  "chat.filter.ALL": "All",
  "chat.filter.UNREAD": "Unread",
  "chat.filter.ARCHIVED": "Archived",
  "chat.filter.DIRECT": "Direct",
  "chat.filter.GROUP": "Group",
  "chat.filter.PROJECT": "Project",
  "chat.filter.CLIENT_LEADS": "Leads",

  // ── member role labels ──────────────────────────────────────────────────────
  "chat.role.admin": "Admin",
  "chat.role.moderator": "Moderator",
  "chat.role.client": "Client",
  "chat.role.member": "Member",

  // ── AddMembersDialog ────────────────────────────────────────────────────────
  "chat.members.dialogTitle": "Conversation members",
  "chat.members.current": "Current members ({count})",
  "chat.members.unknown": "Unknown",
  "chat.members.addNew": "Add new members",
  "chat.members.noneToAdd": "No members available to add",
  "chat.members.selected": "Selected",
  "chat.members.select": "Select",
  "chat.members.selectedForAdd": "Selected to add ({count})",
  "chat.members.close": "Close",
  "chat.members.addAction": "Add members ({count})",
  "chat.members.updatingRole": "Updating role...",
  "chat.members.markAs": "Mark as {role}",
  "chat.members.markConfirmTitle": "Mark {name} as {role}",
  "chat.members.markConfirmDescription": "Are you sure you want to change this member's role?",
  "chat.members.confirmYes": "Yes, confirm",
  "chat.members.defaultUser": "the user",

  // ── ConfirmDialog defaults ──────────────────────────────────────────────────
  "chat.confirm.delete": "Delete",
  "chat.confirm.cancel": "Cancel",

  // ── CreateGroupDialog ───────────────────────────────────────────────────────
  "chat.create.title": "Create a new group",
  "chat.create.nameRequired": "Name is required",
  "chat.create.nameLabel": "Group name",
  "chat.create.typeLabel": "Type",
  "chat.create.cancel": "Cancel",
  "chat.create.submit": "Create",

  // ── ForwardMessagesDialog ───────────────────────────────────────────────────
  "chat.forward.title": "Forward {count} message(s)",
  "chat.forward.action": "Forward",

  // ── typing indicator ────────────────────────────────────────────────────────
  "chat.typing.default": "typing now",
  "chat.typing.many": "{count} people are typing",

  // ── load more ───────────────────────────────────────────────────────────────
  "chat.loadMore.cannot": "Can't load more.",
  "chat.loadMore.loading": "Loading...",
  "chat.loadMore.action": "Load more",

  // ── new member alert ────────────────────────────────────────────────────────
  "chat.newMember.fallback": "member",
  "chat.newMember.added": "was added to the conversation.",

  // ── LastSeenAt / OnlineStatus ───────────────────────────────────────────────
  "chat.lastSeen.online": "Online now",
  "chat.lastSeen.minutes": "Last seen {n} minute(s) ago",
  "chat.lastSeen.hours": "Last seen {n} hour(s) ago",
  "chat.lastSeen.yesterday": "Last seen yesterday {time}",
  "chat.lastSeen.date": "Last seen {date}",
  "chat.lastSeen.onlineTitle": "Online",
  "chat.lastSeen.offlineTitle": "Offline",

  // ── attachments ─────────────────────────────────────────────────────────────
  "chat.attachment.file": "File",

  // ── ChatInput ───────────────────────────────────────────────────────────────
  "chat.input.cancel": "Cancel",
  "chat.input.stop": "Stop",
  "chat.input.sendVoice": "Send voice",
  "chat.input.voiceUnsupported": "Voice recording is not supported in this browser.",
  "chat.input.micDenied": "Microphone permission was denied or is unavailable.",
  "chat.input.stopFailed": "Failed to stop the recording.",
  "chat.input.voiceUploadFailed": "Failed to upload the voice message.",
  "chat.input.voiceSendFailed": "Failed to send the voice message.",
  "chat.input.replyTo": "Reply to {name}",
  "chat.input.megabytes": "MB",
  "chat.input.fileTextPlaceholder": "Optional caption for this file...",
  "chat.input.uploadFailed": "Failed to upload {name}",
  "chat.input.fileTooLarge": 'The file "{name}" exceeds the allowed limit',
  "chat.input.fileTypeNotAllowed": 'The file type "{type}" is not allowed',
  "chat.input.sendFailed": "Failed to send the message",
  "chat.input.placeholder": "Type a message... (Shift+Enter for a new line)",
  "chat.input.attachFiles": "Attach files",
  "chat.input.emoji": "Emoji",
  "chat.input.recordVoice": "Voice recording",
  "chat.input.send": "Send",
  "chat.input.emojiTitle": "Emojis",

  // ── ChatMessage ─────────────────────────────────────────────────────────────
  "chat.message.unknownSender": "Unknown",
  "chat.message.deletedReply": "(deleted message)",
  "chat.message.emptyReply": "(no text)",
  "chat.message.replyTo": "Reply to {name}",
  "chat.message.deleted": "This message was deleted",
  "chat.message.deletedTag": " • deleted",
  "chat.message.editedTag": " • edited",
  "chat.message.actionReply": "Reply",
  "chat.message.actionUnpin": "Unpin",
  "chat.message.actionPin": "Pin",
  "chat.message.actionDelete": "Delete",
  "chat.message.actionDeselect": "Deselect",
  "chat.message.actionSelect": "Select",

  // ── MultiActions ────────────────────────────────────────────────────────────
  "chat.multi.selected": "{count} selected",

  // ── ChatFilesTab ────────────────────────────────────────────────────────────
  "chat.files.category.image": "Images",
  "chat.files.category.video": "Video",
  "chat.files.category.audio": "Audio",
  "chat.files.category.document": "Documents",
  "chat.files.title": "Conversation files",
  "chat.files.empty": "No files",

  // ── ChatRoomsList ───────────────────────────────────────────────────────────
  "chat.rooms.createTab": "Group chat",
  "chat.rooms.createGroup": "Group",
  "chat.rooms.searchPlaceholder": "Search conversations...",
  "chat.rooms.empty": "No conversations",
  "chat.rooms.openInNewWindow": "Open in a new window",
  "chat.rooms.typingOne": "person is typing",
  "chat.rooms.typingMany": "people are typing",
  "chat.rooms.noMessages": "No messages yet",
  "chat.rooms.file": "File",
  "chat.rooms.deleteTitle": "Delete conversation?",
  "chat.rooms.deleteDescription": "This action can't be undone. All messages will be deleted.",
  "chat.rooms.deleteConfirm": "Delete",
  "chat.rooms.leaveTitle": "Leave conversation?",
  "chat.rooms.leaveDescription": "You won't receive messages from this conversation after leaving.",
  "chat.rooms.leaveConfirm": "Leave",
  "chat.rooms.cancel": "Cancel",

  // ── RoomActions ─────────────────────────────────────────────────────────────
  "chat.roomActions.unmute": "Unmute",
  "chat.roomActions.mute": "Mute",
  "chat.roomActions.unarchive": "Unarchive",
  "chat.roomActions.archive": "Archive",
  "chat.roomActions.delete": "Delete",
  "chat.roomActions.leave": "Leave",

  // ── ChatSettings ────────────────────────────────────────────────────────────
  "chat.settings.allowFiles": "Allow file sharing",
  "chat.settings.isChatEnabled": "Enable chat",
  "chat.settings.allowMeetings": "Allow meetings",
  "chat.settings.allowCalls": "Allow calls",
  "chat.settings.name": "Group name",
  "chat.settings.button": "Conversation settings",
  "chat.settings.title": "Conversation settings",
  "chat.settings.saving": "Saving settings...",
  "chat.settings.cancel": "Cancel",
  "chat.settings.save": "Save",

  // ── ChatWindowHeader ────────────────────────────────────────────────────────
  "chat.header.voiceCall": "Voice call",
  "chat.header.videoCall": "Video call",
  "chat.header.members": "Members",

  // ── PinnedMessages ──────────────────────────────────────────────────────────
  "chat.pinned.file": "File",
  "chat.pinned.message": "Message",
  "chat.pinned.title": "Pinned messages",
  "chat.pinned.unknownUser": "Unknown user",

  // ── ChatWindow ──────────────────────────────────────────────────────────────
  "chat.window.confirm": "Confirm",
  "chat.window.addingMembers": "Adding members...",
  "chat.window.removingMember": "Removing member...",
  "chat.window.defaultMember": "this member",
  "chat.window.removeMemberTitle": "Remove member?",
  "chat.window.removeMemberDescription": "Do you want to remove {name} from the conversation?",
  "chat.window.deleteMessageTitle": "Delete message?",
  "chat.window.deleteMessageDescription": "The message will be deleted for everyone in the conversation.",
  "chat.window.deleteMessagesTitle": "Delete messages?",
  "chat.window.deleteMessagesDescription": "The messages will be deleted for everyone in the conversation.",
  "chat.window.pickToStart": "Select a conversation to start messaging",
  "chat.window.noMessagesYet": "No messages yet. Start the conversation!",
  "chat.window.noMoreMessages": "No more messages",

  // ── ClientChatPage ──────────────────────────────────────────────────────────
  "chat.client.invalidLink": "Invalid link: no access token.",
  "chat.client.validateFailed": "Could not verify the access token.",
  "chat.client.invalidToken": "The access token is invalid or has expired.",

  // ── utils: room labels ──────────────────────────────────────────────────────
  "chat.util.loading": "Loading...",
  "chat.util.client": "Client",
  "chat.util.conversation": "Conversation",

  // ── hooks: mutation toasts + load errors ────────────────────────────────────
  "chat.toast.creatingRoom": "Creating conversation...",
  "chat.toast.updatingRoom": "Updating conversation...",
  "chat.toast.deletingRoom": "Deleting conversation...",
  "chat.toast.leavingRoom": "Leaving conversation...",
  "chat.error.loadRooms": "Failed to load conversations",
  "chat.error.loadRoom": "Failed to load the conversation",
  "chat.error.loadFiles": "Failed to load files",
};
