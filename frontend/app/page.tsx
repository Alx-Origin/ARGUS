import { redirect } from 'next/navigation';

/**
 * The original ARGUS+ frontend is a static single-page document. Keep the
 * Next.js shell only as the deployment entrypoint and serve that document
 * unchanged so the original layout and interactions remain intact.
 */
export default function HomePage() {
  redirect('/argus-original.html');
}
