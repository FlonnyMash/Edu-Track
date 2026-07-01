import confetti from "canvas-confetti";

const CITY_POP_COLORS = ["#ff4d8d", "#3ddbcf", "#ff9a56", "#facc15"];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fireCornerCannons(durationMs: number) {
  const end = Date.now() + durationMs;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 85,
      startVelocity: 50,
      origin: { x: 0, y: 1 },
      colors: CITY_POP_COLORS,
      ticks: 200,
      gravity: 0.9,
    });

    confetti({
      particleCount: 4,
      angle: 120,
      spread: 85,
      startVelocity: 50,
      origin: { x: 1, y: 1 },
      colors: CITY_POP_COLORS,
      ticks: 200,
      gravity: 0.9,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

function fireCenterBurst() {
  confetti({
    particleCount: 80,
    spread: 100,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.6 },
    colors: ["#ff4d8d", "#3ddbcf"],
    ticks: 250,
    gravity: 0.8,
    scalar: 1.1,
  });
}

function fireFinaleShower() {
  confetti({
    particleCount: 60,
    spread: 160,
    startVelocity: 30,
    origin: { x: 0.5, y: 0 },
    colors: CITY_POP_COLORS,
    ticks: 300,
    gravity: 1.1,
    scalar: 1.2,
    drift: 0.5,
  });
}

export function triggerJackpotConfetti() {
  if (prefersReducedMotion()) return;

  fireCornerCannons(1200);

  setTimeout(fireCenterBurst, 400);
  setTimeout(fireFinaleShower, 800);
}
