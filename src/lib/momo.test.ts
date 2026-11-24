import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createMomoRequestSignature, verifyMomoCallback } from "./momo";

const secret = "local-test-secret";
const callback = {
  accessKey: "test-access-key",
  amount: "150000",
  extraData: "dXNlci0x",
  message: "Successful.",
  orderId: "TN-123",
  orderInfo: "TechNest TN-123",
  orderType: "momo_wallet",
  partnerCode: "test-partner",
  payType: "qr",
  requestId: "request-123",
  responseTime: "1700000000000",
  resultCode: 0,
  transId: "transaction-123",
};

function signCallback(value: typeof callback) {
  const raw = [
    `accessKey=${value.accessKey}`,
    `amount=${value.amount}`,
    `extraData=${value.extraData}`,
    `message=${value.message}`,
    `orderId=${value.orderId}`,
    `orderInfo=${value.orderInfo}`,
    `orderType=${value.orderType}`,
    `partnerCode=${value.partnerCode}`,
    `payType=${value.payType}`,
    `requestId=${value.requestId}`,
    `responseTime=${value.responseTime}`,
    `resultCode=${value.resultCode}`,
    `transId=${value.transId}`,
  ].join("&");
  return { ...value, signature: createHmac("sha256", secret).update(raw).digest("hex") };
}

test("verifies MoMo callback signatures and rejects tampered payment data", () => {
  const signed = signCallback(callback);
  assert.deepEqual(verifyMomoCallback(signed, secret), signed);
  assert.equal(verifyMomoCallback({ ...signed, amount: "1" }, secret), null);
});

test("rejects malformed or invalid MoMo signatures", () => {
  assert.equal(verifyMomoCallback({ ...callback, signature: "not-a-signature" }, secret), null);
  assert.equal(verifyMomoCallback({}, secret), null);
});

test("signs MoMo requests using the documented parameter order", () => {
  const request = {
    accessKey: "access",
    amount: "1000",
    extraData: "data",
    ipnUrl: "https://shop.example/api/ipn",
    orderId: "order-1",
    orderInfo: "TechNest order-1",
    partnerCode: "partner",
    redirectUrl: "https://shop.example/result",
    requestId: "request-1",
    requestType: "captureWallet",
  };
  const raw = "accessKey=access&amount=1000&extraData=data&ipnUrl=https://shop.example/api/ipn&orderId=order-1&orderInfo=TechNest order-1&partnerCode=partner&redirectUrl=https://shop.example/result&requestId=request-1&requestType=captureWallet";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");

  assert.equal(createMomoRequestSignature(request, secret), expected);
});
