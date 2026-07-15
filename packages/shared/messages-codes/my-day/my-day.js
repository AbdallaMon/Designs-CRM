// my-day surface message CODES (language-neutral; FE resolves to English).
export const myDayMessagesCodes = {
  MY_DAY_FETCHED: "MY_DAY_FETCHED",
  MY_DAY_TEAM_FETCHED: "MY_DAY_TEAM_FETCHED",
  MY_DAY_UNCLAIMED_FETCHED: "MY_DAY_UNCLAIMED_FETCHED",
  // The caller's profile has no queue family (defensive — route gates should prevent this).
  MY_DAY_PROFILE_UNSUPPORTED: "MY_DAY_PROFILE_UNSUPPORTED",
  // A SUPER_SALES supervisor tried to drill into a non-sales user (403).
  MY_DAY_TEAM_SCOPE_DENIED: "MY_DAY_TEAM_SCOPE_DENIED",
  MY_DAY_TARGET_NOT_FOUND: "MY_DAY_TARGET_NOT_FOUND",
};
