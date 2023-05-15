"use client";

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
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DropDownMenu = () => {
  const [weight, setWeight] = useState<string>("kg");
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="icon" aria-label="menu">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">menu</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
              <DropdownMenuRadioGroup value={weight} onValueChange={setWeight}>
                <DropdownMenuRadioItem value="kg">Kg</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lbs">Lbs</DropdownMenuRadioItem>
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
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
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
  );
};

const HomeIcon = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="link"
            aria-label="home"
            className="h-max rounded-full p-0"
          >
            <Link href="/">
              <Icon />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">go home</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const Header = () => {
  return (
    <header className="sticky top-0 z-20 flex h-header items-center justify-between border-b border-border bg-primary px-4 backdrop-blur-md">
      <HomeIcon />
      <DropDownMenu />
    </header>
  );
};
