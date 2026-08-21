import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listStudioPhotoOccupancy = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ excludeBookingId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { listStudioPhotoOccupancy: load } = await import("./availability.server");
    return load(data.excludeBookingId ? { excludeBookingId: data.excludeBookingId } : undefined);
  });

export const listActingSessions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ excludeBookingId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { listActingSessions: load } = await import("./availability.server");
    return load(data.excludeBookingId ? { excludeBookingId: data.excludeBookingId } : undefined);
  });
