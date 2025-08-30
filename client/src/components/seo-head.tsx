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
  description = "Půjčuji outdoorového vybavení v Brně, Olomouci, Bílovicích nad Svitavou. Ferratové sety, horolezecké vybavení, vybavení na canyoning, kempování a další. Rezervace online.",
  keywords = "půjčovna outdoorového vybavení, ferratové sety, horolezecké vybavení, helmy, via ferrata, Olomouc, Brno, outdoor, horské sporty, půjčení vybavení, vybavení na canyoning, krosny pro děti, krosny na nošení dětí",
  ogImage = "/uploads/logo-pujcovnaoutdooru-cz.png",
  structuredData,
  canonical,
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description);
    }

    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.setAttribute("content", keywords);
    }

    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute("content", title);
    }

    const ogDescMeta = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescMeta) {
      ogDescMeta.setAttribute("content", description);
    }

    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta) {
      ogImageMeta.setAttribute("content", ogImage);
    }

    const twitterTitleMeta = document.querySelector(
      'meta[property="twitter:title"]',
    );
    if (twitterTitleMeta) {
      twitterTitleMeta.setAttribute("content", title);
    }

    const twitterDescMeta = document.querySelector(
      'meta[property="twitter:description"]',
    );
    if (twitterDescMeta) {
      twitterDescMeta.setAttribute("content", description);
    }

    const twitterImageMeta = document.querySelector(
      'meta[property="twitter:image"]',
    );
    if (twitterImageMeta) {
      twitterImageMeta.setAttribute("content", ogImage);
    }

    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonical);
    }
 
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

  return null;
}

export const SEOConfigs = {
  home: {
    title: "Půjčovna outdoorového vybavení | PUJCOVNAOUTDOORU.CZ",
    description: "Půjčovna outdoorového vybavení v Brně, Olomouci, Bílovicích nad Svitavou. Ferratové sety, horolezecké vybavení, vybavení na canyoning, kempování a další. Rezervace online.",
    keywords:
      "půjčovna outdoorového vybavení, ferratové sety, horolezecké vybavení, helmy, via ferrata, Olomouc, Brno, Bílovice nad Svitavou, vybavený na canyoning, cenyoning, outdoor, horské sporty, půjčení vybavení",
  },
  equipment: {
    title:
      "Půjčovna outdoorového vybavení | PUJCOVNAOUTDOORU.CZ",
    description:
      "Ferratové sety, horolezecké helmy, úvazky, brzdy, turistiské vybavení, vybavení na canyoning a další. Rezervace online.",
    keywords:
      "ferratové sety půjčení, horolezecké vybavení, helmy na půjčení, úvazky, tlumič pádu, brzdy, via ferrata vybavení",
  },
  about: {
    title:
      "Půjčovna outdoorového vybavení | PUJCOVNAOUTDOORU.CZ",
    description:
      "Ferratové sety, horolezecké helmy, úvazky, brzdy, turistiské vybavení, vybavení na canyoning a další. Rezervace online.",
    keywords:
      "ferratové sety půjčení, horolezecké vybavení, helmy na půjčení, úvazky, tlumič pádu, brzdy, via ferrata vybavení",
  },
  contact: {
    title: "Kontakt | PUJCOVNAOUTDOORU.CZ",
    description:
      "Ferratové sety, horolezecké helmy, úvazky, brzdy, turistiské vybavení, vybavení na canyoning a další. Rezervace online.",
    keywords:
      "kontakt půjčovna, telefon, email, rezervace, informace, rezervace a informace",
  },
  locations: {
    title: "Místa převzetí vybavení | PUJCOVNAOUTDOORU.CZ",
    description:
      "Možnosti převzetí a vrácení outdoorového vybavení. Hlavní základna Brno a další místa podle domluvy.",
    keywords:
      "převzetí vybavení, Olomouc, Bílověž, místa převzetí, flexibilní servis",
  },
  terms: {
    title:
      "Obchodní podmínky | PUJCOVNAOUTDOORU.CZ",
    description:
      "Obchodní podmínky půjčovny outdoorového vybavení. Pravidla půjčení, zálohy, odpovědnost, pojištění a další důležité informace.",
    keywords:
      "obchodní podmínky, pravidla půjčení, zálohy, pojištění, odpovědnost",
  },
  usefulInfo: {
    title:
      "Užitečné informace | PUJCOVNAOUTDOORU.CZ",
    description:
      "Jak používat ferratové sety, doporučení, informace o půjčení outdoorového vybavení.",
    keywords:
      "tipy outdoor, jak používat ferratové sety, bezpečnost via ferrata, horské sporty, užitečné informace",
  },
};