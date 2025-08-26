const EventEmitter = require('events');

// Create a singleton event bus
const eventBus = new EventEmitter();

// Set higher limit for listeners if needed
//eventBus.setMaxListeners(20);

module.exports = eventBus;
