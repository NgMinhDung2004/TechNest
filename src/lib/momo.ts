import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const momoCallbackSchema = z.object({
  accessKey: z.string(),
  amount: z.union([z.string(), z.number()]),
  extraData: z.string(),
  message: z.string(),
  orderId: z.string(),
  orderInfo: z.string(),
  orderType: z.string(),
  partnerCode: z.string(),
  payType: z.string(),
  requestId: z.string(),
  responseTime: z.union([z.string(), z.number()]),
  resultCode: z.number(),
  transId: z.union([z.string(), z.number()]),
  signature: z.string(),
});

export type MomoCallback = z.infer<typeof momoCallbackSchema>;

export function getMomoConfig() {
  const partnerCode = process.env.MOMO_PARTNER_CODE?.trim();
  const accessKey = process.env.MOMO_ACCESS_KEY?.trim();
  const secretKey = process.env.MOMO_SECRET_KEY;
  const appBaseUrl = process.env.APP_BASE_URL?.trim();

  if (!partnerCode || !accessKey || !secretKey || !appBaseUrl) {
    throw new Error("Missing MoMo configuration. Set MOMO credentials and APP_BASE_URL.");
  }

  const baseUrl = new URL(appBaseUrl);
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("APP_BASE_URL must use HTTPS in production.");
  }

  const endpoint = process.env.MOMO_API_URL?.trim()
    || "https://test-payment.momo.vn/v2/gateway/api/create";
  const apiUrl = new URL(endpoint);
  if (
    apiUrl.protocol !== "https:"
    || !["test-payment.momo.vn", "payment.momo.vn"].includes(apiUrl.hostname)
  ) {
    throw new Error("MOMO_API_URL must use an official MoMo HTTPS endpoint.");
  }

  return {
    partnerCode,
    accessKey,
    secretKey,
    baseUrl: baseUrl.origin,
    endpoint: apiUrl.toString(),
  };
}

function sign(raw: string, secretKey: string) {
  return createHmac("sha256", secretKey).update(raw).digest("hex");
}

export function createMomoRequestSignature(
  input: {
    accessKey: string;
    amount: string;
    extraData: string;
    ipnUrl: string;
    orderId: string;
    orderInfo: string;
    partnerCode: string;
    redirectUrl: string;
    requestId: string;
    requestType: string;
  },
  secretKey: string,
) {
  const raw = [
    `accessKey=${input.accessKey}`,
    `amount=${input.amount}`,
    `extraData=${input.extraData}`,
    `ipnUrl=${input.ipnUrl}`,
    `orderId=${input.orderId}`,
    `orderInfo=${input.orderInfo}`,
    `partnerCode=${input.partnerCode}`,
    `redirectUrl=${input.redirectUrl}`,
    `requestId=${input.requestId}`,
    `requestType=${input.requestType}`,
  ].join("&");

  return sign(raw, secretKey);
}

export function verifyMomoCallback(value: unknown, secretKey: string) {
  const parsed = momoCallbackSchema.safeParse(value);
  if (!parsed.success) return null;

  const callback = parsed.data;
  const raw = [
    `accessKey=${callback.accessKey}`,
    `amount=${callback.amount}`,
    `extraData=${callback.extraData}`,
    `message=${callback.message}`,
    `orderId=${callback.orderId}`,
    `orderInfo=${callback.orderInfo}`,
    `orderType=${callback.orderType}`,
    `partnerCode=${callback.partnerCode}`,
    `payType=${callback.payType}`,
    `requestId=${callback.requestId}`,
    `responseTime=${callback.responseTime}`,
    `resultCode=${callback.resultCode}`,
    `transId=${callback.transId}`,
  ].join("&");

  const expected = Buffer.from(sign(raw, secretKey), "hex");
  const received = Buffer.from(callback.signature, "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  return callback;
}

export async function createMomoPayment(input: {
  orderNumber: string;
  requestId: string;
  amount: number;
  userId: string;
}) {
  const config = getMomoConfig();
  const amount = String(input.amount);
  const orderInfo = `TechNest ${input.orderNumber}`;
  const extraData = Buffer.from(input.userId).toString("base64");
  const requestType = "captureWallet";
  const redirectUrl = new URL(
    `/checkout/result?order=${encodeURIComponent(input.orderNumber)}`,
    config.baseUrl,
  ).toString();
  const ipnUrl = new URL("/api/payments/momo/ipn", config.baseUrl).toString();
  const request = {
    partnerCode: config.partnerCode,
    accessKey: config.accessKey,
    requestId: input.requestId,
    amount,
    orderId: input.orderNumber,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    lang: "vi",
    signature: createMomoRequestSignature(
      {
        accessKey: config.accessKey,
        amount,
        extraData,
        ipnUrl,
        orderId: input.orderNumber,
        orderInfo,
        partnerCode: config.partnerCode,
        redirectUrl,
        requestId: input.requestId,
        requestType,
      },
      config.secretKey,
    ),
  };

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(15000),
  });
  const data: unknown = await response.json().catch(() => null);
  const parsed = z.object({
    resultCode: z.number(),
    payUrl: z.string().url().optional(),
    message: z.string().optional(),
  }).passthrough().safeParse(data);

  if (!response.ok || !parsed.success || parsed.data.resultCode !== 0 || !parsed.data.payUrl) {
    const message = parsed.success ? parsed.data.message : undefined;
    throw new Error(`MoMo payment creation failed${message ? `: ${message}` : "."}`);
  }

  const payUrl = new URL(parsed.data.payUrl);
  if (
    payUrl.protocol !== "https:"
    || !["test-payment.momo.vn", "payment.momo.vn"].includes(payUrl.hostname)
  ) {
    throw new Error("MoMo returned an unexpected payment URL.");
  }

  return parsed.data.payUrl;
}
