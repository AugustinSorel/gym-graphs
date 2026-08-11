document.addEventListener("click", (event) => {
  const clickedElement = event.target.closest("button, a");

  if (clickedElement) {
    if ("vibrate" in navigator) {
      navigator.vibrate(15);
    }
  }
});
