const root = document.documentElement;
const body = document.body;
const nextPage = body.dataset.nextPage || "";
const prevPage = body.dataset.prevPage || "";
const WHEEL_THRESHOLD = 90;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ROUTE_DELAY_MS = prefersReducedMotion ? 0 : 150;

root.classList.add("motion", "page-enter");
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo({ top: 0, left: 0, behavior: "auto" });


const modeToggle = document.getElementById("mode-toggle");
const THEME_KEY = "portfolio-theme";

function applyTheme(theme) {
  const isLight = theme === "light";
  root.classList.toggle("light-mode", isLight);
  if (modeToggle) {
    modeToggle.setAttribute("aria-pressed", String(isLight));
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage failures (private browsing / blocked storage).
  }
}

const storedTheme = readStoredTheme();
if (storedTheme === "light" || storedTheme === "dark") {
  applyTheme(storedTheme);
}

if (modeToggle) {
  modeToggle.addEventListener("click", () => {
    const nextTheme = root.classList.contains("light-mode") ? "dark" : "light";
    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
  });
}

function isNearBlack(r, g, b) {
  return r < 24 && g < 24 && b < 24;
}

function cutoutBlackBackground(img) {
  if (!img || img.dataset.cutoutReady === "1") {
    return;
  }

  const process = () => {
    try {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      if (!width || !height) {
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const frame = ctx.getImageData(0, 0, width, height);
      const { data } = frame;
      const total = width * height;
      const visited = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;

      const enqueue = (idx) => {
        if (visited[idx]) {
          return;
        }
        const offset = idx * 4;
        if (!isNearBlack(data[offset], data[offset + 1], data[offset + 2])) {
          return;
        }
        visited[idx] = 1;
        queue[tail] = idx;
        tail += 1;
      };

      for (let x = 0; x < width; x += 1) {
        enqueue(x);
        enqueue((height - 1) * width + x);
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(y * width);
        enqueue(y * width + (width - 1));
      }

      while (head < tail) {
        const idx = queue[head];
        head += 1;
        const x = idx % width;
        const y = (idx / width) | 0;

        if (x > 0) {
          enqueue(idx - 1);
        }
        if (x < width - 1) {
          enqueue(idx + 1);
        }
        if (y > 0) {
          enqueue(idx - width);
        }
        if (y < height - 1) {
          enqueue(idx + width);
        }
      }

      for (let idx = 0; idx < total; idx += 1) {
        if (!visited[idx]) {
          continue;
        }
        const offset = idx * 4;
        data[offset + 3] = 0;
      }

      ctx.putImageData(frame, 0, 0);
      img.src = canvas.toDataURL("image/png");
      img.dataset.cutoutReady = "1";
    } catch {
      // No-op: keep original image if pixel processing is blocked.
    }
  };

  if (img.complete) {
    process();
    return;
  }

  img.addEventListener("load", process, { once: true });
}

function applyHeroCutout() {
  const cutoutImages = document.querySelectorAll("img[data-cutout='true']");
  cutoutImages.forEach((img) => cutoutBlackBackground(img));
}

applyHeroCutout();

function initSolarParallax() {
  const scenes = Array.from(document.querySelectorAll(".solar-scene"));
  if (!scenes.length || prefersReducedMotion) {
    return;
  }

  root.classList.remove("galaxy-hover");
  const oldLayer = document.querySelector(".galaxy-shoot-layer");
  if (oldLayer) {
    oldLayer.remove();
  }

  scenes.forEach((scene) => {
    scene.style.setProperty("--parallax-x", "0px");
    scene.style.setProperty("--parallax-y", "0px");
  });
}

initSolarParallax();

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) {
    return;
  }

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");
  const submitButton = document.getElementById("contact-submit");
  const statusEl = document.getElementById("contact-status");

  const setStatus = (message, type = "") => {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error");
    if (type === "success") {
      statusEl.classList.add("is-success");
    }
    if (type === "error") {
      statusEl.classList.add("is-error");
    }
  };

  const validate = (payload) => {
    if (payload.name.length < 2 || payload.name.length > 80) {
      return "Name must be 2-80 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return "Please enter a valid email address.";
    }
    if (payload.message.length < 10 || payload.message.length > 1200) {
      return "Message must be 10-1200 characters.";
    }
    return "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: (nameInput?.value || "").trim(),
      email: (emailInput?.value || "").trim(),
      message: (messageInput?.value || "").trim()
    };

    const error = validate(payload);
    if (error) {
      setStatus(error, "error");
      return;
    }

    if (window.location.protocol === "file:") {
      const subject = encodeURIComponent("Portfolio Contact Message");
      const bodyLines = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        "",
        payload.message
      ];
      const bodyText = encodeURIComponent(bodyLines.join("\n"));
      window.location.href = `mailto:rajchambyal1357@gmail.com?subject=${subject}&body=${bodyText}`;
      setStatus("Opened your email app with this message.", "success");
      return;
    }

    const originalLabel = submitButton?.textContent || "Send Message";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    setStatus("Sending message...");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        const details = Array.isArray(body?.details) ? body.details.join(" ") : "";
        const serverMessage = body?.error || "Unable to send message right now.";
        setStatus(details ? `${serverMessage} ${details}` : serverMessage, "error");
        return;
      }

      setStatus(body?.message || "Message sent successfully.", "success");
      form.reset();
    } catch {
      setStatus("Unable to reach server. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

initContactForm();

window.setTimeout(() => {
  root.classList.remove("page-enter");
}, 360);

const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  }
);

