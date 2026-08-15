import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { lookupPlaces, lookupRegion } from "./places.server";

export type PlaceSuggestion = { description: string };

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().trim().min(3).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => lookupPlaces(data.query));

export const searchRegion = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().trim().min(2).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => lookupRegion(data.query));
