/**
 * Render the original ARGUS+ single-page UI at the root URL. The iframe keeps
 * the legacy document byte-for-byte intact while the browser remains on `/`
 * instead of redirecting to `/argus-original.html`.
 */
export default function HomePage() {
  return (
    <iframe
      title="ARGUS+ 法律训练平台"
      src="/argus-original.html"
      style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
    />
  );
}
