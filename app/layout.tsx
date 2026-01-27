import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { IssueProvider } from "@/contexts/issue-context";
import { DashboardProvider } from "@/contexts/dashboard-context";
import { Navigation } from "@/components/navigation";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "OurStreet - Local Issue Reporting & Impact Tracker",
  description:
    "Report civic issues, track resolutions, and improve your local community with real-time tracking and transparent governance.",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=1" />
        <link rel="apple-touch-icon" href="/logo.png?v=1" />
        <link rel="shortcut icon" href="/logo.png?v=1" />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <IssueProvider>
              <DashboardProvider>
                <Navigation />
                {children}

                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "var(--background)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                    },
                  }}
                />
              </DashboardProvider>
            </IssueProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
