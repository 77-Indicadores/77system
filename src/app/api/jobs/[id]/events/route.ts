import { requirePermission } from "@/domains/rbac/guards";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("system.jobs.view");
  const { id } = await params;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const progress of [0, 25, 50, 75, 100]) {
        controller.enqueue(encoder.encode(`event: progress\ndata: ${JSON.stringify({ id, progress })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
