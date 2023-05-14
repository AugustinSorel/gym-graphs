import { Inter } from "next/font/google";
import "./globals.css";
import { Icon } from "@/components/icon";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gym Graphs",
  description: "Monitor your gym progress with the help of powerfull graphs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <header className="sticky top-0 overflow-hidden border-b border-border bg-primary p-4 backdrop-blur-md">
          <Icon />
        </header>
        {children}
      </body>
    </html>
  );
}
