document.addEventListener("click", (event) => {
  const clickedElement = event.target.closest(
    "button, a, input[type='radio'], input[type='checkbox'], option",
  );

  if (clickedElement) {
    if ("vibrate" in navigator) {
      navigator.vibrate(15);
    }
  }
});
