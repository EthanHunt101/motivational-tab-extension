// newtab.js

// ---------- DOM HOOKS ----------
const quoteEl = document.getElementById("quoteText");
const authorEl = document.getElementById("quoteAuthor");
const nextBtn  = document.getElementById("nextBtn");
const copyBtn  = document.getElementById("copyBtn");
const blankBtn = document.getElementById("blankBtn");
const toastEl  = document.getElementById("toast");

// ---------- STATE ----------
let quotes = [];
let lastIndex = -1;

// ---------- HELPERS ----------
function showToast(message = "Copied!") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1600);
}

function pickRandomIndex() {
  if (!quotes.length) return -1;
  if (quotes.length === 1) return 0;
  let i = Math.floor(Math.random() * quotes.length);
  // Avoid immediate repeat
  if (i === lastIndex) {
    i = (i + 1) % quotes.length;
  }
  return i;
}

function renderQuote(q) {
  if (!q) return;
  quoteEl.textContent = q.text || "";
  const author = (q.author && q.author.trim()) ? q.author.trim() : "Unknown";
  authorEl.textContent = `— ${author}`;
}

function showRandomQuote() {
  const i = pickRandomIndex();
  if (i === -1) return;
  lastIndex = i;
  renderQuote(quotes[i]);
}

// ---------- ACTIONS ----------
async function loadQuotes() {
  try {
    const url = chrome.runtime.getURL("data/quotes.json");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Expecting: [{ text: "...", author: "..." }, ...]
    quotes = Array.isArray(data) ? data.filter(
      q => q && typeof q.text === "string" && q.text.trim().length > 0
    ) : [];

    if (!quotes.length) {
      throw new Error("No valid quotes found in quotes.json");
    }

    showRandomQuote();
  } catch (err) {
    console.error("Failed to load quotes:", err);
    quoteEl.textContent = "Unable to load quotes.";
    authorEl.textContent = "";
  }
}

async function copyCurrentQuote() {
  try {
    const text = quoteEl?.textContent?.trim() ?? "";
    const author = authorEl?.textContent?.trim() ?? "";
    const full = author ? `${text} ${author}` : text;
    await navigator.clipboard.writeText(full);
    showToast("Copied!");
  } catch (err) {
    console.error("Copy failed:", err);
    showToast("Copy failed");
  }
}

function openBlankPageNewTab() {
  // New tab (recommended)
  window.open("about:blank", "_blank", "noopener,noreferrer");
  // If you prefer same tab, use:
  // window.location.href = "about:blank";
}

// ---------- EVENT WIRING ----------
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();

  if (nextBtn)  nextBtn.addEventListener("click", showRandomQuote);
  if (copyBtn)  copyBtn.addEventListener("click", copyCurrentQuote);
  if (blankBtn) blankBtn.addEventListener("click", openBlankPageNewTab);
});
