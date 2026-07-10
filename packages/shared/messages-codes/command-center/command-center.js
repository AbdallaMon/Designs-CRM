// command-center module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: commandCenterMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here. Covers the read-only ADMIN/SUPER_ADMIN operational
// cockpit (`GET /v2/command-center/overview`).
export const commandCenterMessagesCodes = {
  COMMAND_CENTER_FETCHED: "COMMAND_CENTER_FETCHED",
};
