import type { Schema, Struct } from '@strapi/strapi';

export interface ProductFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_product_feature_items';
  info: {
    description: 'A single product key feature bullet point';
    displayName: 'Feature Item';
    icon: 'check';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductSpecItem extends Struct.ComponentSchema {
  collectionName: 'components_product_spec_items';
  info: {
    description: 'A single product specification row (label + value)';
    displayName: 'Spec Item';
    icon: 'list';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedAlertBanner extends Struct.ComponentSchema {
  collectionName: 'components_shared_alert_banners';
  info: {
    description: 'Site-wide announcement or alert banner';
    displayName: 'Alert Banner';
    icon: 'bell';
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['info', 'warning', 'promo']> &
      Schema.Attribute.DefaultTo<'info'>;
  };
}

export interface SharedHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_hero_sections';
  info: {
    description: 'Full-width hero banner with headline, subheadline, background image and CTA buttons';
    displayName: 'Hero Section';
    icon: 'landscape';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    ctaButtons: Schema.Attribute.Component<'shared.link', true>;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
    subheadline: Schema.Attribute.Text;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'A navigational link with label and URL';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    openInNewTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO metadata component';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'product.feature-item': ProductFeatureItem;
      'product.spec-item': ProductSpecItem;
      'shared.alert-banner': SharedAlertBanner;
      'shared.hero-section': SharedHeroSection;
      'shared.link': SharedLink;
      'shared.seo': SharedSeo;
    }
  }
}
