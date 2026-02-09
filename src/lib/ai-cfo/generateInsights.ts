import { CFOInsight, DigitsSnapshot, GADelta, AdsDelta } from "./types";

interface Thresholds {
  revenueDropPct: number;
  profitDropPct: number;
  expensesIncreasePct: number;
  sessionsDropPct: number;
  usersDropPct: number;
  conversionsDropPct: number;
}

const DEFAULT_THRESHOLDS: Thresholds = {
  revenueDropPct: -20,
  profitDropPct: -10,
  expensesIncreasePct: 10,
  sessionsDropPct: -20,
  usersDropPct: -20,
  conversionsDropPct: -10,
};

export function generateAICFOMessages(
  digits: DigitsSnapshot,
  gaDelta: GADelta,
  adsDelta?: AdsDelta,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): CFOInsight[] {
  const insights: CFOInsight[] = [];

  // Helper to set severity dynamically based on magnitude
  const calcSeverity = (pctChange: number): "low" | "medium" | "high" => {
    const absPct = Math.abs(pctChange);
    if (absPct >= 50) return "high";
    if (absPct >= 20) return "medium";
    return "low";
  };

  // --- 1️⃣ Revenue Alerts ---
  if (digits.revenuePct <= thresholds.revenueDropPct) {
    let message = `Revenue dropped ${Math.abs(digits.revenuePct).toFixed(
      2
    )}% this month.`;

    const investigations: string[] = [];
    if (gaDelta.sessionsPct < 0) {
      message += ` Traffic also decreased ${Math.abs(
        gaDelta.sessionsPct
      ).toFixed(2)}%, suggesting fewer visitors drove the decline.`;
      investigations.push(
        "Review paid vs organic traffic changes",
        "Check if ad campaigns were paused or reduced",
        "Confirm site uptime or deployment issues"
      );
    }
    if (gaDelta.conversionsPct < 0) {
      message += ` Conversions dropped ${Math.abs(
        gaDelta.conversionsPct
      ).toFixed(2)}%, consider checkout flow or promotion changes.`;
      investigations.push(
        "Check pricing or promotions",
        "Review checkout funnel",
        "Investigate campaign targeting"
      );
    }

    insights.push({
      id: "rev_drop_combined",
      type: "alert",
      title: "Revenue decline detected",
      message,
      relatedMetrics: ["revenue", "sessions", "conversions"],
      severity: calcSeverity(digits.revenuePct),
      requiresResponse: false,
      followUpQuestions: [
        "Were any marketing campaigns paused or reduced?",
        "Any pricing changes this month?",
        "Any external events affecting traffic or sales?"
      ],
      status: "open",
      advisorFlag: "review_recommended",
      suggestedInvestigations: investigations,
    });
  }

  // --- 2️⃣ Profit Alerts ---
  if (digits.profitPct <= thresholds.profitDropPct) {
    const message = `Profit decreased ${Math.abs(
      digits.profitPct
    ).toFixed(2)}% this month. Review revenue, expenses, and cost drivers.`;

    insights.push({
      id: "profit_drop",
      type: "alert",
      title: "Profit decreased",
      message,
      relatedMetrics: ["profit", "revenue", "expenses"],
      severity: calcSeverity(digits.profitPct),
      requiresResponse: true,
      followUpQuestions: [
        "Which expenses contributed to the profit drop?",
        "Any revenue streams underperforming?",
        "Were there any operational issues affecting profit?"
      ],
      status: "open",
      advisorFlag: "urgent_review",
      suggestedInvestigations: [
        "Review revenue per channel",
        "Audit major expense categories",
        "Investigate one-off costs or write-offs"
      ],
    });
  }

  // --- 3️⃣ Expenses Questions ---
  if (digits.expensesPct < 0) {
    insights.push({
      id: "expenses_positive",
      type: "positive",
      title: "Expenses decreased",
      message: `Expenses decreased ${Math.abs(digits.expensesPct).toFixed(
        2
      )}%. Profit improved as a result.`,
      relatedMetrics: ["expenses", "profit"],
      severity: "low",
      requiresResponse: false,
      followUpQuestions: [],
    });
    insights.push({
      id: "expenses_question",
      type: "question",
      title: "Expense reduction confirmation",
      message: "Verify if any expenses were intentionally paused or delayed this month.",
      relatedMetrics: ["expenses"],
      severity: "medium",
      requiresResponse: true,
      followUpQuestions: [
        "Which expenses were paused or reduced?",
        "Was the reduction temporary or permanent?"
      ],
      status: "open",
      advisorFlag: "none",
      suggestedInvestigations: ["Check expense reports or approvals"],
    });
  }

  // --- 4️⃣ Conversion Alerts ---
  if (gaDelta.conversionsPct <= thresholds.conversionsDropPct) {
    insights.push({
      id: "conversions_drop",
      type: "alert",
      title: "Conversions dropped",
      message: `Conversions dropped ${Math.abs(
        gaDelta.conversionsPct
      ).toFixed(2)}%. Investigate checkout flow, promotions, or campaign changes.`,
      relatedMetrics: ["conversions"],
      severity: calcSeverity(gaDelta.conversionsPct),
      requiresResponse: false,
      followUpQuestions: [
        "Were there changes in checkout flow?",
        "Any promotions running this month?",
        "Check for website errors or outages affecting conversion"
      ],
      status: "open",
      advisorFlag: "review_recommended",
      suggestedInvestigations: [
        "Review marketing campaigns",
        "Audit website funnel",
        "Check checkout analytics"
      ],
    });
  }

  // --- 5️⃣ Traffic & Users Alerts ---
  if (gaDelta.sessionsPct <= thresholds.sessionsDropPct) {
    insights.push({
      id: "sessions_drop",
      type: "alert",
      title: "Traffic drop",
      message: `Sessions dropped ${Math.abs(gaDelta.sessionsPct).toFixed(
        2
      )}% this month.`,
      relatedMetrics: ["sessions"],
      severity: calcSeverity(gaDelta.sessionsPct),
      requiresResponse: false,
      followUpQuestions: ["Investigate marketing channels", "Check seasonality"],
      status: "open",
      advisorFlag: "review_recommended",
      suggestedInvestigations: [
        "Review paid vs organic traffic",
        "Check ad campaigns",
        "Confirm website uptime"
      ],
    });
  }

  if (gaDelta.usersPct <= thresholds.usersDropPct) {
    insights.push({
      id: "users_drop",
      type: "alert",
      title: "Unique users decrease",
      message: `Unique users decreased ${Math.abs(gaDelta.usersPct).toFixed(2)}%.`,
      relatedMetrics: ["users"],
      severity: calcSeverity(gaDelta.usersPct),
      requiresResponse: false,
      followUpQuestions: ["Investigate audience reach and marketing channels"],
      status: "open",
      advisorFlag: "review_recommended",
      suggestedInvestigations: [
        "Review marketing campaigns",
        "Check acquisition channels",
        "Compare with previous periods"
      ],
    });
  }

  // --- 6️⃣ Ads vs Traffic Correlation ---
  if (adsDelta && gaDelta.sessionsPct < 0) {
    if (adsDelta.spendPct < 0) {
      insights.push({
        id: "ads_drop_traffic",
        type: "alert",
        title: "Traffic vs Ad spend",
        message: `Website traffic declined ${Math.abs(
          gaDelta.sessionsPct
        ).toFixed(2)}% while ad spend dropped ${Math.abs(adsDelta.spendPct).toFixed(
          2
        )}%. Reduced marketing likely contributed.`,
        relatedMetrics: ["sessions", "ads"],
        severity: calcSeverity(gaDelta.sessionsPct),
        requiresResponse: false,
        followUpQuestions: [
          "Which campaigns were paused?",
          "Was ad targeting modified?"
        ],
        status: "open",
        advisorFlag: "review_recommended",
        suggestedInvestigations: [
          "Check ad campaign schedule",
          "Review targeting or budget changes",
          "Compare ad spend ROI"
        ],
      });
    } else if (adsDelta.spendPct > 0 && adsDelta.clicksPct < 0) {
      insights.push({
        id: "ads_spend_clicks_mismatch",
        type: "alert",
        title: "Ad performance anomaly",
        message: `Ad spend increased ${adsDelta.spendPct.toFixed(
          2
        )}% but clicks dropped ${Math.abs(adsDelta.clicksPct).toFixed(2)}%.`,
        relatedMetrics: ["ads", "clicks"],
        severity: calcSeverity(adsDelta.clicksPct),
        requiresResponse: false,
        followUpQuestions: [
          "Review campaign targeting",
          "Check ad creative fatigue"
        ],
        status: "open",
        advisorFlag: "review_recommended",
        suggestedInvestigations: [
          "Audit ad campaigns",
          "Compare impressions vs clicks",
          "Review creative performance"
        ],
      });
    }
  }

  return insights;
}
