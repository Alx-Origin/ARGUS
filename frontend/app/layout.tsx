import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARGUS+ · 法律训练平台 / Legal Training Platform',
  description: 'ARGUS+ legal training platform · ARGUS+ 法律训练平台',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
