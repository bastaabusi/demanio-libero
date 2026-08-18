import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from "@vercel/speed-insights/next"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Demanio Libero | Mappiamo gli abusi in Italia',
  description: 'Piattaforma civica per segnalare spiagge blindate, laghi inaccessibili, pedaggi illegali e barriere architettoniche.',
  openGraph: {
    title: 'Demanio Libero | Mappiamo gli abusi',
    description: 'Unisciti alla mappatura civica. Segnala gli abusi e aiutaci a liberare il nostro territorio.',
    url: 'https://iltuodominio.it', // <-- Cambialo quando avrai il dominio
    siteName: 'Demanio Libero',
    images: [
      {
        url: '/og-image.jpg', // L'immagine che apparirà su WhatsApp
        width: 1200,
        height: 630,
        alt: 'Anteprima Demanio Libero',
      },
    ],
    locale: 'it_IT',
    type: 'website',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<Toaster position="top-center" /></body>
    </html>
  );
}
