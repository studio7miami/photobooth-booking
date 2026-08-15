import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listOccupancy = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({}).parse(data ?? {}))
  .handler(async () => {
    const { listOccupancy: load } = await import("./availability.server");
    return load();
  });
