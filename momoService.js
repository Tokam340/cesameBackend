// momoService.js
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE = process.env.MTN_BASE_URL; // e.g. https://sandbox.momodeveloper.mtn.com
const SUBSCRIPTION_KEY = process.env.MTN_PRIMARY_KEY;
const API_USER_ID = process.env.MTN_API_USER_ID; // may be undefined
const API_KEY = process.env.MTN_API_KEY; // may be undefined
const TARGET_ENV = process.env.MTN_TARGET_ENV || "sandbox";
const CALLBACK_HOST = process.env.CALLBACK_HOST; // public url for callbacks

// 1) Create API user (one-time)
export async function createApiUserIfNeeded() {
  if (API_USER_ID && API_USER_ID.length > 5) {
    return { apiUserId: API_USER_ID };
  }
  const referenceId = uuidv4();
  const url = `${BASE}/v1_0/apiuser`;
  const body = { providerCallbackHost: CALLBACK_HOST };
  const headers = {
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
    "X-Reference-Id": referenceId,
  };
  const resp = await axios.post(url, body, { headers });
  // resp.status === 201
  return { apiUserId: referenceId };
}

// 2) Create API key for an API user
export async function createApiKey(apiUserId) {
  // if you already have API_KEY in env, return it
  if (API_KEY && API_KEY.length > 5) return { apiKey: API_KEY };
  const url = `${BASE}/v1_0/apiuser/${apiUserId}/apikey`;
  const headers = {
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
  };
  const resp = await axios.post(url, {}, { headers });
  // resp.data: { apiKey: 'xxxx' }
  return { apiKey: resp.data.apiKey };
}

// 3) Get OAuth token using Basic <apiUser:apiKey> base64 and subscription key
export async function getOauthToken(apiUserId, apiKey) {
  const url = `${BASE}/collection/token/`;
  const basic = Buffer.from(`${apiUserId}:${apiKey}`).toString("base64");
  const headers = {
    Authorization: `Basic ${basic}`,
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
  };
  const resp = await axios.post(url, {}, { headers });
  // resp.data.access_token
  return resp.data.access_token;
}

// 4) Request to Pay
export async function requestToPay({ amount, phone, externalId }) {
  const transactionId = externalId || uuidv4();
  // apiUserId & apiKey must exist
  const apiUserId = process.env.MTN_API_USER_ID;
  const apiKey = process.env.MTN_API_KEY;
  // If env lacks apiUser/apiKey, assume caller set them before (server code will handle)
  // Build headers: Authorization: Bearer <token> + Ocp-Apim-Subscription-Key + X-Reference-Id
  const token = await getOauthToken(apiUserId, apiKey);
  const url = `${BASE}/collection/v1_0/requesttopay`;
  const body = {
    amount: String(amount),
    currency: "XAF",
    externalId: transactionId,
    payer: { partyIdType: "MSISDN", partyId: phone },
    payerMessage: "Paiement",
    payeeNote: "Achat",
  };
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Reference-Id": transactionId,
    "X-Target-Environment": TARGET_ENV,
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
  };
  const resp = await axios.post(url, body, { headers });
  return { transactionId, raw: resp.data, status: resp.status };
}

// 5) Check payment status
export async function checkRequestToPay(transactionId) {
  const apiUserId = process.env.MTN_API_USER_ID;
  const apiKey = process.env.MTN_API_KEY;
  const token = await getOauthToken(apiUserId, apiKey);
  const url = `${BASE}/collection/v1_0/requesttopay/${transactionId}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Target-Environment": TARGET_ENV,
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
  };
  const resp = await axios.get(url, { headers });
  return resp.data;
}
