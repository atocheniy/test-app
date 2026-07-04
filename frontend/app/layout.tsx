import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ApplicationProvider } from "@/context/ApplicationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ApplicationProvider>
          {children}
        </ApplicationProvider>
      </body>
    </html>
  );
}
