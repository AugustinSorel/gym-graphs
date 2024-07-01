"use client";

import { Computer, Moon, Sun } from "lucide-react";
import { Card } from "./card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const ThemePreferenceCard = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  const theme = useTheme();

  useEffect(() => {
    setSelectedTheme(theme.theme ?? "system");
  }, [theme.theme]);

  return (
    <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
      <Card.Root>
        <Card.Body>
          <Card.Title>theme</Card.Title>
          <Card.Description>
            Make your workspace truly yours with our flexible theme options.
          </Card.Description>
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
    </ErrorBoundary>
  );
};
