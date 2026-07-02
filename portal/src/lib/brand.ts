/**
 * Source-of-truth facts from `reference/wallaroofc-letterhead.jpeg`.
 * These power the sign-in page, dashboard greeting, email templates, and
 * any other surface that mentions the club. Edit here, not in JSX.
 */
export const BRAND = {
  fullName: "Wallaroo Football Club",
  shortName: "Wallaroo FC",
  established: 1867,
  region: "Copper Coast",
  tagline: "Proudly representing Wallaroo and the Copper Coast since 1867",
  footerTagline: "Tradition. Community. Commitment.",
  president: "Jason Niotis",
  contact: {
    publicSite: "wallaroofc.com",
    publicSiteUrl: "https://wallaroofc.com",
    adminEmail: "admin@wallaroofc.com.au",
    secretaryEmail: "secretary@wallaroofc.com.au",
    address: "2B Cornish Terrace, Wallaroo SA 5556",
    abn: "61 277 034 706",
    affiliation: "SANFL",
  },
} as const;
