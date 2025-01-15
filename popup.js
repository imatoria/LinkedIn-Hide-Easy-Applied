const statusElem = document.getElementById("status");
const successCount = document.getElementById("successCount");
const failCount = document.getElementById("failCount");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

// Update status text in UI
function updateStatus(isStopped) {
  statusElem.textContent = `Status: ${!isStopped ? "Running" : "Stopped"}`;

  startButton.disabled = !isStopped;
  stopButton.disabled = isStopped;
}

// Update counts in UI
function updateCounts(jobSuccessCount, jobFailCount) {
  successCount.textContent = jobSuccessCount;
  failCount.textContent = jobFailCount;
}

function start() {
  updateStatus(false);
  sendMessage(false);
}

function stop() {
  updateStatus(true);
  sendMessage(true);
}

// Button click listeners
startButton.addEventListener("click", start);

stopButton.addEventListener("click", stop);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateCounts") {
    updateCounts(message.successCount, message.failCount);
  } else if (message.action === "stop") {
    stop();
  }
});

// Send a message to the content script only if a tab is active
function sendMessage(isStopped) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]) {
      // Ensure the tab exists
      await chrome.tabs.sendMessage(tabs[0].id, { isStopped: isStopped });
      if (chrome.runtime.lastError) {
        console.error("Error sending message to content script:", chrome.runtime.lastError.message);
      }
    } else {
      console.error("No active tab found.");
    }
  });
}
