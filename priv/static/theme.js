const themeKey = "theme";

const cachedTheme = localStorage.getItem(themeKey);
if (cachedTheme) {
  document.documentElement.dataset.theme = cachedTheme;
}

document.addEventListener("DOMContentLoaded", () => {
  const themeFieldset = document.querySelector(
    'fieldset:has(input[name="theme"])',
  );

  if (!themeFieldset) {
    return;
  }

  const storedTheme = localStorage.getItem(themeKey) ?? "system";

  const selectedInput = themeFieldset.querySelector(
    `input[value="${storedTheme}"]`,
  );

  if (selectedInput) {
    selectedInput.checked = true;
  }

  themeFieldset.addEventListener("change", (event) => {
    const value = event.target.value;

    if (value === "system") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem(themeKey);
    } else {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem(themeKey, value);
    }
  });
});
