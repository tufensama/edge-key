// modules/payment/stripe.ts
import type { CreatePaymentInput, CreatePaymentResult } from './types';

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // 这里直接返回百度跳转，不走真实的 Stripe 支付
    return {
        payUrl: "https://baidu.com",        // ← 这里改成百度
        paymentOrderNo: "test_" + Date.now()
    };
}

// 如果文件里还有其他函数，保留它们
export async function handleStripeWebhook(event: any, env: any) {
    // Webhook 可以暂时不改，或者直接返回成功
    return { success: true };
}
