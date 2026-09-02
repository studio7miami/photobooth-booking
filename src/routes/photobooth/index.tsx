import { createFileRoute } from "@tanstack/react-router";
import { socialPreviewMeta } from "@/assets/images";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const Route = createFileRoute("/photobooth/")({
  head: () => ({
    meta: [
      { title: "Studio 7 Photobooth · Book" },
      {
        name: "description",
        content:
          "Book Studio 7 Miami's photo booth in minutes. Choose your experience, pick your date, sign, and secure it with a deposit.",
      },
      { property: "og:title", content: "Studio 7 Photobooth · Book" },
      {
        property: "og:description",
        content:
          "Choose your experience, pick your date, and lock in your event with Studio 7 Miami.",
      },
      { property: "og:type", content: "website" },
      ...socialPreviewMeta("photobooth"),
      { name: "twitter:title", content: "Studio 7 Photobooth · Book" },
    ],
  }),
  component: PhotoboothIndex,
});

function PhotoboothIndex() {
  return <BookingFlow />;
}
