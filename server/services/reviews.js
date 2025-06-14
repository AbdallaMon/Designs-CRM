import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  "",
  "",
  "http://localhost:4000/shared/oauth2callback"
);

export function createAuthUrl() {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/business.manage"],
  });
  console.log(url, "url");
  return url;
}

export async function handleOAuthCallback(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    await oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (e) {
    console.log(e, "tokens er");
  }
}
export async function getLocations() {
  const myBusinessAccountManagement = google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
  });

  const myBusinessInfo = google.mybusinessbusinessinformation({
    version: "v1",
    auth: oauth2Client,
  });

  try {
    // Get account list
    const accountsRes = await myBusinessAccountManagement.accounts.list();
    const account = accountsRes.data.accounts[0];

    // Get locations
    const locationsRes = await myBusinessInfo.locations.list({
      parent: account.name, // e.g., "accounts/123456789"
    });

    return {
      accountId: account.name,
      locations: locationsRes.data.locations,
    };
  } catch (e) {
    console.error("Error fetching locations:", e);
  }
}

export async function getReviews(accountId, locationId) {
  const myBusiness = google.mybusiness({
    version: "v4",
    auth: oauth2Client,
  });

  const res = await myBusiness.accounts.locations.reviews.list({
    parent: `${accountId}/${locationId}`, // e.g., "accounts/123456789/locations/987654321"
  });

  return res.data.reviews;
}
