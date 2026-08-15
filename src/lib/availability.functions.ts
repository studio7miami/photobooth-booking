import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listOccupancy = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ excludeBookingId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { listOccupancy: load } = await import("./availability.server");
    return load(data.excludeBookingId ? { excludeBookingId: data.excludeBookingId } : undefined);
  });
