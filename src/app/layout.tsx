import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";
import { UsersProvider } from "@/components/UsersProvider";

export const metadata: Metadata = {
  title: "밥친구",
  description: "친구들과 식단을 공유하는 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <UsersProvider>
          <CurrentUserProvider>{children}</CurrentUserProvider>
        </UsersProvider>
      </body>
    </html>
  );
}
