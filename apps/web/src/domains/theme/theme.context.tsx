import { ScriptOnce } from "@tanstack/react-router";
import { createContext, use, useEffect, useState } from "react";
import { themeSchema } from "~/domains/theme/theme.schemas";
import type { Theme } from "~/domains/theme/theme.schemas";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";

const themeKey = "theme";

type Context = Readonly<{
  value: Theme;
  set: Dispatch<SetStateAction<Theme>>;
}>;

const ThemeContext = createContext<Context | undefined>(undefined);

export const ThemeProvider = (props: PropsWithChildren) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    return themeSchema.catch("system").parse(localStorage.getItem(themeKey));
  });

  useEffect(() => {
    if (theme !== themeSchema.enum.system) {
      return;
    }

    const abortController = new AbortController();

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      (e) => {
        if (e.matches) {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      },
      {
        signal: abortController.signal,
      },
    );

    return () => abortController.abort();
  }, [theme]);

  useEffect(() => {
    const abortController = new AbortController();

    window.addEventListener(
      "storage",
      () => {
        const theme = themeSchema
          .catch("system")
          .parse(localStorage.getItem(themeKey));

        setTheme(theme);
      },
      {
        signal: abortController.signal,
      },
    );

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (theme === themeSchema.enum.system) {
      localStorage.removeItem(themeKey);

      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }

    if (theme === themeSchema.enum.dark) {
      localStorage.setItem(themeKey, themeSchema.enum.dark);
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }

    if (theme === themeSchema.enum.light) {
      localStorage.setItem(themeKey, themeSchema.enum.light);
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [theme]);

  return (
    <ThemeContext value={{ value: theme, set: setTheme }}>
      <LoadThemeScript />
      {props.children}
    </ThemeContext>
  );
};

const LoadThemeScript = () => {
  return (
    <ScriptOnce>
      {`
          function initTheme() {
            if (typeof localStorage === 'undefined') return

            if (localStorage.getItem('${themeKey}') === '${themeSchema.enum.dark}' || (!('${themeKey}' in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) ) {
              document.documentElement.classList.add("dark");
              document.documentElement.style.colorScheme = 'dark'
            } else {
              document.documentElement.classList.remove("dark");
              document.documentElement.style.colorScheme = "light";
            }
          }

          initTheme()
        `}
    </ScriptOnce>
  );
};

export const useTheme = () => {
  const ctx = use(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be wrapped inside <ThemeProvide/>");
  }

  return ctx;
};
