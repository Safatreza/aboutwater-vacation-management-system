import type { Metadata } from "next"
// Import removed - using Google Fonts CDN for ASAP
import AuthProvider from "@/components/auth/AuthProvider"
import ErrorBoundary from "@/components/error/ErrorBoundary"
import "./globals.css"

// ASAP font is loaded via Google Fonts CDN in head


export const metadata: Metadata = {
  title: "aboutwater - Vacation Management",
  description: "Employee vacation management system for aboutwater GmbH",
  icons: {
    icon: "/favicon.ico"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter antialiased min-h-screen">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
