import { requireUserId } from "@/lib/guards";
import { isConversationMember } from "@/lib/messages";
import { subscribe } from "@/lib/messageStream";

export const dynamic = "force-dynamic";

// Server-Sent Events stream for one conversation — pushes new messages the
// instant they're sent, so the chat feels realtime without a websocket
// server. A slow polling interval stays in ChatThread as a fallback in case
// the stream drops (spec's own suggestion: "polling can remain the fallback").
export async function GET(req, { params }) {
  const me = await requireUserId();
  if (!me) return new Response("Unauthorized", { status: 401 });
  if (!(await isConversationMember(params.id, me))) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller already closed (client disconnected) — nothing to do.
        }
      };
      send("connected", {});
      unsubscribe = subscribe(params.id, (message) => send("message", message));
      // Keep the connection alive through proxies/load balancers that time out idle streams.
      heartbeat = setInterval(() => send("ping", {}), 25000);
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
