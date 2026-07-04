import "./globals.css";
import { getLocale } from "@/lib/i18n/getLocale";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export const metadata = {
  title: "Chindagram",
  description: "A private space for the Chindamanee school community.",
  robots: { index: false, follow: false }, // not indexable (closed platform)
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        {/* Inter for Latin, Noto Sans Thai for clean Thai rendering.
            Loaded in the browser (no build-time fetch); falls back to system sans if offline. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-gray-900">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
