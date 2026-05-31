// modules/payment/stripe.ts
import type { CreatePaymentInput, CreatePaymentResult, PaymentAdapter } from './types';

// 创建 Stripe 适配器（必须保留这个函数）
export function createStripeAdapter() {
    return {
        createPayment: async (input: CreatePaymentInput): Promise<CreatePaymentResult> => {
            // 这里直接跳转到 baidu.com
            return {
                payUrl: "https://baidu.com",
                paymentOrderNo: "stripe_test_" + Date.now()
            };
        },
        // Webhook 处理（可以保持原样或简化）
        handleWebhook: async (event: any, env: any) => {
            console.log("Stripe webhook received (mock)");
            return { success: true };
        }
    } as PaymentAdapter;
}
