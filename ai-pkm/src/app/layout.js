import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'NeuralVault — AI Knowledge Management',
  description: 'Organize, search, and understand your personal knowledge base using Edge AI with complete privacy.',
  keywords: 'AI, knowledge management, RAG, document search, personal AI',
  openGraph: {
    title: 'NeuralVault — AI Knowledge Management',
    description: 'Your private AI brain for all your documents and notes.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
