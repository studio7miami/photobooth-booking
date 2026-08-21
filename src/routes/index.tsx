import { createFileRoute } from "@tanstack/react-router";
import { IMAGES } from "@/assets/images";
import { StudioBookingFlow } from "@/components/studio/StudioBookingFlow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Book Studio 7 Miami" },
      {
        name: "description",
        content:
          "Book portraits, headshots, passport photos, and acting class at Studio 7 Miami. Pick a session, sign, and pay.",
      },
      { property: "og:title", content: "Book Studio 7 Miami" },
      {
        property: "og:description",
        content: "Portraits, headshots, passport photos, and class — book your studio session.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: IMAGES.og },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "409" },
      { property: "og:image:alt", content: "Studio 7 Miami" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Book Studio 7 Miami" },
      { name: "twitter:image", content: IMAGES.og },
    ],
  }),
  component: Index,
});

function Index() {
  return <StudioBookingFlow />;
}
