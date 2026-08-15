export type KnownVenue = {
  name: string;
  address: string;
  aliases: string[];
};

/** Venues we always offer when the query matches — OSM does not list these POIs. */
export const KNOWN_VENUES: KnownVenue[] = [
  {
    name: "Studio 7 Miami",
    address: "638 NW 62nd St, Miami, FL 33150",
    aliases: ["studio 7", "studio7", "studio 7 miami", "s7m", "638 nw 62"],
  },
];

export function knownVenueDescription(venue: KnownVenue): string {
  return `${venue.name} — ${venue.address}`;
}

export function matchKnownVenues(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return KNOWN_VENUES.filter((venue) => {
    const haystack = [venue.name, venue.address, ...venue.aliases].join(" ").toLowerCase();
    return haystack.includes(q) || venue.aliases.some((alias) => q.includes(alias));
  }).map(knownVenueDescription);
}
