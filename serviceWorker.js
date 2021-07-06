const CACHE_NAME = "basho-0.0.5";

console.log("ready for fetches", CACHE_NAME);
self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("install", (event) => {
  event.waitUntil(
    // We open a cache…
    caches.open(CACHE_NAME)
  );
});

self.addEventListener("fetch", function (event) {
  console.log("fetch event");
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        console.log("fake match", response);
        return response;
      }

      return fetch(event.request).then(function (response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          if (response)
            console.log("not basic", response.type, response.status);
          else console.log("no response");
          return response;
        }
        return caches.open(CACHE_NAME).then(function (cache) {
          console.log("fake put", event.request);
          // cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
