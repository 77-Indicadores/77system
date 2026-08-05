import { requirePermission } from "@/domains/rbac/guards";
import { prisma } from "@/lib/prisma";

/** How often to poll the DB for job status updates (ms). */
const POLL_INTERVAL_MS = 1_500;

/** Max stream duration — prevents orphaned SSE streams when clients disconnect silently. */
const STREAM_TIMEOUT_MS = 300_000; // 5 minutes

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission("system.jobs.view");
  const { id } = await params;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const deadline = Date.now() + STREAM_TIMEOUT_MS;

      while (Date.now() < deadline) {
        const job = await prisma.dataSyncJob.findUnique({
          where: { id },
          select: {
            status: true,
            progress: true,
            errorMessage: true,
            heartbeatAt: true,
            retryCount: true,
            maxRetries: true,
            rowsRead: true,
            rowsWritten: true,
          },
        });

        if (!job) {
          send("error", { message: "Job não encontrado", id });
          break;
        }

        send("update", { id, ...job });

        // Terminal states — stop streaming.
        if (job.status === "SUCCESS" || job.status === "FAILED") {
          break;
        }

        await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
