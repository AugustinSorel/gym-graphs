import { Inter } from "next/font/google";
import "./globals.css";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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
        <header className="sticky top-0 z-20 flex items-center justify-between overflow-hidden border-b border-border bg-primary p-4 backdrop-blur-md">
          <Button asChild variant="link" className="h-max rounded-full p-0">
            <Link href="/">
              <Icon />
            </Link>
          </Button>

          <Button size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </header>
        {children}
      </body>
    </html>
  );
}
