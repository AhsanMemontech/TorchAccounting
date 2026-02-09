// app/api/financial-summary/route.ts
import { getDigitsToken } from "@/lib/digits";

type LedgerCategory = {
  id: string;
  name: string;
  type: string; // Assets, Income, Expenses, CostOfGoodsSold, etc
};

type LedgerEntry = {
  id: string;
  amount: { amount: number; code: string };
  type: "Debit" | "Credit";
  description: string;
  category: LedgerCategory;
};

type LedgerEntryDetail = {
  transactionId: string;
  date: string;
  entry: LedgerEntry;
};

type DigitsEntriesResponse = {
  entryDetails: LedgerEntryDetail[];
  next?: any;
};

type FinancialSummary = {
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  profit: number;
};

export async function GET(req: Request) {
  try {
    const token = await getDigitsToken();
    if (!token) {
      return new Response(JSON.stringify({ error: "Failed to get access token" }), { status: 500 });
    }

    const url = new URL("https://connect.digits.com/v1/ledger/entries");

    // Get query params from request URL
    const { searchParams } = new URL(req.url, "http://localhost");
    const occurred_after = searchParams.get("occurred_after");
    const occurred_before = searchParams.get("occurred_before");

    if (occurred_after) url.searchParams.append("occurred_after", occurred_after);
    if (occurred_before) url.searchParams.append("occurred_before", occurred_before);

    // Fetch ledger entries
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Digits API error:", text);
      return new Response(JSON.stringify({ error: "Failed to fetch financial data" }), { status: response.status });
    }

    const data: DigitsEntriesResponse = await response.json();

    // Initialize totals
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;

    // console.log("==================");
    // console.log("data:", JSON.stringify(data, null, 2));
    // console.log("==================");
    const entryDetails = data.entryDetails ?? [];

    entryDetails.forEach((detail) => {
      const entry = detail.entry;
      const amount = entry.amount.amount;

      switch (entry.category.type) {
        case "Income":
        case "OtherIncome":
          totalRevenue += entry.type === "Credit" ? amount : -amount;
          break;

        case "CostOfGoodsSold":
          totalCOGS += entry.type === "Debit" ? amount : -amount;
          break;

        case "Expenses":
        case "OtherExpenses":
          totalExpenses += entry.type === "Debit" ? amount : -amount;
          break;

        default:
          break;
      }
    });

    const profit = totalRevenue - totalCOGS - totalExpenses;

    return new Response(JSON.stringify({ totalRevenue, totalCOGS, totalExpenses, profit }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}