revealEls.forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 70, 320)}ms`;
  observer.observe(el);
});

let routing = false;
function routeTo(href) {
  if (!href || routing) {
    return;
  }

  routing = true;
  root.classList.remove("route-shift");
  void root.offsetWidth;
  root.classList.add("route-shift");

  window.setTimeout(() => {
    window.location.href = href;
  }, ROUTE_DELAY_MS);
}

function isInternalPageLink(anchor) {
  const rawHref = anchor.getAttribute("href") || "";
  if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
    return false;
  }

  if (anchor.target === "_blank") {
    return false;
  }

  try {
    const url = new URL(rawHref, window.location.href);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isFile = url.protocol === "file:";
    if (!isHttp && !isFile) {
      return false;
    }

    const currentPath = window.location.pathname.split("/").pop();
    const nextPath = url.pathname.split("/").pop();
    if (!nextPath.endsWith(".html")) {
      return false;
    }

    return currentPath !== nextPath || url.hash;
  } catch {
    return false;
  }
}

const allLinks = document.querySelectorAll("a[href]");
allLinks.forEach((link) => {
  if (!isInternalPageLink(link)) {
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    routeTo(link.getAttribute("href"));
  });
});

function scrollTopValue() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function fullHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );
}

function viewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function isShortPage() {
  return fullHeight() <= viewportHeight() + 10;
}

function isAtBottom() {
  return scrollTopValue() + viewportHeight() >= fullHeight() - 8;
}

function isAtTop() {
  return scrollTopValue() <= 6;
}

let wheelDown = 0;
let wheelUp = 0;

window.addEventListener(
  "wheel",
  (event) => {
    if (routing) {
      return;
    }

    if (event.deltaY > 0) {
      wheelUp = 0;
      if ((isAtBottom() || isShortPage()) && nextPage) {
        wheelDown += event.deltaY;
        if (wheelDown > WHEEL_THRESHOLD) {
          routeTo(nextPage);
        }
      } else {
        wheelDown = 0;
      }
    } else if (event.deltaY < 0) {
      wheelDown = 0;
      if ((isAtTop() || isShortPage()) && prevPage) {
        wheelUp += Math.abs(event.deltaY);
        if (wheelUp > WHEEL_THRESHOLD) {
          routeTo(prevPage);
        }
      } else {
        wheelUp = 0;
      }
    }
  },
  { passive: true }
);

let touchStartY = null;
window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  (event) => {
    if (routing || touchStartY == null) {
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - endY;

    if (delta > 48 && (isAtBottom() || isShortPage()) && nextPage) {
      routeTo(nextPage);
    } else if (delta < -48 && (isAtTop() || isShortPage()) && prevPage) {
      routeTo(prevPage);
    }

    touchStartY = null;
  },
  { passive: true }
);

window.addEventListener("keydown", (event) => {
  if (routing) {
    return;
  }

  const targetTag = event.target?.tagName;
  if (targetTag === "INPUT" || targetTag === "TEXTAREA") {
    return;
  }

  if (["ArrowDown", "PageDown"].includes(event.key) || event.key === " ") {
    if ((isAtBottom() || isShortPage()) && nextPage) {
      routeTo(nextPage);
    }
  }

  if (["ArrowUp", "PageUp"].includes(event.key)) {
    if ((isAtTop() || isShortPage()) && prevPage) {
      routeTo(prevPage);
    }
  }
});
