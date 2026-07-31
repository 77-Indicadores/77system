"use client";

import { useFormStatus } from "react-dom";
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
