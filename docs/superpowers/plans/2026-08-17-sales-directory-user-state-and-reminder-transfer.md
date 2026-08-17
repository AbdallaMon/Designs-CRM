# Sales directory, user state, and transferred reminders — Plan

1. Add regression tests for multi-profile directory filtering, local user-row reconciliation,
   transferred reminder ownership, reminder queue scope, and sent-header error delegation.
2. Allow `users/all-users` to accept a comma-separated assigned-profile union and request
   `NORMAL_SALES,PRIMARY_SALES` from the convert picker.
3. Replace the profile-dialog browser reload with an immutable local row update; make user identity
   edits merge into the existing management row.
4. Include current lead ownership in reminder-owner lookups and allow creator, current owner, or
   full lead scope to update calls/meetings.
5. Change staff call/meeting list and summary filters to creator OR current lead owner, and keep
   `SUPER_SALES` on the unscoped full-lead view.
6. Guard the Express error handler when headers were already sent.
7. Run focused tests/lint, the complete suite, endpoint parity, and the web build; then update
   `PROJECT_STATE.md` with the verified result.

