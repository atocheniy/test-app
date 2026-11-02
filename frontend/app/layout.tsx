import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Compile — Платформа для разработчиков",
  description: "Социальная сеть, живые портфолио, девлоги проектов и вакансии для разработчиков.",
};

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

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('devlink_theme') || 'dark';
      var isDark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (!isDark && (saved === 'light' || (saved === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches))) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      }
      var codeSize = localStorage.getItem('devlink_code_font_size');
      if (codeSize === 'sm') document.documentElement.style.setProperty('--code-font-size', '12px');
      else if (codeSize === 'lg') document.documentElement.style.setProperty('--code-font-size', '15.5px');
      else document.documentElement.style.setProperty('--code-font-size', '13.5px');
      var blurSetting = localStorage.getItem('devlink_blur_enabled');
      if (blurSetting === 'false') {
        document.documentElement.classList.add('no-blur');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ApplicationProvider>
          <LanguageProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </LanguageProvider>
        </ApplicationProvider>
      </body>
    </html>
  );
}
