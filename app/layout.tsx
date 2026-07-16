import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Telemetry Analytics - Performance Dashboard',
  description: 'Submission-Ready High-Performance Telemetry Visualization Engine (10k+ points @ 60fps)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
