/* Knowledge Bud — service worker.
 * Handles Web Push events. Kept tiny on purpose. */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Knowledge Bud", body: "New research is in.", url: "/feed" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    // ignore
  }
  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/feed" },
    tag: "kb-digest",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/feed";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.endsWith(target) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
