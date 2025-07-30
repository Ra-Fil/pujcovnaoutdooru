import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  structuredData?: object;
  canonical?: string;
}

export default function SEOHead({
  title = "Půjčovna outdoorového vybavení | Ferratové sety, horolezecké vybavení | PUJCOVNAOUTDOORU.CZ",
  description = "Půjčujeme outdoorového vybavení v Brně, Olomouci, Bílovicích nad Svitavou. Ferratové sety, horolezecké vybavení, vybavení na canyoning, kempování a další. Rezervace online.",
  keywords = "půjčovna outdoorového vybavení, ferratové sety, horolezecké vybavení, helmy, via ferrata, Olomouc, Brno, outdoor, horské sporty, půjčení vybavení, půjčovna Brno, půjčovna Olomouc",
  ogImage = "/uploads/logo-pujcovnaoutdooru-cz.png",
  structuredData,
  canonical,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description);
    }

    // Update meta keywords
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.setAttribute("content", keywords);
    }

    // Update Open Graph title
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute("content", title);
    }

    // Update Open Graph description
    const ogDescMeta = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescMeta) {
      ogDescMeta.setAttribute("content", description);
    }

    // Update Open Graph image
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta) {
      ogImageMeta.setAttribute("content", ogImage);
    }

    // Update Twitter title
    const twitterTitleMeta = document.querySelector(
      'meta[property="twitter:title"]',
    );
    if (twitterTitleMeta) {
      twitterTitleMeta.setAttribute("content", title);
    }

    // Update Twitter description
    const twitterDescMeta = document.querySelector(
      'meta[property="twitter:description"]',
    );
    if (twitterDescMeta) {
      twitterDescMeta.setAttribute("content", description);
    }

    // Update Twitter image
    const twitterImageMeta = document.querySelector(
      'meta[property="twitter:image"]',
    );
    if (twitterImageMeta) {
      twitterImageMeta.setAttribute("content", ogImage);
    }

    // Add canonical URL if provided
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonical);
    }

    // Add structured data if provided
    if (structuredData) {
      let structuredDataScript = document.querySelector(
        'script[data-type="structured-data"]',
      );
      if (!structuredDataScript) {
        structuredDataScript = document.createElement("script");
        structuredDataScript.setAttribute("type", "application/ld+json");
        structuredDataScript.setAttribute("data-type", "structured-data");
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, ogImage, structuredData, canonical]);

  return null; // This component doesn't render anything visible
}

// Pre-defined SEO configurations for different pages
export const SEOConfigs = {
  home: {
    title: "Půjčovna outdoorového vybavení | PUJCOVNAOUTDOORU.CZ",
    description: "Půjčujte si outdoorového vybavení v Brně, Olomouci, Bílovicích nad Svitavou. Ferratové sety, horolezecké vybavení, vybavení na canyoning, kempování a další. Rezervace online.",
    keywords:
      "půjčovna outdoorového vybavení, ferratové sety, horolezecké vybavení, helmy, via ferrata, Olomouc, outdoor, horské sporty, půjčení vybavení",
  },
  equipment: {
    title:
      "Vybavení na půjčení | Ferratové sety, helmy, úvazky, paddleboardy | PUJCOVNAOUTDOORU.CZ",
    description:
      "Kompletní seznam dostupného outdoorového vybavení na půjčení. Ferratové sety, horolezecké helmy, úvazky, brzdy. Profesionální kvalita za výhodné ceny.",
    keywords:
      "ferratové sety půjčení, horolezecké vybavení, helmy na půjčení, úvazky, tlumič pádu, brzdy, via ferrata vybavení",
  },
  about: {
    title:
      "O nás | Profesionální půjčovna outdoorového vybavení | PUJCOVNAOUTDOORU.CZ",
    description:
      "Seznamte se s naší půjčovnou outdoorového vybavení v Olomouci. Více než 10 let zkušeností s kvalitním servisem a bezpečnostním vybavením.",
    keywords:
      "o půjčovně, outdoor Olomouc, Jan Rücker, zkušenosti, bezpečné vybavení",
  },
  contact: {
    title: "Kontakt | Rezervace a informace | PUJCOVNAOUTDOORU.CZ",
    description:
      "Kontaktujte naši půjčovnu outdoorového vybavení v Olomouci. Telefonní číslo, email, adresa a informace o rezervacích. Rychlá a spolehlivá komunikace.",
    keywords:
      "kontakt půjčovna, telefon, email, adresa Olomouc, rezervace, informace",
  },
  locations: {
    title: "Místa převzetí vybavení | Olomouc, Bílověž | PUJCOVNAOUTDOORU.CZ",
    description:
      "Možnosti převzetí a vrácení outdoorového vybavení. Hlavní základna Olomouc a další místa podle domluvy. Flexibilní servis pro vaše potřeby.",
    keywords:
      "převzetí vybavení, Olomouc, Bílověž, místa převzetí, flexibilní servis",
  },
  terms: {
    title:
      "Obchodní podmínky | Pravidla půjčení vybavení | PUJCOVNAOUTDOORU.CZ",
    description:
      "Obchodní podmínky půjčovny outdoorového vybavení. Pravidla půjčení, zálohy, odpovědnost, pojištění a další důležité informace.",
    keywords:
      "obchodní podmínky, pravidla půjčení, zálohy, pojištění, odpovědnost",
  },
  usefulInfo: {
    title:
      "Užitečné informace | Tipy pro outdoor a via ferrata | PUJCOVNAOUTDOORU.CZ",
    description:
      "Užitečné informace a tipy pro outdoor aktivity. Jak používat ferratové sety, bezpečnostní pravidla, doporučení pro via ferrata a horské sporty.",
    keywords:
      "tipy outdoor, jak používat ferratové sety, bezpečnost via ferrata, horské sporty, užitečné informace",
  },
};
