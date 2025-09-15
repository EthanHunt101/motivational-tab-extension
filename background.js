// background.js (MV3 service worker)

// Simple in-memory cache of quotes while the worker is alive
let QUOTES = [];
let lastIndex = -1;

// Load quotes from the packaged file
async function loadQuotes() {
  try {
    const url = chrome.runtime.getURL("data/quotes.json");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    QUOTES = Array.isArray(data)
      ? data.filter(q => q && typeof q.text === "string" && q.text.trim())
      : [];
  } catch (err) {
    console.error("Failed to load quotes:", err);
    QUOTES = [];
  }
}

// Pick a random quote, avoiding immediate repeat
function pickQuote() {
  if (!QUOTES.length) return null;
  if (QUOTES.length === 1) return QUOTES[0];
  let i = Math.floor(Math.random() * QUOTES.length);
  if (i === lastIndex) i = (i + 1) % QUOTES.length;
  lastIndex = i;
  return QUOTES[i];
}

// Rate-limit so we don't spam notifications if multiple tabs open quickly
let lastShownAt = 0;
const MIN_INTERVAL_MS = 2500;

async function maybeShowNotificationForTab(tab) {
  // Only trigger on Chrome's new tab creation
  const isNewTab =
    tab?.pendingUrl === "chrome://newtab/" ||
    tab?.url === "chrome://newtab/" ||
    tab?.title === "New Tab";

  if (!isNewTab) return;

  const now = Date.now();
  if (now - lastShownAt < MIN_INTERVAL_MS) return; // throttle
  lastShownAt = now;

  if (!QUOTES.length) await loadQuotes();
  const q = pickQuote();
  if (!q) return;

  const author = q.author && q.author.trim() ? ` — ${q.author.trim()}` : "";

  // Notifications API (shows top-right on most desktops)
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/icon128.png",
    title: "MoTABational",
    message: `${q.text}${author}`
  }, () => {
    // Auto-close after ~5s on most platforms; if you want guaranteed timeout on Windows:
    setTimeout(() => {
      // You can clear the last created notification by ID if you store it.
      // Leaving as-is for simplicity; many platforms auto-dismiss.
    }, 5000);
  });
}

// Listen for new tabs
chrome.tabs.onCreated.addListener((tab) => {
  // Service workers can spin down; ensure quotes are ready
  maybeShowNotificationForTab(tab);
});

// Optional: warm load on install/update
chrome.runtime.onInstalled.addListener(() => {
  loadQuotes();
});