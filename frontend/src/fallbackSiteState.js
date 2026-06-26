import {
  aboutFallback,
  blogFallback,
  contactFallback,
  homeFallback,
  productFallback,
  projectFallback,
  reviewFallback,
  serviceFallback,
} from './siteContent';

export const fallbackSiteState = {
  home: homeFallback,
  about: aboutFallback,
  contact: contactFallback,
  appearance: null,
  services: serviceFallback,
  projects: projectFallback,
  products: productFallback,
  reviews: reviewFallback,
  blogs: blogFallback,
};
