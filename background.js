console.log("BACKGROUND SCRIPT IS RUNNING");

// Push listener and notifier code
self.addEventListener("push", function (event) {
  console.log("PUSH LISTENER FROM BACKGROUND SCRIPT");
  if (event.data) {
    // NOTE: permissions can be asked incrementally as and when required using chrome.permissions API
    const promiseChain = self.registration.showNotification(event.data.text(), {
      icon:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRNrgvNfkjHrlyeQNkI5YC9NIqgsDZcyLXftg&usqp=CAU",
    }); // Refer this for more options: https://developers.google.com/web/fundamentals/push-notifications/display-a-notification
    event.waitUntil(promiseChain);
  } else {
    console.log("This push event has no data.");
  }
});

// Handle notifications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugger;
  if (message.type === "notification") {
    chrome.notifications.create(message.options);
  }
  sendResponse(true); // Synchronously send response
  // return true; If you want to call the sendResponse asynchronously then return true from here.
});
