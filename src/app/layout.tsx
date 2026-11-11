import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UDCPR FSI Calculator Pro | Architectural Business Utility',
  description: 'Self-hosted SaaS for Maharashtra UDCPR FSI & Built-Up Area calculations with AI 7/12 PDF document extraction.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="blueprint-grid selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
