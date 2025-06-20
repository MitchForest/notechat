import type { Metadata } from "next";
import { Inter, JetBrains_Mono as JetBrainsMono } from "next/font/google";
import "@/app/globals.css";
import "@/features/editor/styles/spellcheck.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/lib/app-shell-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrainsMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AI Notes - Your Intelligent Workspace",
  description: "An AI-powered note-taking and conversation platform for organizing your thoughts and ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppShellProvider>
            {children}
            <Toaster />
          </AppShellProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
