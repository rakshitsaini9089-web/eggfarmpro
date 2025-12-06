import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Layout from '@/components/Layout';
import { FarmProvider } from '@/contexts/FarmContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Egg Farm Pro',
  description: 'Manage your egg farm efficiently',
  icons: {
    icon: '/favicon.ico',
  },
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <FarmProvider>
              <Layout>{children}</Layout>
            </FarmProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}