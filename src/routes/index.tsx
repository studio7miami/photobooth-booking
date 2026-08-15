import { createFileRoute } from "@tanstack/react-router";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Book a Photo Booth — Studio 7 Miami" },
      {
        name: "description",
        content:
          "Book Studio 7 Miami's photo booth in minutes. Choose your experience, pick your date, sign, and secure it with a deposit.",
      },
      { property: "og:title", content: "Book a Photo Booth — Studio 7 Miami" },
      {
        property: "og:description",
        content:
          "Choose your experience, pick your date, and lock in your event with Studio 7 Miami.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <BookingFlow />;
}
