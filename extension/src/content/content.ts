// Content script that injects the Banano provider into web pages

// Inject the provider script into the page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  // Remove the script element after injection
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

// Inject at document_start to ensure it's available early
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin
  if (event.source !== window || !event.data) {
    return;
  }

  // Check if this is a Banano provider message
  if (event.data.source === 'banano-provider') {
    // Forward the message to the background script with origin information
    chrome.runtime.sendMessage({
      ...event.data,
      origin: window.location.origin
    }).then((response) => {
      // Send the response back to the injected script
      window.postMessage({
        source: 'banano-provider-response',
        id: event.data.id,
        response
      }, '*');
    }).catch((error) => {
      // Send error response back to the injected script
      window.postMessage({
        source: 'banano-provider-response',
        id: event.data.id,
        response: {
          success: false,
          error: error.message || 'Unknown error',
          code: 4900 // Disconnected
        }
      }, '*');
    });
  }
});

// Listen for provider events from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Forward provider events to the injected script
  if (request.source === 'banano-provider-event-broadcast') {
    window.postMessage({
      source: 'banano-provider-event',
      event: request.event,
      data: request.data
    }, '*');
  }
});
