import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slotInput = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(540),
  excludeBookingId: z.string().uuid().optional(),
});

export const listBookableShooters = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slotInput.parse(data))
  .handler(async ({ data }) => {
    const { listBookableShooters: load } = await import("./shooters.server");
    return load(data);
  });
