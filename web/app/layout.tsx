import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Agen Cerdas Tanggap Banjir Ciledug",
    template: "%s · Agen Cerdas Tanggap Banjir",
  },
  description:
    "Demo UTS Kecerdasan Artifisial: klasifikasi tweet banjir, klasterisasi & peringkasan Hybrid TF-IDF, dan rute evakuasi A* di Ciledug.",
};

const skripTema = `(function(){try{var t=localStorage.getItem("tema");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t==="dark"?"banjir-gelap":"banjir");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-theme="banjir"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skripTema }} />
      </head>
      <body className="flex min-h-full flex-col bg-base-200 text-base-content">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
