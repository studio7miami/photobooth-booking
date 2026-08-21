import { createFileRoute } from "@tanstack/react-router";
import { IMAGES } from "@/assets/images";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const Route = createFileRoute("/photobooth/")({
  head: () => ({
    meta: [
      { title: "Book Your Photobooth" },
      {
        name: "description",
        content:
          "Book Studio 7 Miami's photo booth in minutes. Choose your experience, pick your date, sign, and secure it with a deposit.",
      },
      { property: "og:title", content: "Book Your Photobooth" },
      {
        property: "og:description",
        content:
          "Choose your experience, pick your date, and lock in your event with Studio 7 Miami.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: IMAGES.ogPhotobooth },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "409" },
      { property: "og:image:alt", content: "Studio 7 Miami photobooth" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Book Your Photobooth" },
      { name: "twitter:image", content: IMAGES.ogPhotobooth },
    ],
  }),
  component: PhotoboothIndex,
});

function PhotoboothIndex() {
  return <BookingFlow />;
}
