"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      {!pending && <RefreshCcw className="mr-2 size-3.5" />}
      {pending ? "Sincronizando..." : "Sincronizar agora"}
    </Button>
  );
}

export function SaveScheduleButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {pending ? "Salvando..." : "Salvar cron"}
    </Button>
  );
}

/** Live clock showing current time, updated every second. */
export function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", { timeStyle: "medium", timeZone: "America/Sao_Paulo" });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 font-mono text-sm tabular-nums text-muted-foreground">
      <span className="inline-block size-1.5 rounded-full bg-green-500 animate-pulse" />
      {time}
    </div>
  );
}

/**
 * Polls router.refresh() every INTERVAL ms while there are active jobs
 * (QUEUED or RUNNING). Stops automatically when all jobs reach a terminal state.
 * Rendered once per page — receives the count of active jobs from the server.
 */
export function JobsLivePoller({ activeJobCount }: { activeJobCount: number }) {
  const router = useRouter();
  const countRef = useRef(activeJobCount);
  countRef.current = activeJobCount;

  useEffect(() => {
    if (countRef.current === 0) return;

    const INTERVAL = 2_000;
    const id = setInterval(() => {
      router.refresh();
    }, INTERVAL);

    return () => clearInterval(id);
    // Re-run when activeJobCount reaches 0 so we clear the interval
  }, [activeJobCount === 0, router]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
