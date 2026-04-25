import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AppHydrator } from '@/components/AppHydrator';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Time-Off Management System',
  description: 'Frontend for Time-Off Management Microservice',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.className} min-h-screen bg-background text-zinc-100`}>
        <AppHydrator />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
