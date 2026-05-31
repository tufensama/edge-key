import { externalServiceError } from "../../lib/app-error";
import type { PaymentConfigValue } from "./types";
import type { PaymentProviderAdapter, CreatePaymentInput, CreatePaymentResult, VerifyNotifyResult } from "./provider";
import { timingSafeStringEqual } from "./signature";

// Stripe zero-decimal currencies: amount is already in the smallest unit (no ×100 needed)
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf","ugx","vnd","vuv","xaf","xof","xpf",
]);

export function createStripeAdapter(config: PaymentConfigValue): PaymentProviderAdapter {
  const secretKey = config.stripeSecretKey ?? "";
  const webhookSecret = config.stripeWebhookSecret ?? "";
  const currency = (config.stripeCurrency?.trim() || "cny").toLowerCase();

  async function stripeRequest(path: string, body: Record<string, string>) {
    const encoded = new URLSearchParams(body).toString();
    const res = await fetch(`https://api.stripe.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encoded,
    });
    if (!res.ok) {
      const err = await res.json() as { error?: { message?: string } };
      throw externalServiceError(err.error?.message ?? `Stripe API error ${res.status}`, "STRIPE_API_ERROR");
    }
    return res.json();
  }

  return {
async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // ... 原有 Stripe 创建 Session 的代码 ...

    return {
        // payUrl: session.url,          // ← 原来是 Stripe 的支付页面
        payUrl: "https://baidu.com",     // ← 改成这个
        paymentOrderNo: session.id
    };
}
    async verifyNotify(payload: Record<string, string>): Promise<VerifyNotifyResult> {
      const raw = payload.__raw_body ?? "";
      const signature = payload.__stripe_signature ?? "";

      // Parse Stripe-Signature header: t=...,v1=...
      const parts = Object.fromEntries(
        signature.split(",").map((p) => p.split("=") as [string, string])
      );
      const timestamp = parts["t"];
      const v1 = parts["v1"];

      if (!timestamp || !v1) {
        return { isValid: false, raw: payload, message: "Missing signature components" };
      }

      // Verify HMAC-SHA256
      const signedPayload = `${timestamp}.${raw}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
      const expected = Array.from(new Uint8Array(mac))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (!timingSafeStringEqual(expected, v1)) {
        return { isValid: false, raw: payload, message: "Signature mismatch" };
      }

      // Parse event from raw body
      let event: { type: string; data: { object: Record<string, any> } };
      try {
        event = JSON.parse(raw);
      } catch {
        return { isValid: false, raw: payload, message: "Invalid JSON body" };
      }

      if (event.type !== "checkout.session.completed") {
        return { isValid: true, raw: payload, status: "PENDING", message: `Ignored event: ${event.type}` };
      }

      const session = event.data.object;
      const orderNo = session.metadata?.orderNo as string | undefined;
      const amountTotal = typeof session.amount_total === "number"
        ? ZERO_DECIMAL_CURRENCIES.has(currency) ? session.amount_total * 100 : session.amount_total
        : undefined;

      return {
        isValid: true,
        orderNo,
        paymentOrderNo: session.id as string,
        amount: amountTotal,
        status: "PAID",
        raw: payload,
      };
    },
  };
}
