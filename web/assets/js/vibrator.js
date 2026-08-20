document.addEventListener("click", (event) => {
  const clickedElement = event.target.closest(
    "button, a, input[type='radio'], input[type='checkbox'], option, summary",
  );

  if (clickedElement) {
    if ("vibrate" in navigator) {
      navigator.vibrate(15);
    }
  }
});
