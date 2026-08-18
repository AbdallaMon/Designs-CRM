import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NextActionLine } from "../WorkStageCardSignals.jsx";

describe("WorkStage NextActionLine", () => {
  it("makes a missing task or delivery explicit", () => {
    const html = renderToStaticMarkup(
      React.createElement(NextActionLine, {
        cardMeta: { nextAction: null, overdue: false },
      }),
    );

    expect(html).toContain("Next: No task or delivery scheduled");
  });

  it("labels the next task clearly", () => {
    const html = renderToStaticMarkup(
      React.createElement(NextActionLine, {
        cardMeta: {
          nextAction: { kind: "TASK", title: "Render living room", dueAt: null },
          overdue: false,
        },
      }),
    );

    expect(html).toContain("Next: Render living room");
  });
});

