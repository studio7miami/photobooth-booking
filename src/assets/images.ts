import { publicUrl } from "@/lib/public-base";

export const IMAGES = {
  logo: publicUrl("/images/studio7-logo.png"),
  classic: publicUrl("/images/exp-classic-new.png"),
  social: publicUrl("/images/exp-social-new.jpg"),
  luxe: publicUrl("/images/exp-luxe-new.jpg"),
  palm: publicUrl("/images/palm.png"),
  /** Absolute URL so link previews can fetch the image. */
  og: "https://book.studio7.miami/images/og-book-your-experience.png",
  ogPhotobooth: "https://book.studio7.miami/images/og-book-your-experience.png",
} as const;

/** Studio offering card + payment thumbs. Photobooth keeps `IMAGES` above. */
export const STUDIO_IMAGES = {
  full_studio: publicUrl("/images/offerings/full-studio-rental.jpg"),
  photo_studio: publicUrl("/images/offerings/photo-studio-rental.jpg"),
  framehaus: publicUrl("/images/offerings/framehaus-media.jpg"),
  portraits: publicUrl("/images/offerings/portraits.jpg"),
  sports_media: publicUrl("/images/offerings/sports-media.jpg"),
  beauty: publicUrl("/images/offerings/beauty-headshots.jpg"),
  theatrical: publicUrl("/images/offerings/theatrical-headshots.jpg"),
  headshot: publicUrl("/images/offerings/standard-headshots.jpg"),
  passport: publicUrl("/images/offerings/passport-photos.jpg"),
  acting_cj: publicUrl("/images/offerings/acting-class.jpg"),
} as const;
