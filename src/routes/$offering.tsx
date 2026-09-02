import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { socialPreviewMeta } from "@/assets/images";
import { StudioBookingFlow } from "@/components/studio/StudioBookingFlow";
import { BookingFlow } from "@/components/booking/BookingFlow";
import {
  parseStudioOfferingParam,
  STUDIO_OFFERING_SLUG,
  STUDIO_OFFERINGS,
} from "@/config/studio/offerings";
import {
  EXPERIENCES,
  parsePhotoboothExperienceParam,
  PHOTOBOOTH_EXPERIENCE_SLUG,
} from "@/config/pricing";
import { photoboothPageTitle, studioPageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/$offering")({
  beforeLoad: ({ params }) => {
    if (
      params.offering === "photobooth" ||
      params.offering === "layout-preview" ||
      params.offering === "booked-preview" ||
      params.offering === "checkout-preview" ||
      params.offering === "motion-preview" ||
      params.offering === "email-preview" ||
      params.offering === "pay-preview" ||
      params.offering === "pay" ||
      params.offering === "api"
    ) {
      throw notFound();
    }
    const booth = parsePhotoboothExperienceParam(params.offering);
    if (booth) {
      const canonical = PHOTOBOOTH_EXPERIENCE_SLUG[booth];
      if (params.offering !== canonical) {
        throw redirect({ to: "/$offering", params: { offering: canonical } });
      }
      return;
    }
    const offering = parseStudioOfferingParam(params.offering);
    if (!offering) {
      throw redirect({ to: "/" });
    }
    const canonical = STUDIO_OFFERING_SLUG[offering];
    if (params.offering !== canonical) {
      throw redirect({ to: "/$offering", params: { offering: canonical } });
    }
  },
  head: ({ params }) => {
    const booth = parsePhotoboothExperienceParam(params.offering);
    if (booth) {
      const title = photoboothPageTitle(EXPERIENCES[booth].name);
      return {
        meta: [
          { title },
          {
            name: "description",
            content: `Book ${EXPERIENCES[booth].name} with Studio 7 Photobooth.`,
          },
          { property: "og:title", content: title },
          { property: "og:description", content: EXPERIENCES[booth].tagline },
          { property: "og:type", content: "website" },
          ...socialPreviewMeta("photobooth"),
          { name: "twitter:title", content: title },
        ],
      };
    }
    const offering = parseStudioOfferingParam(params.offering);
    const name = offering ? STUDIO_OFFERINGS[offering].name : undefined;
    const title = studioPageTitle(name);
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Book ${name ?? "Studio 7 Miami"} at Studio 7 Miami. Pick a time, sign, and pay.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Book ${name ?? "your session"} at Studio 7 Miami.`,
        },
        { property: "og:type", content: "website" },
        ...socialPreviewMeta("studio"),
        { name: "twitter:title", content: title },
      ],
    };
  },
  component: OfferingIndex,
});

function OfferingIndex() {
  const { offering: slug } = Route.useParams();
  const booth = parsePhotoboothExperienceParam(slug);
  if (booth) return <BookingFlow initialExperience={booth} />;
  const offering = parseStudioOfferingParam(slug);
  if (!offering) return null;
  return <StudioBookingFlow initialOffering={offering} />;
}
