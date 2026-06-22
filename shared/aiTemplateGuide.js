export const AI_TEMPLATE_GUIDE = {
      categorysection: {
    template1: {
      useFor: "category/product grid cards that open the full SmartCatalog",
      configFields: [
        "direction",
        "title",
        "subtitle",
        "catalogId",
        "baseUrl",
        "buttonText",
        "maxItems",
        "hintText",
        "viewInCatalogText",
        "items"
      ],
      itemShape: {
        items: ["id", "title", "subtitle", "image"]
      },
      styleFields: [
        "bgMode",
        "bgColor",
        "bgGradientFrom",
        "bgGradientVia",
        "bgGradientTo",
        "bgGradientAngle",
        "titleColor",
        "subtitleColor",
        "textAlign",
        "primaryBtnBg",
        "primaryBtnText",
        "categoryCardBg",
        "categoryCardBorder",
        "categoryCardTitleColor",
        "categoryCardSubtitleColor",
        "categoryImageOverlayColor",
        "categoryLinkColor"
      ]
    },

    template2: {
      useFor: "horizontal scroll category/product carousel that opens the full SmartCatalog",
      configFields: [
        "direction",
        "title",
        "subtitle",
        "catalogId",
        "baseUrl",
        "buttonText",
        "maxItems",
        "hintText",
        "viewInCatalogText",
        "items"
      ],
      itemShape: {
        items: ["id", "title", "subtitle", "image"]
      },
      styleFields: [
        "bgMode",
        "bgColor",
        "bgGradientFrom",
        "bgGradientVia",
        "bgGradientTo",
        "bgGradientAngle",
        "titleColor",
        "subtitleColor",
        "textAlign",
        "primaryBtnBg",
        "primaryBtnText",
        "categoryCardBg",
        "categoryCardBorder",
        "categoryCardTitleColor",
        "categoryCardSubtitleColor",
        "categoryImageOverlayColor",
        "categoryLinkColor"
      ]
    },

    template3: {
      useFor: "premium spotlight category section with one featured item and side list",
      configFields: [
        "direction",
        "title",
        "subtitle",
        "catalogId",
        "baseUrl",
        "buttonText",
        "maxItems",
        "hintText",
        "fallbackItemTitle",
        "featuredBadgeText",
        "fallbackFeaturedTitle",
        "viewInCatalogText",
        "demoItemsLabel",
        "items"
      ],
      itemShape: {
        items: ["id", "title", "subtitle", "image"]
      },
      styleFields: [
        "bgMode",
        "bgColor",
        "bgGradientFrom",
        "bgGradientVia",
        "bgGradientTo",
        "bgGradientAngle",
        "titleColor",
        "subtitleColor",
        "textAlign",
        "primaryBtnBg",
        "primaryBtnText",
        "categoryCardBg",
        "categoryCardBorder",
        "categoryCardTitleColor",
        "categoryCardSubtitleColor",
        "categoryImageOverlayColor",
        "categoryLinkColor",
        "categoryFeaturedBadgeBg",
        "categoryFeaturedBadgeText",
        "categoryFeaturedBadgeBorder",
        "categoryFeaturedPanelBg",
        "categoryFeaturedPanelBorder",
        "categoryMetricBoxBg",
        "categoryMetricBoxBorder",
        "categoryMetricLabelColor",
        "categoryMetricValueColor"
      ]
    }
  },
  hero: {
    template1: {
      useFor: "classic split hero with image, primary/secondary buttons, and floating badge",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "buttonText", "buttonLink",
        "secondaryButtonText", "secondaryButtonLink",
        "image", "imageAlt",
        "badgeTitle", "badgeSubtitle"
      ],
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor",
        "primaryBtnBg", "primaryBtnText",
        "secondaryBtnBorder", "secondaryBtnText",
        "heroBadgeBg", "heroBadgeBorder",
        "heroBadgeTitleColor", "heroBadgeSubtitleColor"
      ]
    },

    template2: {
      useFor: "premium fullscreen centered hero with tag, buttons, and large image",
      configFields: [
        "direction", "alignment",
        "tagEmoji", "tagText",
        "title", "subtitle",
        "buttonText", "buttonLink",
        "secondaryButtonText", "secondaryButtonLink",
        "image", "imageAlt"
      ],
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor",
        "primaryBtnBg", "primaryBtnText",
        "secondaryBtnBorder", "secondaryBtnText",
        "heroTagBg", "heroTagBorder", "heroTagTextColor"
      ]
    },

    template3: {
      useFor: "split hero with image, buttons, and business proof stats",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "buttonText", "buttonLink",
        "secondaryButtonText", "secondaryButtonLink",
        "image", "imageAlt",
        "stats"
      ],
      itemShape: {
        stats: ["value", "label"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor",
        "primaryBtnBg", "primaryBtnText",
        "secondaryBtnBorder", "secondaryBtnText",
        "statsCardBg", "statsCardBorder",
        "statsValueColor", "statsLabelColor"
      ]
    }
  },

  features: {
    template1: {
      useFor: "simple benefits grid with icon, title, and description cards",
      configFields: [
        "direction", "title", "subtitle", "features"
      ],
      itemShape: {
        features: ["icon", "title", "description"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "featuresCardBg", "featuresCardBorder",
        "featuresCardTitleColor", "featuresCardDescriptionColor"
      ]
    },

    template2: {
      useFor: "detailed benefit cards with badge, benefits list, learn-more button, and optional bottom CTA",
      configFields: [
        "direction", "badgeText", "title", "subtitle",
        "buttonText",
        "features",
        "bottomCta"
      ],
      itemShape: {
        features: ["icon", "title", "description", "benefits"],
        bottomCta: ["title", "subtitle"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "featuresBadgeBg", "featuresBadgeTextColor", "featuresBadgeBorder",
        "featuresCardBg2", "featuresCardBorder2",
        "featuresCardTitleColor2", "featuresCardDescriptionColor2", "featuresBenefitColor2",
        "featuresBottomCtaBgFrom", "featuresBottomCtaBgTo",
        "featuresBottomCtaTitleColor", "featuresBottomCtaSubtitleColor"
      ]
    },

    template3: {
      useFor: "interactive premium features section with tabs, advanced right panel, stats, preview area, and floating badge",
      configFields: [
        "direction", "title", "subtitle",
        "features",
        "panel",
        "floatingBadge"
      ],
      itemShape: {
        features: ["icon", "title", "description", "details", "benefits", "accentFrom", "accentTo"],
        panel: [
          "bgFrom", "bgTo", "textColor", "mutedTextColor",
          "statCardBg", "statCardOpacity",
          "stats",
          "previewEmoji", "previewText",
          "previewBgFrom", "previewBgTo"
        ],
        stats: ["value", "label"],
        floatingBadge: ["title", "subtitle", "bg", "titleColor", "subtitleColor"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "featuresTabActiveBg", "featuresTabInactiveBg", "featuresTabActiveBorder",
        "featuresTabTitleColor", "featuresTabDescriptionColor",
        "featuresFloatingBadgeBg",
        "featuresFloatingBadgeTitleColor",
        "featuresFloatingBadgeSubtitleColor"
      ]
    }
  },

  serviceSection: {
    template1: {
      useFor: "services grid cards with icons, badges, feature bullets, and optional links",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "viewAllText", "viewAllLink",
        "services"
      ],
      itemShape: {
        services: [
          "id", "title", "description", "icon",
          "features", "badge",
          "link", "buttonLink", "buttonIcon"
        ]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "serviceCardBg", "serviceCardBorder",
        "serviceCardTitleColor", "serviceCardDescriptionColor",
        "serviceIconBg", "serviceIconColor",
        "serviceBadgeBg", "serviceBadgeTextColor", "serviceBadgeBorder",
        "serviceFeatureTextColor", "serviceFeatureIconColor"
      ]
    },

    template2: {
      useFor: "featured service carousel with image, description, benefits, price, duration, and navigation",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "featuredServiceText",
        "keyBenefitsText",
        "startingAtText",
        "services"
      ],
      itemShape: {
        services: [
          "id", "title", "fullDescription",
          "image", "price", "duration",
          "features",
          "link", "buttonLink", "buttonText", "buttonIcon"
        ]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "servicePanelBg", "servicePanelBorder",
        "serviceCardTitleColor", "serviceCardDescriptionColor",
        "servicePriceColor", "serviceMutedTextColor",
        "serviceMetaTextColor",
        "serviceFeatureTextColor", "serviceFeatureIconColor",
        "serviceImageOverlayColor",
        "serviceActionBtnBg", "serviceActionBtnText", "serviceActionBtnBorder",
        "serviceNavBtnBg", "serviceNavBtnBorder", "serviceNavBtnIcon",
        "serviceDotActive", "serviceDotInactive"
      ]
    },

    template3: {
      useFor: "pricing table with monthly/yearly/one-time toggle, popular plans, highlighted plans, features and limitations",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "additionalInfo",
        "services"
      ],
      itemShape: {
        services: [
          "id", "name", "description",
          "price", "period",
          "features", "limitations",
          "buttonLink", "buttonIcon",
          "popular", "highlighted"
        ],
        price: ["monthly", "yearly", "onetime"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "servicePricingToggleBg",
        "servicePricingToggleActiveBg", "servicePricingToggleActiveText",
        "servicePricingToggleInactiveText",
        "serviceCardBg", "serviceCardBorder",
        "serviceCardTitleColor", "serviceCardDescriptionColor",
        "serviceHighlightedRing",
        "servicePopularBadgeBg", "servicePopularBadgeText",
        "servicePriceColor", "servicePeriodColor",
        "serviceFeatureTextColor", "serviceFeatureIconColor",
        "serviceLimitationsColor", "serviceXIconColor",
        "serviceMutedTextColor"
      ]
    }
  },

  gallery: {
    template1: {
      useFor: "project/product cards grid with modal and stats",
      configFields: [
        "direction", "title", "subtitle",
        "emptyStateText",
        "cardButtonText",
        "modalPrimaryButtonText",
        "modalOverviewTitle",
        "modalFeatures",
        "stats",
        "projects"
      ],
      itemShape: {
        projects: ["id", "title", "category", "image", "description", "url"],
        stats: ["value", "label"],
        modalFeatures: ["string"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "galleryCardBg", "galleryCardBorder",
        "galleryCardTitleColor", "galleryCardDescriptionColor",
        "galleryOverlayColor",
        "galleryStatsCardBg", "galleryStatsCardBorder",
        "galleryStatsValueColor", "galleryStatsLabelColor",
        "galleryModalBg", "galleryModalTitleColor",
        "galleryModalCategoryColor", "galleryModalTextColor",
        "gallerySecondaryBtnBg", "gallerySecondaryBtnBorder", "gallerySecondaryBtnText"
      ]
    },

    template2: {
      useFor: "filterable masonry gallery with category tabs and hover overlay",
      configFields: [
        "direction", "title", "subtitle",
        "emptyStateText",
        "allFilterLabel",
        "filterButtons",
        "projects"
      ],
      itemShape: {
        filterButtons: ["id", "label"],
        projects: ["id", "title", "category", "image", "description", "url"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "galleryFilterActiveBg", "galleryFilterActiveText",
        "galleryFilterInactiveBg", "galleryFilterInactiveText", "galleryFilterInactiveBorder",
        "galleryOverlayColor", "galleryOverlayTextColor",
        "galleryEmptyStateColor"
      ]
    },

    template3: {
      useFor: "premium featured gallery slider with thumbnails and result metrics",
      configFields: [
        "direction", "title", "subtitle",
        "emptyStateText",
        "moreProjectsLabel",
        "projects"
      ],
      itemShape: {
        projects: ["id", "title", "category", "image", "description", "url", "results"],
        results: ["value", "label"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "galleryMainTextColor",
        "galleryBadgeBg", "galleryBadgeTextColor",
        "galleryResultCardBg", "galleryResultCardBorder",
        "galleryResultValueColor", "galleryResultLabelColor",
        "galleryMoreProjectsLabelColor",
        "galleryThumbActiveBorder",
        "galleryThumbOverlayColor",
        "galleryEmptyStateColor"
      ]
    }
  },

  testimonials: {
    template1: {
      useFor: "simple customer testimonials grid with avatars, ratings, and review text",
      configFields: [
        "direction",
        "title",
        "testimonials"
      ],
      itemShape: {
        testimonials: ["name", "role", "content", "avatar", "rating"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "testimonialsCardBg", "testimonialsCardBorder",
        "testimonialsAvatarBg", "testimonialsAvatarText",
        "testimonialsNameColor", "testimonialsRoleColor",
        "testimonialsContentColor",
        "testimonialsStarActiveColor", "testimonialsStarInactiveColor"
      ]
    },

    template2: {
      useFor: "testimonial slider with main quote card, preview cards, avatar, company, and navigation",
      configFields: [
        "direction",
        "title",
        "subtitle",
        "testimonials"
      ],
      itemShape: {
        testimonials: ["name", "role", "company", "content", "avatar"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "testimonialsQuoteIconColor",
        "testimonialsMainCardBg", "testimonialsMainCardBorder",
        "testimonialsPreviewCardBg", "testimonialsPreviewCardBorder",
        "testimonialsPreviewActiveBg", "testimonialsPreviewActiveBorder",
        "testimonialsAvatarBg", "testimonialsAvatarText",
        "testimonialsNameColor", "testimonialsRoleColor", "testimonialsCompanyColor",
        "testimonialsContentColor",
        "testimonialsDotActive", "testimonialsDotInactive",
        "testimonialsNavBtnBg", "testimonialsNavBtnBorder", "testimonialsNavBtnIcon"
      ]
    },

    template3: {
      useFor: "facts, results, proof cards; use this instead of fake reviews",
      configFields: [
        "direction",
        "title",
        "subtitle",
        "testimonials"
      ],
      itemShape: {
        testimonials: ["name", "role", "content", "metrics"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "testimonialsTopIconBg", "testimonialsTopIconColor",
        "testimonialsCardBg", "testimonialsCardBorder",
        "testimonialsAccentBg", "testimonialsAccentText",
        "testimonialsContentColor",
        "testimonialsNameColor", "testimonialsRoleColor",
        "testimonialsMetricBadgeBg", "testimonialsMetricBadgeText",
        "testimonialsResultBadgeBg", "testimonialsResultBadgeText",
        "testimonialsStarActiveColor"
      ]
    }
  },

  cta: {
    template1: {
      useFor: "simple centered WhatsApp contact form",
      configFields: [
        "direction", "title", "subtitle",
        "nameLabel", "namePlaceholder",
        "phoneLabel", "phonePlaceholder",
        "messageLabel", "messagePlaceholder",
        "privacyText", "buttonText",
        "successTitle", "successSubtitle",
        "businessPhone", "whatsappNumber"
      ],
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "ctaCardBg", "ctaCardBorder",
        "ctaInputBg", "ctaInputBorder", "ctaInputText", "ctaInputLabelColor",
        "ctaMutedTextColor",
        "ctaSuccessIconBg", "ctaSuccessIconColor",
        "ctaSuccessTitleColor", "ctaSuccessSubtitleColor"
      ]
    },

    template2: {
      useFor: "premium WhatsApp and phone conversion section with tabs, quick messages, trust badges",
      configFields: [
        "direction", "badgeText", "title", "subtitle",
        "tabWhatsApp", "tabWhatsAppHint",
        "tabPhone", "tabPhoneHint",
        "buttonText",
        "successTitle", "successSubtitle",
        "whatsappFormTitle",
        "whatsappCardTitle", "whatsappCardSubtitle",
        "whatsappStartText", "whatsappFooterLine",
        "namePlaceholder", "phonePlaceholder", "messagePlaceholder",
        "whatsappTemplates",
        "phoneTitle", "phoneHours", "phoneCallNowText", "phoneRatesText",
        "footerStats", "trustBadges",
        "businessPhone", "whatsappNumber"
      ],
      itemShape: {
        whatsappTemplates: ["string"],
        footerStats: ["string"],
        trustBadges: ["string"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "ctaCardBg", "ctaCardBorder",
        "ctaPanelBg", "ctaPanelBorder",
        "ctaInfoCardBg", "ctaInfoCardBorder",
        "ctaBadgeBg", "ctaBadgeText", "ctaBadgeBorder",
        "ctaInputBg", "ctaInputBorder", "ctaInputText",
        "ctaMutedTextColor",
        "ctaTabActiveBg", "ctaTabInactiveBg", "ctaTabActiveText", "ctaTabInactiveText", "ctaTabBorder",
        "ctaQuickItemBg", "ctaQuickItemBorder", "ctaQuickItemText",
        "ctaAccentBg", "ctaAccentText", "ctaAccentBorder",
        "ctaInfoTitleColor", "ctaInfoTextColor",
        "ctaFooterBarBg", "ctaFooterTextColor",
        "ctaSuccessIconBg", "ctaSuccessIconColor",
        "ctaSuccessTitleColor", "ctaSuccessSubtitleColor"
      ]
    },

    template3: {
      useFor: "contact hub with WhatsApp, phone, office cards, form tabs, and metrics",
      configFields: [
        "direction", "title", "subtitle",
        "tabWhatsAppLabel", "tabPhoneLabel",
        "formNamePlaceholder", "formPhonePlaceholder", "formMessagePlaceholder",
        "buttonText",
        "successTitle", "successSubtitle",
        "whatsappCardTitle", "whatsappCardValue", "whatsappCardNote",
        "phoneCardTitle", "phoneCardValue", "phoneCardNote",
        "officeCardTitle", "officeCardValue",
        "phonePanelTitle", "phonePanelSubtitle", "phoneWaitText", "phoneCallNowText", "phoneIntlText",
        "metric1Label", "metric1Value",
        "metric2Label", "metric2Value",
        "businessPhone", "whatsappNumber"
      ],
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "ctaCardBg", "ctaCardBorder",
        "ctaPanelBg", "ctaPanelBorder",
        "ctaInfoCardBg", "ctaInfoCardBorder",
        "ctaMetricCardBg", "ctaMetricCardBorder",
        "ctaInputBg", "ctaInputBorder", "ctaInputText",
        "ctaMutedTextColor",
        "ctaTabActiveBg", "ctaTabInactiveBg", "ctaTabActiveText", "ctaTabInactiveText", "ctaTabBorder",
        "ctaAccentBg", "ctaAccentText", "ctaAccentBorder",
        "ctaInfoTitleColor", "ctaInfoTextColor", "ctaInfoNoteColor",
        "ctaMetricValueColor", "ctaMetricLabelColor",
        "ctaSuccessIconBg", "ctaSuccessIconColor",
        "ctaSuccessTitleColor", "ctaSuccessSubtitleColor"
      ]
    }
  },

  locationsection: {
    template1: {
      useFor: "simple single-location section with map, address, contact, hours, and directions",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "businessName",
        "address", "city", "state", "zip", "country",
        "phone", "email", "hours",
        "mapEmbedUrl", "directionLink"
      ],
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "locationCardBg", "locationCardBorder",
        "locationNameColor", "locationIconColor",
        "locationTextColor", "locationMutedTextColor"
      ]
    },

    template2: {
      useFor: "branch/location card with image, contact panels, hours, map tabs, and directions",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "googleMapsApiKey", "mapsApiKey",
        "location", "locations",
        "businessName", "name",
        "address", "city", "state", "zip", "country",
        "phone", "email", "manager",
        "hours", "features",
        "image", "coordinates",
        "mapLink", "directionLink", "mapEmbedUrl"
      ],
      itemShape: {
        location: [
          "name", "address", "city", "state", "zip", "country",
          "phone", "email", "manager",
          "hours", "features", "image",
          "coordinates", "mapLink", "directionLink", "mapEmbedUrl"
        ],
        locations: [
          "id", "name", "address", "city", "state", "zip", "country",
          "phone", "email", "manager",
          "hours", "features", "image",
          "coordinates", "mapLink", "directionLink", "mapEmbedUrl"
        ],
        coordinates: ["lat", "lng"],
        hours: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        features: ["string"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "locationCardBg", "locationCardBorder",
        "locationPanelBg", "locationPanelBorder",
        "locationNameColor", "locationTextColor", "locationMutedTextColor",
        "locationIconColor", "locationImageOverlayColor",
        "locationBadgeBg", "locationBadgeBorder", "locationBadgeTextColor",
        "locationTodayBg", "locationTodayText",
        "locationMapTabActiveBg", "locationMapTabActiveText",
        "locationMapTabInactiveBg", "locationMapTabInactiveText",
        "locationMapTabBorder"
      ]
    },

    template3: {
      useFor: "premium compact location/contact section with image card, hours block, map/street-view tabs, and directions",
      configFields: [
        "direction", "alignment",
        "title", "subtitle",
        "googleMapsApiKey", "mapsApiKey",
        "location", "locations",
        "businessName",
        "address", "city", "state", "zip", "country",
        "phone", "email", "hours",
        "image", "coordinates",
        "mapLink", "directionLink", "mapEmbedUrl"
      ],
      itemShape: {
        location: [
          "name", "address", "city", "state", "zip", "country",
          "phone", "email", "hours", "image",
          "coordinates", "mapLink", "directionLink", "mapEmbedUrl"
        ],
        locations: [
          "id", "name", "address", "city", "state", "zip", "country",
          "phone", "email", "hours", "image",
          "coordinates", "mapLink", "directionLink", "mapEmbedUrl"
        ],
        coordinates: ["lat", "lng"],
        hours: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      },
      styleFields: [
        "bgMode", "bgColor", "bgGradientFrom", "bgGradientVia", "bgGradientTo", "bgGradientAngle",
        "titleColor", "subtitleColor", "textAlign",
        "primaryBtnBg", "primaryBtnText",
        "locationCardBg", "locationCardBorder",
        "locationPanelBg", "locationPanelBorder",
        "locationNameColor", "locationTextColor", "locationMutedTextColor",
        "locationIconColor", "locationImageOverlayColor",
        "locationMapTabActiveBg", "locationMapTabActiveText",
        "locationMapTabInactiveBg", "locationMapTabInactiveText",
        "locationMapTabBorder"
      ]
    }
  },

  navsection: {
    template1: {
      useFor: "business navbar with brand, links, manager login/edit actions, mobile menu, and optional sticky behavior",
      configFields: [
        "enabled",
        "direction",
        "alignment",

        "brandName",
        "brandLogo",

        "links",

        "sticky",

        "showLogin",
        "showManagerLogin",
        "loginButtonText",
        "managerButtonText",
        "loginTargetRoute",

        "showEditButton",
        "editButtonText",
        "managerTargetRoute",
        "editTargetRoute"
      ],
      itemShape: {
        links: ["label", "href"]
      },
      styleFields: [
        "bgColor",
        "textColor",
        "linkColor",
        "buttonBgColor",
        "buttonTextColor",
        "borderColor"
      ]
    }
  },

  footersection: {
    template1: {
      useFor: "full business footer with brand, contact, socials, privacy link, developer credit, and copyright",
      configFields: [
        "enabled",
        "direction",
        "alignment",

        "businessName",
        "businessTagline",
        "businessDescription",
        "businessLogo",

        "locationTitle",
        "locationText",
        "addressLine1",
        "addressLine2",
        "city",
        "country",
        "phone",
        "email",

        "socialsTitle",
        "socials",

        "legalTitle",
        "privacyText",
        "privacyLinkText",
        "privacyLink",
        "privacyTitle",
        "privacyContent",

        "developedByText",
        "developerName",
        "developerLink",
        "developerWebsite",
        "developerLogo",

        "copyrightText",
        "copyrightLeft",
        "copyrightRight"
      ],
      itemShape: {
        socials: ["platform", "url", "label", "iconUrl"]
      },
      styleFields: [
        "bgMode",
        "bgColor",
        "bgGradientFrom",
        "bgGradientVia",
        "bgGradientTo",
        "bgGradientAngle",
        "titleColor",
        "subtitleColor",
        "linkColor",
        "dividerColor"
      ]
    }
  },
};