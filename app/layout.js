import "./globals.css";

export const metadata = {
  title: "Chindagram",
  description: "A private space for the Chindamanee school community.",
  robots: { index: false, follow: false }, // not indexable (closed platform)
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
      <body className="font-sans text-gray-900">{children}</body>
    </html>
  );
}
