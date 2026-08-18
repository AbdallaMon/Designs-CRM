import { describe, expect, it } from "vitest";
import { normalizeNotificationLinkValue } from "../scripts/normalize-notification-links.mjs";

const targetOrigin = "https://crm.dreamstudiio.com";

describe("notification link normalization", () => {
  it("moves an exact legacy deal URL to the configured CRM origin", () => {
    expect(
      normalizeNotificationLinkValue(
        "https://dreamstudiio.com/dashboard/deals/2673",
        { targetOrigin },
      ),
    ).toBe("https://crm.dreamstudiio.com/dashboard/deals/2673");
  });

  it("rewrites legacy dashboard URLs embedded in notification HTML", () => {
    expect(
      normalizeNotificationLinkValue(
        '<a href="http://www.dreamstudiio.com/dashboard/projects/19?tab=contract">Open</a>',
        { targetOrigin },
      ),
    ).toBe(
      '<a href="https://crm.dreamstudiio.com/dashboard/projects/19?tab=contract">Open</a>',
    );
  });

  it("leaves public-site and already-migrated URLs unchanged", () => {
    expect(
      normalizeNotificationLinkValue(
        "https://dreamstudiio.com/projects/19",
        { targetOrigin },
      ),
    ).toBe("https://dreamstudiio.com/projects/19");
    expect(
      normalizeNotificationLinkValue(
        "https://crm.dreamstudiio.com/dashboard/deals/2673",
        { targetOrigin },
      ),
    ).toBe("https://crm.dreamstudiio.com/dashboard/deals/2673");
  });

  it("normalizes a trailing slash on the target origin", () => {
    expect(
      normalizeNotificationLinkValue(
        "https://dreamstudiio.com/dashboard/deals/2673",
        { targetOrigin: `${targetOrigin}/` },
      ),
    ).toBe("https://crm.dreamstudiio.com/dashboard/deals/2673");
  });
});
