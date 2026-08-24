import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getUser } from "@/lib/supabase/dal";
import { logout } from "@/app/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "21-Day Healthy Habit Accountability App",
  description: "Track your daily healthy habits across 18 dimensions and build unbroken streaks for 21 days.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-gray-50 dark:bg-black">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shadow-sm">
                21
              </span>
              <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
                Healthy Habit Accountability
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                21-Day Challenge Active
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                    {user.email}
                  </span>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-500">
          21-Day Healthy Habit Accountability App &bull; Built for lasting behavior change
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
