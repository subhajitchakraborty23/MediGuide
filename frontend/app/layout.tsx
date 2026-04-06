import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Barlow, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MediGuide — Your Doctor, Anywhere",
  description: "AI-powered medical assistance for travelers worldwide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${bebasNeue.variable} antialiased`}>
        <ClerkProvider>
          <NavBar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
