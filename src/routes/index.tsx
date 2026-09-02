import { createFileRoute, redirect } from "@tanstack/react-router";
import { IMAGES } from "@/assets/images";
import { StudioBookingFlow } from "@/components/studio/StudioBookingFlow";
import { parseStudioOfferingParam, STUDIO_OFFERING_SLUG } from "@/config/studio/offerings";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    offering: typeof search.offering === "string" ? search.offering : undefined,
    session: typeof search.session === "string" ? search.session : undefined,
    booking: typeof search.booking === "string" ? search.booking : undefined,
    paid: typeof search.paid === "string" ? search.paid : undefined,
    preview: typeof search.preview === "string" ? search.preview : undefined,
    motion: typeof search.motion === "string" ? search.motion : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.booking && search.paid) return;
    const offering = parseStudioOfferingParam(search.offering ?? search.session);
    if (!offering) return;
    throw redirect({
      to: "/$offering",
      params: { offering: STUDIO_OFFERING_SLUG[offering] },
    });
  },
  head: () => ({
    meta: [
      { title: "Studio 7 Miami · Book" },
      {
        name: "description",
        content:
          "Book studio rentals, portraits, sports media, headshots, passport photos, and acting class at Studio 7 Miami. Pick a session, sign, and pay.",
      },
      { property: "og:title", content: "Studio 7 Miami · Book" },
      {
        property: "og:description",
        content:
          "Studio rentals, portraits, sports media, headshots, and class — book your studio session.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: IMAGES.og },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "409" },
      { property: "og:image:alt", content: "Studio 7 Miami" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Studio 7 Miami · Book" },
      { name: "twitter:image", content: IMAGES.og },
    ],
  }),
  component: Index,
});

function Index() {
  return <StudioBookingFlow />;
}
