const { EventEmitter } = require("node:events");

function createEventBus() {
  const emitter = new EventEmitter();

  function subscribe(eventType, listener) {
    emitter.on(eventType, (payload) => {
      Promise.resolve()
        .then(() => listener(payload, eventType))
        .catch((err) => console.error(`[events] listener for ${eventType} failed:`, err));
    });
  }

  function publish(eventType, payload) {
    emitter.emit(eventType, payload);
  }

  return { subscribe, publish };
}

module.exports = { createEventBus };
