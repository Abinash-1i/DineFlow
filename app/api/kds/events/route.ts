import { NextRequest } from "next/server";
import { kdsEvents, KDSEventPayload } from "@/lib/kds-events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection packet
      const initPayload = {
        type: "CONNECTED",
        timestamp: new Date().toISOString(),
        message: "Real-time DineFlow KDS synchronization active",
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initPayload)}\n\n`));

      // Event listener for KDS updates
      const onKDSEvent = (event: KDSEventPayload) => {
        try {
          const chunk = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream might be closed
        }
      };

      kdsEvents.on("kds_event", onKDSEvent);

      // Keep-alive heartbeat ping every 25 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        kdsEvents.off("kds_event", onKDSEvent);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // Ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
