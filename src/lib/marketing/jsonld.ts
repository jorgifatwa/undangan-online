import { business, instagramLink } from "@/config/business";
import { siteConfig } from "@/lib/site";

import { FAQ } from "./content";

/** Structured data (schema.org) untuk landing page. Hanya fakta yang ada. */
export function landingJsonLd() {
  const sameAs = [instagramLink()].filter(Boolean);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: business.name,
      url: siteConfig.appUrl,
      slogan: business.tagline,
      ...(sameAs.length ? { sameAs } : {}),
      ...(business.email || business.whatsapp
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              availableLanguage: ["id"],
              ...(business.email ? { email: business.email } : {}),
              ...(business.whatsapp ? { telephone: `+${business.whatsapp}` } : {}),
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: business.name,
      url: siteConfig.appUrl,
      inLanguage: "id-ID",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}
