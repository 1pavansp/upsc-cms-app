import { collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const normalizeFirestoreDate = (rawDate) => {
  if (!rawDate) {
    return new Date();
  }

  if (rawDate instanceof Date) {
    return rawDate;
  }

  if (typeof rawDate?.toDate === 'function') {
    return rawDate.toDate();
  }

  if (typeof rawDate === 'number' || typeof rawDate === 'string') {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (rawDate?.seconds) {
    return new Date(rawDate.seconds * 1000);
  }

  return new Date();
};

export const generateUniqueSlug = async (title = '', currentId = null) => {
  const fallback = `article-${Date.now()}`;
  const baseSlug = slugify(title) || slugify(fallback) || fallback;
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const slugQuery = query(
      collection(db, 'current-affairs'),
      where('slug', '==', candidate)
    );
    const snapshot = await getDocs(slugQuery);
    const conflict = snapshot.docs.find((doc) => doc.id !== currentId);

    if (!conflict) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix++}`;

    if (suffix > 50) {
      candidate = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return candidate;
};

export const ensureArticleHasSlug = async (docSnapshot) => {
  const data = docSnapshot.data();
  let slug = data.slug;

  if (!slug) {
    slug = await generateUniqueSlug(data.title || docSnapshot.id, docSnapshot.id);
    await updateDoc(docSnapshot.ref, { slug });
  }

  return {
    id: docSnapshot.id,
    ...data,
    slug,
    date: normalizeFirestoreDate(data.date)
  };
};
