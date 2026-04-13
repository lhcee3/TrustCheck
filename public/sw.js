// XpressBank Service Worker — background push + notification handling

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Handle push events from server (background notifications)
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  const title = data.title ?? "⚠️ XpressBank Alert";
  const options = {
    body: data.body ?? "A high-risk transaction was detected.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "fraud-alert",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: "/xpressbank/dashboard" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Open app when notification is clicked
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/xpressbank/dashboard";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes("xpressbank"));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
