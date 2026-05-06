// Per-deployment branding (footer credit, X handle, email, website).
//
// Driven by env vars so the same source produces the right footer for each
// host. Defaults match the original hulryung deployment.
//
//   BRAND_X_HANDLE   — X (Twitter) username, used for both the © link and
//                      the displayed handle. e.g. "hulryung", "huconn".
//   BRAND_EMAIL      — contact email shown in the footer.
//   BRAND_WEBSITE    — optional. If set, replaces the third footer slot
//                      (which would otherwise repeat the X handle URL) with
//                      a link to this site. e.g. "https://www.huconn.com".

const xHandle = process.env.BRAND_X_HANDLE ?? 'hulryung';
const email = process.env.BRAND_EMAIL ?? 'hulryung@gmail.com';
const websiteUrl = process.env.BRAND_WEBSITE ?? null;

export const BRANDING = {
  xHandle,
  xUrl: `https://x.com/${xHandle}`,
  xDisplay: `x.com/${xHandle}`,
  email,
  emailHref: `mailto:${email}`,
  websiteUrl,
  websiteDisplay: websiteUrl
    ? websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : null,
} as const;
