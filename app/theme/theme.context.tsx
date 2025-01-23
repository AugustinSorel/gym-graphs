import { ScriptOnce } from "@tanstack/react-router";
import { createContext, use, useEffect, useState } from "react";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { themeSchema } from "~/theme/theme.schemas";
import type { Theme } from "~/theme/theme.schemas";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";

const themeKey = "theme";

type Context = {
  value: Theme;
  set: Dispatch<SetStateAction<Theme>>;
};

const ThemeContext = createContext<Context | undefined>(undefined);

export const ThemeProvider = (props: PropsWithChildren) => {
  const [theme, setTheme] = useState<Theme>("system");
  const localStorage = useLocalStorage(themeKey, themeSchema.catch("system"));

  useEffect(() => {
    setTheme(localStorage.get());
  }, [setTheme]);

  useEffect(() => {
    if (theme !== themeSchema.Values.system) {
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
        setTheme(localStorage.get());
      },
      {
        signal: abortController.signal,
      },
    );

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (theme === themeSchema.Values.system) {
      localStorage.remove();

      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }

    if (theme === themeSchema.Values.dark) {
      localStorage.set("dark");
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }

    if (theme === themeSchema.Values.light) {
      localStorage.set("light");
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

            if (localStorage.getItem('${themeKey}') === '${themeSchema.Values.dark}' || (!('${themeKey}' in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) ) {
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
