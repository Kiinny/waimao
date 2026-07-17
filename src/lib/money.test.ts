import { describe, expect, it } from "vitest";

import {
  calculateProfit,
  convertMoney,
  moneySnapshot,
} from "@/lib/money";

describe("money", () => {
  it("converts source currency to USD without floating-point drift", () => {
    expect(convertMoney("1234.56", "0.13721")).toBe("169.3939776");
  });

  it("captures source and base amounts with the exchange rate", () => {
    expect(moneySnapshot("100.10", "CNY", "0.14")).toEqual({
      amount: "100.10",
      currency: "CNY",
      exchangeRateToUsd: "0.14",
      amountUsd: "14.014",
    });
  });

  it("calculates profit and margin from decimal-safe values", () => {
    expect(calculateProfit("999.99", "654.32")).toEqual({
      revenueUsd: "999.99",
      costUsd: "654.32",
      profitUsd: "345.67",
      marginPercent: "34.567345673456734567",
    });
  });

  it("returns a zero margin when revenue is zero", () => {
    expect(calculateProfit("0", "10").marginPercent).toBe("0");
  });

  it("rejects non-positive exchange rates", () => {
    expect(() => convertMoney("10", "0")).toThrow(
      "Exchange rate must be greater than zero",
    );
  });
});
