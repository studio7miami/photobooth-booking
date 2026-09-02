export function studioPageTitle(service?: string | null) {
  return service ? `Studio 7 Miami · ${service}` : "Studio 7 Miami · Book";
}

export function photoboothPageTitle(service?: string | null) {
  if (!service) return "Studio 7 Photobooth · Book";
  return `Studio 7 Photobooth · ${service.replace(/^The\s+/i, "")}`;
}
