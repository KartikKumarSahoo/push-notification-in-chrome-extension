const express = require("express");
const webpush = require("web-push");
const faker = require("faker");
const path = require("path");

require("dotenv").config();

// const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
// const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
const publicVapidKey =
  "BHXrtFb4UX_m9SLQmQFftb5fmQt9YQSW2zsWnS93IH1abyuFSOy86tem10hSYLYPnKxAA6V1ZVChwgQk4ItkgZc";
const privateVapidKey = "kCZpMUEl-WOBClgNXBY9wnX2RtoR723wAw-4ORV_X3o";

// Replace with your email
webpush.setVapidDetails(
  "mailto:kartikmca09@gmail.com",
  publicVapidKey,
  privateVapidKey
);

const app = express();
let subscriptions = []; // Should be stored in DB

app.use(require("body-parser").json());

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
  triggerNotification(subscription, {
    title: "Yay!! Push Notification is now enabled.",
  });
});

app.get("/trigger-notification", (req, res) => {
  if (subscriptions.length === 0) console.log("NO SUBSCRIPTIONS AVAILABLE.");

  subscriptions.forEach((subscription) => {
    triggerNotification(subscription, { title: faker.lorem.words(5) });
  });
  res.status(200).send();
});

app.get("/countdown", function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  global.sseConnection = res;
  global.count = 20;
  countdown(res, 10);
});

app.get("/trigger-sse-countdown", (req, res) => {
  if (count === 0) {
    console.log("NO MORE SSE.");
    sseConnection.end();
  }
  sseCountdown();
  console.log("COUNT", count);
  res.end();
});

app.get("/trigger-sse", (req, res) => {
  sseConnection.write("data: " + faker.lorem.words(4) + "\n\n");
  console.log("SSE sent");
  res.end();
});

app.get("/close-sse", (req, res) => {
  console.log("Closing SSE connection", count);
  sseConnection.end();
  res.end();
});

function sseCountdown() {
  sseConnection.write("data: " + count + "\n\n");
  console.log("COUNTDOWN", count);
  count--;
}

function countdown(res, count) {
  res.write("data: " + count + "\n\n");
  if (count) setTimeout(() => countdown(res, count - 1), 1000);
  // else res.end();
}

const triggerNotification = (subscription, notifPayload) => {
  const payload = JSON.stringify(notifPayload);
  // console.log(subscription);

  // Send the notification payload to Push Server
  webpush.sendNotification(subscription, payload).catch((error) => {
    console.error(error.stack);
  });
};

// app.use(require("express-static")("./"));
app.use(express.static(path.join(__dirname, "static")));

app.listen(process.env.PORT || 5000);
