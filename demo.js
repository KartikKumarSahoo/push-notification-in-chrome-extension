const SAMPLE_IMAGE_URL =
  "https://images.unsplash.com/photo-1535026863073-a1548986abeb?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=c315a1440ad485512983e51b479e648d&auto=format&fit=crop&w=800&q=60";

const iframeContent = `<!DOCTYPE html><html>
  <head>
    <style>
      html,body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <img style="max-width:100%" src="${SAMPLE_IMAGE_URL}">
  </body>
</html>`;

const iframe = document.getElementById("iframe");
iframe.contentWindow.document.open();
iframe.contentWindow.document.write(iframeContent);
iframe.contentWindow.document.close();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js", { scope: "/" });
}

const loadAndCacheButton = document.getElementById("btn");
const imageUrlInput = document.getElementById("imgurl");
const image = document.getElementById("img");
loadAndCacheButton.addEventListener("click", () => {
  image.src = imageUrlInput.value;
  console.log("Image submitted for cache", imageUrlInput.value);
});

// document
//   .getElementById("enable-notification")
//   .addEventListener("click", askPermission);

// Asks for Notification permission
function askPermission() {
  return new Promise(function (resolve, reject) {
    const permissionPromise = Notification.requestPermission(function (result) {
      // Failing due to Insecure environment
      resolve(result);
    });

    if (permissionPromise) {
      permissionPromise.then(resolve, reject);
    }
  }).then(function (permissionResult) {
    console.log("PERMISSION GIVEN", permissionResult);
    if (permissionResult !== "granted") {
      throw new Error("We weren't granted permission.");
    }
  });
}

function askExtensionPermission() {
  // Permissions must be requested from inside a user gesture, like a button's click handler.
  return new Promise((resolve, reject) => {
    chrome.permissions.request(
      {
        permissions: ["notifications"],
        // origins: ["http://www.google.com/"],
      },
      function (granted) {
        // The callback argument will be true if the user granted the permissions.
        if (granted) {
          console.log("PERMISSION GRANTED");
          resolve(granted);
        } else {
          console.log("PERMISSION DENIED");
          reject(new Error("Permission denied"));
        }
      }
    );
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const publicVapidKey =
  "BHXrtFb4UX_m9SLQmQFftb5fmQt9YQSW2zsWnS93IH1abyuFSOy86tem10hSYLYPnKxAA6V1ZVChwgQk4ItkgZc";

const enableNotification = document.querySelector("#enable-notification");
const disableNotification = document.querySelector("#disable-notification");

// Disable from push notification
async function unsubscribeFromNotifications() {
  if ("serviceWorker" in navigator) {
    const sw = await navigator.serviceWorker.ready;
    sw.pushManager.getSubscription().then(function (subscription) {
      subscription &&
        subscription
          .unsubscribe()
          .then(function (successful) {
            // You've successfully unsubscribed
          })
          .catch(function (e) {
            // Unsubscription failed
          });
    });
    showEnableSubscriptionButton();
  }
}

async function checkForPermission(perm) {
  return new Promise(function (resolve, reject) {
    chrome.permissions.contains(
      {
        permissions: [perm],
        // origins: ['http://www.google.com/']
      },
      function (isPermissionAlreadyGiven) {
        if (isPermissionAlreadyGiven) {
          // The extension has the permissions.
          resolve(isPermissionAlreadyGiven);
        } else {
          // The extension doesn't have the permissions.
          reject(new Error("Asked permission is not granted."));
        }
      }
    );
  });
}

async function removePermission(perm) {
  return new Promise(function (resolve, reject) {
    chrome.permissions.remove(
      {
        permissions: [perm],
        // origins: ['http://www.google.com/']
      },
      function (isPermissionRemoved) {
        if (isPermissionRemoved) {
          // The permissions have been removed.
          resolve(isPermissionRemoved);
          console.log("Permission removed.");
        } else {
          // The permissions have not been removed (e.g., you tried to remove
          // required permissions).
          reject(
            new Error("Required/mandatory permission can not be removed.")
          );
        }
      }
    );
  });
}

disableNotification.addEventListener("click", async () => {
  await removePermission("notifications").catch((error) =>
    console.error(error)
  );
  await unsubscribeFromNotifications().catch((error) => console.error(error));
});

// Handle enabling push notification
async function subscribeUserToReceiveNotification() {
  if ("serviceWorker" in navigator) {
    const sw = await navigator.serviceWorker.ready;

    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    await fetch("http://localhost:5000/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Hide the enable button and store the flag in localStorage
    showDisableSubscriptionButton();
  } else {
    console.error("Service workers are not supported in this browser");
  }
}

enableNotification.addEventListener("click", async () => {
  // await askPermission(); // This doesn't work for optional permission
  await askExtensionPermission().catch((error) => console.error(error));
  await subscribeUserToReceiveNotification().catch((error) =>
    console.error(error)
  );
});

checkForPermission("notifications")
  .then((isGranted) => console.log("is notification permitted?", isGranted))
  .catch((err) => console.error(err));

if (localStorage.getItem("isSubscribed") !== "true") {
  showEnableSubscriptionButton();
} else {
  showDisableSubscriptionButton();
}

function showEnableSubscriptionButton() {
  enableNotification.classList.remove("hidden");
  disableNotification.classList.add("hidden");
  localStorage.setItem("isSubscribed", "false");
}

function showDisableSubscriptionButton() {
  enableNotification.classList.add("hidden");
  disableNotification.classList.remove("hidden");
  localStorage.setItem("isSubscribed", "true");
}