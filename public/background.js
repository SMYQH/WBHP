// WBHP background service worker — browser-native auto-update helper.
// Packaged installs use manifest update_url; this just nudges the browser
// periodically and reloads when an update is ready.

const ALARM_NAME = "wbhp-update-check";
const PERIOD_MINUTES = 360; // 6 hours

function schedule() {
  try {
    if (typeof chrome !== "undefined" && chrome.alarms && typeof chrome.alarms.create === "function") {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: PERIOD_MINUTES });
    }
  } catch {
    // alarms may be unavailable in some contexts
  }
}

function requestUpdate() {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.requestUpdateCheck === "function") {
      chrome.runtime.requestUpdateCheck((status) => {
        if (status === "update_available") {
          try {
            chrome.runtime.reload();
          } catch {
            // ignore
          }
        }
      });
    }
  } catch {
    // ignore
  }
}

if (typeof chrome !== "undefined" && chrome.runtime) {
  if (chrome.runtime.onInstalled && typeof chrome.runtime.onInstalled.addListener === "function") {
    chrome.runtime.onInstalled.addListener(() => {
      schedule();
      requestUpdate();
    });
  }

  if (chrome.runtime.onStartup && typeof chrome.runtime.onStartup.addListener === "function") {
    chrome.runtime.onStartup.addListener(() => {
      schedule();
      requestUpdate();
    });
  }

  if (chrome.runtime.onUpdateAvailable && typeof chrome.runtime.onUpdateAvailable.addListener === "function") {
    chrome.runtime.onUpdateAvailable.addListener(() => {
      try {
        chrome.runtime.reload();
      } catch {
        // ignore
      }
    });
  }
}

if (
  typeof chrome !== "undefined" &&
  chrome.alarms &&
  chrome.alarms.onAlarm &&
  typeof chrome.alarms.onAlarm.addListener === "function"
) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === ALARM_NAME) {
      requestUpdate();
    }
  });
}

