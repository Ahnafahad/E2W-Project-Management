import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import { SessionProvider } from "@/components/providers/session-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "E2W Project Management",
  description: "Enterprise-grade project management built with modern technology",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E2W PM",
    startupImage: [
      "/icons/icon-192x192.png",
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "E2W Project Management",
    title: "E2W Project Management",
    description: "Enterprise-grade project management built with modern technology",
  },
  twitter: {
    card: "summary",
    title: "E2W Project Management",
    description: "Enterprise-grade project management built with modern technology",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="E2W PM" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Splash Screens */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />

        {/* Microsoft */}
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="application-name" content="E2W PM" />
        <meta name="msapplication-tooltip" content="E2W Project Management" />
        <meta name="msapplication-starturl" content="/" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <SessionProvider>
            <AppProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AppProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
