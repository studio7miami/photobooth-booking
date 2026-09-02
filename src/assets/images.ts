import { publicUrl } from "@/lib/public-base";

const OG_ORIGIN = "https://book.studio7.miami";

export const SOCIAL_PREVIEW = {
  studio: {
    url: `${OG_ORIGIN}/images/og-studio.jpg`,
    width: "1024",
    height: "537",
    alt: "Studio 7 Miami",
  },
  photobooth: {
    url: `${OG_ORIGIN}/images/og-book-your-experience.png`,
    width: "1024",
    height: "409",
    alt: "Studio 7 Photobooth",
  },
} as const;

export function socialPreviewMeta(kind: keyof typeof SOCIAL_PREVIEW) {
  const image = SOCIAL_PREVIEW[kind];
  return [
    { property: "og:image", content: image.url },
    { property: "og:image:width", content: image.width },
    { property: "og:image:height", content: image.height },
    { property: "og:image:alt", content: image.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image.url },
  ];
}

export const IMAGES = {
  logo: publicUrl("/images/studio7-logo.png"),
  photoboothLogo: publicUrl("/images/studio7-photobooth-logo.png"),
  classic: publicUrl("/images/exp-classic-new.png"),
  social: publicUrl("/images/exp-social-new.jpg"),
  luxe: publicUrl("/images/exp-luxe-new.jpg"),
  palm: publicUrl("/images/palm.png"),
  /** Absolute URL so link previews can fetch the image. */
  og: SOCIAL_PREVIEW.studio.url,
  ogPhotobooth: SOCIAL_PREVIEW.photobooth.url,
} as const;

/** Studio offering card + payment thumbs. Photobooth keeps `IMAGES` above. */
export const STUDIO_IMAGES = {
  full_studio: publicUrl("/images/offerings/full-studio-rental.jpg"),
  photo_studio: publicUrl("/images/offerings/photo-studio-rental.jpg"),
  framehaus: IMAGES.logo,
  portraits: publicUrl("/images/offerings/portraits.jpg"),
  sports_media: publicUrl("/images/offerings/sports-media.jpg"),
  beauty: publicUrl("/images/offerings/beauty-headshots.jpg"),
  theatrical: publicUrl("/images/offerings/theatrical-headshots.jpg"),
  headshot: publicUrl("/images/offerings/standard-headshots.jpg"),
  passport: publicUrl("/images/offerings/passport-photos.jpg"),
  acting_cj: publicUrl("/images/offerings/acting-class.jpg"),
} as const;
