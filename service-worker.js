const ASSET_CACHE = "appAssets";
const RUNTIME = "runtime";

// No need to cache local resources since this is a chrome-extension
const ASSET_CACHE_URLS = ["https://unpkg.com/tailwindcss/dist/tailwind.css"];

const ctx = self;
// Push listener and notifier code
self.addEventListener("push", function (event) {
  if (event.data) {
    console.log("PUSH PAYLOAD", event.data.json());
    self.pushPayload = event.data;
    const pushPayload = event.data.json();
    // NOTE: permissions can be asked incrementally as and when required using chrome.permissions API
    const promiseChain = self.registration.showNotification(pushPayload.title, {
      icon:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRNrgvNfkjHrlyeQNkI5YC9NIqgsDZcyLXftg&usqp=CAU",
    }); // Refer this for more options: https://developers.google.com/web/fundamentals/push-notifications/display-a-notification
    event.waitUntil(promiseChain);

    // Send message to extension
    // console.log(chrome.runtime);
    // chrome.runtime
    //   .getBackgroundClient((client) => console.log(client))
    //   .then((bgClient) => {
    //     console.log(bgClient);
    //     // ctx.bgClient = bgClient;
    //     // bgClient.postMessage("HI");

    //     // bgClient.postMessage({
    //     //   msg: "Hey I just got a fetch from you!",
    //     //   url: "event.request.url",
    //     // });
    //   });

    // Send message from SW to host window/client
    self.clients
      .matchAll({
        includeUncontrolled: true,
        type: "window",
      })
      .then((clients) => {
        if (clients && clients.length) {
          // Send a response - the clients
          // array is ordered by last focused
          clients.forEach((client) => {
            client.postMessage({
              msg: pushPayload.title,
            });
          });
        }
      });

    // NOTE: sendMessage doesn't exist in chrome.runtime
    // chrome.runtime.sendMessage("your extension id will be here", {
    //   data: { anyDataKey: "example" },
    // });
  } else {
    console.log("This push event has no data.");
  }
});

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(ASSET_CACHE)
      .then((cache) => cache.addAll(ASSET_CACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
  const currentCaches = [ASSET_CACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener("fetch", (event) => {
  // self.req = event.request;
  // console.log(event.request);

  if (
    event.request.cache === "only-if-cached" &&
    event.request.mode !== "same-origin"
  ) {
    return;
  }

  if (event.request.method !== "GET") return;

  // skip requests from chrome extensions
  if (event.request.url.indexOf("chrome-extension") === -1) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Cache hit case
        if (cachedResponse) {
          return cachedResponse;
        }

        // Handle cache miss
        return caches.open(RUNTIME).then((cache) => {
          return fetch(event.request).then((response) => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  } else {
    // not caching
    return fetch(event.request).then((response) => response);
  }
});
