console.log("BACKGROUND SCRIPT IS RUNNING");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js", { scope: "/" });

  // navigator.serviceWorker.addEventListener("message", (event) => {
  //   console.log(event.data.msg, event.data.url);
  //   chrome.runtime.sendMessage({ text: event.data.msg });
  // });
}

// NOTE: THIS DOESN'T WORK. "push" event can't be listened from scripts other than service worker
// Push listener and notifier code
// self.addEventListener("push", function (event) {
//   console.log("PUSH LISTENER FROM BACKGROUND SCRIPT");
//   if (event.data) {
//     // NOTE: permissions can be asked incrementally as and when required using chrome.permissions API
//     const promiseChain = self.registration.showNotification(event.data.text(), {
//       icon:
//         "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRNrgvNfkjHrlyeQNkI5YC9NIqgsDZcyLXftg&usqp=CAU",
//     }); // Refer this for more options: https://developers.google.com/web/fundamentals/push-notifications/display-a-notification
//     event.waitUntil(promiseChain);
//   } else {
//     console.log("This push event has no data.");
//   }
// });

// Handle notifications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Inside background script message handler", message);
  if (message.type === "notification") {
    chrome.notifications.create(message.options);
  } else {
    // Sets badge of the extension
    // NOTE: chrome.browserAction doesn't work without adding "browser_actions" in manifest file
    chrome.browserAction.setBadgeText({ text: message.text });

    // Sets extension title that appears on hover
    chrome.browserAction.setTitle({ title: message.text });

    // More info: https://developer.chrome.com/extensions/browserAction#method-setTitle
  }
  sendResponse(true); // Synchronously send response
  // return true; If you want to call the sendResponse asynchronously then return true from here.
});

// !NOTE : This listener reacts to client.postMessage from Service worker
navigator.serviceWorker.addEventListener("message", (event) => {
  // debugger;
  console.log("FROM SERVICE WORKER SCRIPT", event.data.msg, event.data.url);
  chrome.browserAction.setBadgeText({ text: event.data.msg });
});

if (!!window.EventSource) {
  var source = new EventSource("http://localhost:5000/countdown", {
    withCredentials: true,
  });

  source.addEventListener(
    "message",
    function (e) {
      console.log("SSE: ON MESSAGE", e);
    },
    false
  );

  source.addEventListener(
    "open",
    function (e) {
      console.log("SSE: ON OPEN", e);
    },
    false
  );

  source.addEventListener(
    "error",
    function (e) {
      console.log("SSE: ON ERROR", e);
      // if (this.readyState == EventSource.CONNECTING) {
      //   console.log(`Reconnecting (readyState=${this.readyState})...`);
      // } else {
      //   console.log("Error has occured.");
      // }
    },
    false
  );
}
