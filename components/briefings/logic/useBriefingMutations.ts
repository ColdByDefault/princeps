import { useState } from "react";
import { toast } from "sonner";
import type { BriefingRecord } from "@/types/api";

type Translations = {
  generateSuccess: string;
  generateError: string;
};

export function useBriefingMutations(
  setBriefing: React.Dispatch<React.SetStateAction<BriefingRecord | null>>,
  t: Translations,
) {
  const [generating, setGenerating] = useState(false);

  async function regenerateBriefing() {
    setGenerating(true);
    try {
      const res = await fetch("/api/briefings", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { briefing: BriefingRecord };
      setBriefing(data.briefing);
      toast.success(t.generateSuccess);
      return true;
    } catch {
      toast.error(t.generateError);
      return false;
    } finally {
      setGenerating(false);
    }
  }

  return { regenerateBriefing, generating };
}
