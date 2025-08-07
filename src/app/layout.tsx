import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Excel Viewer - Upload & Anzeige von Excel-Dateien',
  description: 'Laden Sie Excel-Dateien (.xlsx, .xls, .xlsm) hoch und betrachten Sie sie als interaktive HTML-Tabelle mit Suche, Sortierung und Export-Funktion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
