// Minimal service worker. Two jobs:
// 1. Having a registered fetch handler is part of Chrome's PWA
//    "installability" criteria — without one, the native install
//    prompt / "Add to Home Screen" banner doesn't reliably appear on
//    Android, even with a valid manifest.
// 2. Handle incoming Web Push events and notification taps.
//
// Deliberately no offline caching here — this app's data (finance
// prices, runway news, AI text) is always meant to be fresh, so a
// cache-first strategy would just serve stale content. A pure
// passthrough still satisfies the criteria above.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Maison", body: event.data.text() };
  }
  const options = {
    body: data.body,
    icon: data.icon || "/icon",
    badge: "/icon",
    vibrate: [100, 50, 100],
    data: { url: "/" },
  };
  event.waitUntil(self.registration.showNotification(data.title || "Maison", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
