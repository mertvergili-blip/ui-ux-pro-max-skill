"use server";

import type { PushSubscription } from "web-push";
import { savePushSubscription, deletePushSubscription } from "@/lib/db";
import { sendPushToAll } from "@/lib/push";

export async function subscribeUser(subscription: PushSubscription) {
  await savePushSubscription(subscription.endpoint, subscription);
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  await deletePushSubscription(endpoint);
  return { success: true };
}

export async function sendNotification(title: string, body: string) {
  return sendPushToAll(title, body);
}
