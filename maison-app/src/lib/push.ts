import "server-only";
import webpush, { type PushSubscription } from "web-push";
import { deletePushSubscription, loadPushSubscriptions } from "@/lib/db";

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails("mailto:hello@maison.app", publicKey, privateKey);
}

// Broadcasts to every stored subscription (this is a single-user app, but
// a person can have the PWA installed on more than one device) — a send
// failure on one dead subscription shouldn't stop the others, and a
// 404/410 response means the browser revoked it, so it gets cleaned up.
// Shared by the client-triggered test send (app/actions.ts) and the
// server-side cron notification route.
export async function sendPushToAll(title: string, body: string) {
  configureWebPush();
  const subscriptions = (await loadPushSubscriptions()) as PushSubscription[];
  if (subscriptions.length === 0) {
    return { success: false, error: "No subscriptions" };
  }

  const payload = JSON.stringify({ title, body, icon: "/icon" });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription(sub.endpoint);
        }
        throw error;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { success: sent > 0, sent, total: subscriptions.length };
}
