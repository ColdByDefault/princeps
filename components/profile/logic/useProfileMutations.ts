/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { useState } from "react";
import { toast } from "sonner";

type Translations = {
  updateSuccess: string;
  updateError: string;
  usernameTaken: string;
};

type UpdateProfileInput = {
  name?: string;
  username?: string;
};

export function useProfileMutations(
  onSuccess: (name: string | null, username: string | null) => void,
  t: Translations,
) {
  const [updating, setUpdating] = useState(false);

  async function updateProfile(input: UpdateProfileInput): Promise<boolean> {
    setUpdating(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (res.status === 409) {
        toast.error(t.usernameTaken);
        return false;
      }

      if (!res.ok) throw new Error();

      const data = (await res.json()) as {
        name: string | null;
        username: string | null;
      };
      onSuccess(data.name, data.username);
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(false);
    }
  }

  return { updating, updateProfile };
}
