export const UTILITY_DESIGN = {
  probability: 0.5,
  rAmount: 0,
  RAmount: 100,
  initialXPrev: 200,
  sequenceCount: 6,
  increments: [20, 50, 80, 120, 180, 260, 380, 550, 800, 1150, 1650],
};

export function buildUtilityRows(xPrev) {
  return UTILITY_DESIGN.increments.map((increment, index) => ({
    row: index + 1,
    increment,
    xCandidate: Math.round(xPrev + increment),
  }));
}

export function evaluateUtilitySwitch(rows, choices, xPrev) {
  const firstMissingRow = rows.find((row) => !choices[row.row]);
  if (firstMissingRow) {
    return {
      ok: false,
      message: "切り替え点を選択してください",
    };
  }

  const firstBIndex = rows.findIndex((row) => choices[row.row] === "B");
  const hasAAfterB =
    firstBIndex >= 0 && rows.slice(firstBIndex + 1).some((row) => choices[row.row] === "A");

  if (hasAAfterB) {
    return {
      ok: false,
      message: "選択は くじΑ から くじΒ へ一度だけ切り替わる形にしてください",
    };
  }

  if (firstBIndex === -1) {
    const lastRow = rows[rows.length - 1];
    return {
      ok: true,
      status: "above_range",
      estimate: lastRow.xCandidate,
      lower: lastRow.xCandidate,
      upper: null,
    };
  }

  if (firstBIndex === 0) {
    const firstRow = rows[0];
    return {
      ok: true,
      status: "below_range",
      estimate: Math.round((xPrev + firstRow.xCandidate) / 2),
      lower: null,
      upper: firstRow.xCandidate,
    };
  }

  const lower = rows[firstBIndex - 1].xCandidate;
  const upper = rows[firstBIndex].xCandidate;
  return {
    ok: true,
    status: "bracketed",
    estimate: Math.round((lower + upper) / 2),
    lower,
    upper,
  };
}
