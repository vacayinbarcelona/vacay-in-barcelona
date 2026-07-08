'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setSiteSetting, SEO_PAGES } from '@/lib/siteSettings';

export async function updateSeoSettings(formData: FormData) {
  for (const page of SEO_PAGES) {
    const title = String(formData.get(`${page.key}__title`) ?? '').trim();
    const description = String(formData.get(`${page.key}__description`) ?? '').trim();
    await setSiteSetting(`seo.${page.key}.title`, title);
    await setSiteSetting(`seo.${page.key}.description`, description);
    revalidatePath(page.path);
  }

  redirect('/admin/seo?saved=1');
}
