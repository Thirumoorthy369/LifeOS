import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SyncProvider } from "@/components/providers/sync-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChatbotWidget } from "@/components/ai-chatbot/chatbot-widget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LifeOS - Your Personal Operating System",
  description: "Manage tasks, study, habits, expenses, and notes with AI assistance. Offline-first, calm, and focused.",
  manifest: "/manifest.json",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100`} suppressHydrationWarning>
        <AuthProvider>
          <SyncProvider>
            {children}
            <ChatbotWidget />
            <Toaster />
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
