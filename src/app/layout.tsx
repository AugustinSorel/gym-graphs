import { Inter } from "next/font/google";
import "./globals.css";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Menu, Palette, Github, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gym Graphs",
  description: "Monitor your gym progress with the help of powerfull graphs",
};

//TODO: fix keyboad navigation drop down
//TODO: create header component
//TODO: html validator check
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <header className="sticky top-0 z-20 flex h-header items-center justify-between overflow-hidden border-b border-border bg-primary px-4 backdrop-blur-md">
          <Button asChild variant="link" className="h-max rounded-full p-0">
            <Link href="/">
              <Icon />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4 w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  <span>Unit</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={"kg"}>
                      <DropdownMenuRadioItem value="kg">
                        Kg
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="lbs">
                        Lbs
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={"top"}>
                      <DropdownMenuRadioItem value="top">
                        Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="bottom">
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="right">
                        System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem asChild>
                <Link
                  href="https://github.com/augustinsorel/gym-graphs"
                  target="_blank"
                  className="flex w-full items-center"
                >
                  <Github className="mr-2 h-4 w-4" />
                  <span>GitHub</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/sign-in" className="flex w-full items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {children}
      </body>
    </html>
  );
}
