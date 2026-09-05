import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARGUS+ · 法律训练平台',
  description: 'Next.js frontend for the ARGUS+ legal training platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
