"use client";

import { useEffect, useState } from "react";
import { subscribeUser, unsubscribeUser } from "@/app/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" fill="none">
      <path
        d="M10 2.5c-2.4 0-4.3 2-4.3 4.4v2.6c0 .5-.2 1-.6 1.4l-.9.9c-.5.5-.1 1.4.6 1.4h10.4c.7 0 1.1-.9.6-1.4l-.9-.9c-.4-.4-.6-.9-.6-1.4V6.9c0-2.4-1.9-4.4-4.3-4.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.25 : 0}
      />
      <path
        d="M8.1 15.8c.3.7 1 1.2 1.9 1.2s1.6-.5 1.9-1.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(true);

    let cancelled = false;
    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      if (!cancelled) setSubscribed(!!sub);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await unsubscribeUser(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } else {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) return;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await subscribeUser(JSON.parse(JSON.stringify(sub)));
        setSubscribed(true);
      }
    } catch {
      // Permission denied or subscribe failed — state just stays as-is.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={subscribed ? "Bildirimleri kapat" : "Bildirimleri aç"}
      title={subscribed ? "Bildirimler açık" : "Bildirimleri aç"}
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
        subscribed
          ? "border-gold/30 text-gold"
          : "border-white/[0.08] text-muted hover:border-white/20 hover:text-bone"
      }`}
    >
      <BellIcon filled={subscribed} />
    </button>
  );
}
