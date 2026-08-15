import { publicUrl } from "@/lib/public-base";

export const IMAGES = {
  logo: publicUrl("/images/studio7-logo.png"),
  classic: publicUrl("/images/exp-classic-new.png"),
  social: publicUrl("/images/exp-social-new.jpg"),
  luxe: publicUrl("/images/exp-luxe-new.jpg"),
  palm: publicUrl("/images/palm.png"),
} as const;
