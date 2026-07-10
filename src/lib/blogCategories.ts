// Fixed category list offered in the admin panel's blog post form and used
// for the category filter pills on /blog. A plain string on BlogPost.category
// rather than its own model/table — see the comment on BlogPost in
// prisma/schema.prisma for why (mirrors Attraction.category elsewhere).
export const BLOG_CATEGORIES = [
  'Things To Do',
  'Food & Drink',
  'Travel Tips',
  'Neighborhoods',
  'Day Trips',
  'Culture & History',
  'Events'
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
