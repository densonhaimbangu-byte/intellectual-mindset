import { describe, it, expect } from "vitest";
import { orderPaymentState, orderReference, mergeSlips } from "../order-slips";
import type { OrderRecord } from "../orders";

describe("order slips", () => {
  it("does not treat an unpaid request as payment proof", () => {
    expect(orderPaymentState({ status: "new" })).toBe("Payment not confirmed");
    expect(orderPaymentState({ status: "awaiting_payment" })).toBe("Payment not confirmed");
  });
  it("confirms payment only from confirmed order status", () => {
    expect(orderPaymentState({ status: "paid" })).toBe("Payment confirmed");
    expect(orderPaymentState({ status: "cancelled" })).toBe("Cancelled");
  });
  it("keeps distinct full order references", () => {
    expect(orderReference("12345678-0000-0000-0000-000000000001")).not.toBe(orderReference("12345678-0000-0000-0000-000000000002"));
  });
  it("uses the stored order's latest status instead of the browser snapshot", () => {
    const local = { id: "a", status: "new", created_at: "2026-11-12" } as OrderRecord;
    expect(mergeSlips([local], [{ ...local, status: "paid" }])[0]?.status).toBe("paid");
  });
});