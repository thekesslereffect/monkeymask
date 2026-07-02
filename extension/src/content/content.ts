import {
  PROTOCOL_SOURCE_REQUEST,
  PROTOCOL_SOURCE_RESPONSE,
  PROTOCOL_SOURCE_EVENT,
} from '@monkeymask/wallet-standard';

const PAGE_ORIGIN = window.location.origin;

const isValidProtocolRequest = (
  data: unknown,
): data is { source: string; id: number; method: string; params?: Record<string, unknown> } => {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    candidate.source === PROTOCOL_SOURCE_REQUEST &&
    typeof candidate.id === 'number' &&
    typeof candidate.method === 'string'
  );
};

const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};
(document.head || document.documentElement).appendChild(script);

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== PAGE_ORIGIN || !event.data) {
    return;
  }

  if (isValidProtocolRequest(event.data)) {
    chrome.runtime
      .sendMessage({
        ...event.data,
        origin: window.location.origin,
      })
      .then((response) => {
        window.postMessage(
          {
            source: PROTOCOL_SOURCE_RESPONSE,
            id: event.data.id,
            response,
          },
          PAGE_ORIGIN,
        );
      })
      .catch((error) => {
        window.postMessage(
          {
            source: PROTOCOL_SOURCE_RESPONSE,
            id: event.data.id,
            response: {
              success: false,
              error: error.message || 'Unknown error',
              code: 4900,
            },
          },
          PAGE_ORIGIN,
        );
      });
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.source === 'monkeymask-provider-event-broadcast') {
    window.postMessage(
      {
        source: PROTOCOL_SOURCE_EVENT,
        event: request.event,
        data: request.data,
      },
      PAGE_ORIGIN,
    );
  }
});
