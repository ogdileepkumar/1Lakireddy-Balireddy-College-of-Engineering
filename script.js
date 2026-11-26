"use strict";

(() => {
  const form = document.getElementById("name-form");
  const nameInput = document.getElementById("guest-name");
  const nameError = document.getElementById("name-error");
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    question: document.getElementById("question-screen"),
    poster: document.getElementById("poster-screen")
  };
  const greeting = document.getElementById("personal-greeting");
  const posterMessage = document.getElementById("poster-message");
  const answerActions = document.getElementById("answer-actions");
  const reconsiderPanel = document.getElementById("reconsider-panel");
  const announcer = document.getElementById("screen-announcer");
  const canvas = document.getElementById("celebration-canvas");
  const posterImage = document.getElementById("poster-image");
  const posterPlaceholder = document.getElementById("poster-placeholder");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let guestName = "";
  let transitioning = false;
  let animationFrame = 0;
  let particleExpiry = 0;
  let particles = [];

  function showScreen(target, announcement, afterTransition) {
    if (transitioning) return;
    transitioning = true;
    const current = Object.values(screens).find((screen) => !screen.hidden);
    if (!current || current === target) {
      transitioning = false;
      return;
    }

    current.classList.add("is-leaving");
    window.setTimeout(() => {
      current.hidden = true;
      current.classList.remove("is-leaving");
      target.hidden = false;
      target.classList.remove("is-active");
      void target.offsetWidth;
      target.classList.add("is-active");
      transitioning = false;
      announcer.textContent = announcement;
      if (typeof afterTransition === "function") afterTransition();
      const heading = target.querySelector("h1, h2, .personal-greeting");
      if (heading) heading.setAttribute("tabindex", "-1");
      if (heading) heading.focus({ preventScroll: true });
    }, reducedMotion.matches ? 0 : 350);
  }

  function clearNameError() {
    nameError.textContent = "";
    nameInput.removeAttribute("aria-invalid");
  }

  function enterName(event) {
    event.preventDefault();
    if (transitioning) return;
    const value = nameInput.value.trim();
    if (!value) {
      nameError.textContent = "Please enter your name first — your surprise is waiting! ✨";
      nameInput.setAttribute("aria-invalid", "true");
      nameInput.focus();
      return;
    }

    clearNameError();
    guestName = value;
    greeting.replaceChildren(document.createTextNode(`Hey, ${guestName}! `));
    const heart = document.createElement("span");
    heart.setAttribute("aria-hidden", "true");
    heart.textContent = "❤️";
    greeting.append(heart);
    posterMessage.textContent = `Get ready, ${guestName}! An amazing experience awaits you!`;
    reconsiderPanel.hidden = true;
    answerActions.hidden = false;
    showScreen(screens.question, `Hey, ${guestName}! Are you excited for the event?`);
  }

  function sayNo() {
    if (transitioning) return;
    answerActions.hidden = true;
    reconsiderPanel.hidden = false;
    document.getElementById("reconsider-button").focus();
  }

  function celebrate() {
    if (transitioning) return;
    showScreen(screens.poster, `The event poster is revealed. Get ready, ${guestName}!`, startCelebration);
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    const context = canvas.getContext("2d");
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function startCelebration() {
    cancelAnimationFrame(animationFrame);
    particles = [];
    if (reducedMotion.matches) return;

    resizeCanvas();
    const colors = ["#d9b8ff", "#ff8acb", "#78dfff", "#ffe38a", "#a695ff"];
    const count = Math.min(115, Math.max(55, Math.round(window.innerWidth / 8)));
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -Math.random() * window.innerHeight * 0.8,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 1.1 + Math.random() * 2.2,
        size: 2 + Math.random() * 3.5,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.12,
        color: colors[index % colors.length],
        shape: Math.random() > 0.45
      });
    }

    particleExpiry = performance.now() + 5200;
    animationFrame = requestAnimationFrame(drawCelebration);
  }

  function drawCelebration(now) {
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const remaining = Math.max(0, Math.min(1, (particleExpiry - now) / 800));

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.spin;
      context.save();
      context.globalAlpha = remaining * 0.9;
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      if (particle.shape) {
        context.fillRect(-particle.size / 2, -particle.size, particle.size, particle.size * 2);
      } else {
        context.beginPath();
        context.arc(0, 0, particle.size / 1.7, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    });

    if (now < particleExpiry && !screens.poster.hidden) {
      animationFrame = requestAnimationFrame(drawCelebration);
    } else {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles = [];
    }
  }

  function replay() {
    if (transitioning) return;
    cancelAnimationFrame(animationFrame);
    const context = canvas.getContext("2d");
    if (context) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = [];
    guestName = "";
    nameInput.value = "";
    clearNameError();
    showScreen(screens.welcome, "Welcome. Enter your name to begin.", () => nameInput.focus({ preventScroll: true }));
  }

  form.addEventListener("submit", enterName);
  nameInput.addEventListener("input", clearNameError);
  document.getElementById("no-button").addEventListener("click", sayNo);
  document.getElementById("yes-button").addEventListener("click", celebrate);
  document.getElementById("reconsider-button").addEventListener("click", celebrate);
  document.getElementById("replay-button").addEventListener("click", replay);

  posterImage.addEventListener("error", () => {
    posterImage.classList.add("is-unavailable");
    posterPlaceholder.hidden = false;
  });
  posterImage.addEventListener("load", () => {
    posterImage.classList.remove("is-unavailable");
    posterPlaceholder.hidden = true;
  });
  window.addEventListener("resize", () => {
    if (!screens.poster.hidden && particles.length) resizeCanvas();
  });
})();
