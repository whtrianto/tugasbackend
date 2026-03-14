import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Manage your daily tasks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
