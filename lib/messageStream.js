import { EventEmitter } from "events";

// In-process pub/sub for realtime message delivery via Server-Sent Events.
// This works because the app runs as a single persistent Node server — same
// assumption lib/upload.js already makes for local-disk uploads. A
// multi-instance or serverless deployment would need a shared bus (e.g.
// Redis pub/sub) instead; note that in DEPLOY.md if this app ever scales
// past one instance.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function subscribe(conversationId, callback) {
  const event = `conversation:${conversationId}`;
  emitter.on(event, callback);
  return () => emitter.off(event, callback);
}

export function publish(conversationId, message) {
  emitter.emit(`conversation:${conversationId}`, message);
}
