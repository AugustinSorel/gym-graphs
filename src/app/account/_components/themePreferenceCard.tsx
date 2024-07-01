"use client";

import { Computer, Moon, Sun } from "lucide-react";
import { Card } from "./card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemePreferenceCard = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  const theme = useTheme();

  useEffect(() => {
    setSelectedTheme(theme.theme ?? "system");
  }, [theme.theme]);

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>theme</Card.Title>
        <Card.Description>change theme</Card.Description>
      </Card.Body>
      <Card.Footer>
        <ToggleGroup
          type="single"
          disabled={!selectedTheme}
          value={selectedTheme}
          variant="outline"
          onValueChange={theme.setTheme}
        >
          <ToggleGroupItem value="light" aria-label="Change theme to light">
            <Sun className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Change theme to dark">
            <Moon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="Change theme to system">
            <Computer className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Card.Footer>
    </Card.Root>
  );
};
