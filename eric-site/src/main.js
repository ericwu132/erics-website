/**
 * Features:
 * - Header menu appears on scroll
 * - Links move into the header one-by-one and back out dynamically
 * - Sidebar link positions are PINNED (no shifting) while docked:
 *   when a link leaves, a placeholder stays; when it returns, it goes back to its slot.
 * - Fancy underline is CSS
 * - Fade-in text on scroll (IntersectionObserver)
 * - "Learn more" arrow rotates right -> down and click scrolls to projects
 * helo
 * there
 */

const topbar = document.getElementById("topbar");
const topbarLinks = document.getElementById("topbarLinks");
const sideNav = document.getElementById("sideNav");


const HEADER_SHOW_AT_Y = 50;      // smaller = header appears earlier
const STEP_PX = 95;              // smaller = links transfer faster
const DURATION = 450;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const MAX_MOVES_PER_FRAME = 6;
const COMPACT_BREAKPOINT = 1500;


function allMovableNodes() {
  return [
    ...topbarLinks.querySelectorAll("a"),
    ...sideNav.querySelectorAll("a, .link-placeholder"),
  ];
}

function measure(elements) {
  const map = new Map();
  for (const el of elements) map.set(el, el.getBoundingClientRect());
  return map;
}

function flip(firstRects, elements) {
  for (const el of elements) {
    const first = firstRects.get(el);
    const last = el.getBoundingClientRect();
    if (!first) continue;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (dx === 0 && dy === 0) continue;

    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: DURATION, easing: EASING, fill: "both" }
    );
  }
}

function setDocked(docked) {
  document.body.classList.toggle("isDocked", docked);
}


function ensureIndices() {
  const links = sideNav.querySelectorAll("a");
  links.forEach((a, i) => {
    if (a.dataset.idx == null) a.dataset.idx = String(i);
  });
}
ensureIndices();

function makePlaceholderLike(linkEl) {
  const r = linkEl.getBoundingClientRect();
  const ph = document.createElement("div");
  ph.className = "link-placeholder";
  ph.style.height = `${Math.ceil(r.height)}px`;
  ph.dataset.idx = linkEl.dataset.idx;
  return ph;
}

function findPlaceholder(idx) {
  return sideNav.querySelector(`.link-placeholder[data-idx="${idx}"]`);
}

function createAllPlaceholdersIfMissing() {
 
  const allLinks = [
    ...sideNav.querySelectorAll("a"),
    ...topbarLinks.querySelectorAll("a"),
  ];

  const maxIdx = allLinks.reduce((m, a) => {
    const v = Number(a.dataset.idx ?? "0");
    return Math.max(m, v);
  }, 0);


  const sample = sideNav.querySelector("a") || topbarLinks.querySelector("a");
  const sampleH = sample ? Math.ceil(sample.getBoundingClientRect().height) : 24;

  for (let i = 0; i <= maxIdx; i++) {
    const idx = String(i);


    if (sideNav.querySelector(`a[data-idx="${idx}"]`)) continue;
  
    if (findPlaceholder(idx)) continue;

    const ph = document.createElement("div");
    ph.className = "link-placeholder";
    ph.dataset.idx = idx;
    ph.style.height = `${sampleH}px`;

    // insert by idx order among children
    const before = [...sideNav.children].find((node) => {
      const nIdx = node.dataset?.idx;
      if (nIdx == null) return false;
      return Number(nIdx) > i;
    });

    if (before) sideNav.insertBefore(ph, before);
    else sideNav.appendChild(ph);
  }
}

function removeAllPlaceholders() {
  sideNav.querySelectorAll(".link-placeholder").forEach((ph) => ph.remove());
}

function moveAllToTopbar() {
  removeAllPlaceholders();
  const links = [
    ...sideNav.querySelectorAll("a"),
    ...topbarLinks.querySelectorAll("a"),
  ];
  const sorted = links.sort(
    (a, b) => Number(a.dataset.idx) - Number(b.dataset.idx)
  );
  sorted.forEach((a) => topbarLinks.appendChild(a));
}

function moveOneToTop_PINNED() {
  const next = sideNav.querySelector("a");
  if (!next) return;

  const before = measure(allMovableNodes());

  const ph = makePlaceholderLike(next);
  next.replaceWith(ph);
  topbarLinks.appendChild(next);

  requestAnimationFrame(() => flip(before, allMovableNodes()));
}

function moveOneToSide_PINNED() {
  const last = topbarLinks.querySelector("a:last-child");
  if (!last) return;

  const before = measure(allMovableNodes());

  const idx = last.dataset.idx;
  const ph = findPlaceholder(idx);

  if (ph) {
    ph.replaceWith(last);
  } else {
    // fallback: insert by index order
    const beforeNode = [...sideNav.children].find((node) => {
      const nIdx = node.dataset?.idx;
      if (nIdx == null) return false;
      return Number(nIdx) > Number(idx);
    });
    if (beforeNode) sideNav.insertBefore(last, beforeNode);
    else sideNav.appendChild(last);
  }

  requestAnimationFrame(() => flip(before, allMovableNodes()));
}

function snapAllBackToSidebar() {
  // Put links back in sidebar, remove placeholders, and sort by idx.
  const links = [...topbarLinks.querySelectorAll("a")];
  links.forEach((a) => sideNav.appendChild(a));

  removeAllPlaceholders();

  const sorted = [...sideNav.querySelectorAll("a")].sort(
    (a, b) => Number(a.dataset.idx) - Number(b.dataset.idx)
  );
  sorted.forEach((a) => sideNav.appendChild(a));
}


let headerReady = false;

topbar.addEventListener("transitionend", (e) => {
  if (e.propertyName !== "transform") return;
  headerReady = document.body.classList.contains("isDocked");
});


function targetCount(scrollY) {
  if (scrollY <= HEADER_SHOW_AT_Y) return 0;

  const total =
    sideNav.querySelectorAll("a").length + topbarLinks.querySelectorAll("a").length;

  const progressed = scrollY - HEADER_SHOW_AT_Y;


  const want = Math.floor(progressed / STEP_PX) + 1;

  return Math.max(0, Math.min(total, want));
}

let ticking = false;

function updateMenuTransfer() {
  const y = window.scrollY;
  const compact = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT}px)`).matches;
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  if (compact) {
    headerReady = true;
    setDocked(true);
    moveAllToTopbar();
    // Skip FLIP animations on mobile for better performance
    if (mobile) return;
    return;
  }

  const shouldDock = y > HEADER_SHOW_AT_Y;
  const isDocked = document.body.classList.contains("isDocked");

  // Undocking: restore everything
  if (!shouldDock && isDocked) {
    snapAllBackToSidebar();
    headerReady = false;
    setDocked(false);
    return;
  }

  // Docking: start header slide-in (no link moves until ready)
  if (shouldDock && !isDocked) {
    headerReady = false;
    setDocked(true);
    return;
  }

  if (!shouldDock) return;

  // While header slides in: keep links visible in sidebar
  if (!headerReady) {
    snapAllBackToSidebar();
    return;
  }

  // Docked & ready: ensure sidebar slots exist (prevents shifting)
  createAllPlaceholdersIfMissing();

  const want = targetCount(y);
  let have = topbarLinks.querySelectorAll("a").length;

  // Move down/up to match want (limited per frame)
  let moves = 0;
  while (have < want && moves < MAX_MOVES_PER_FRAME) {
    moveOneToTop_PINNED();
    have++;
    moves++;
  }

  moves = 0;
  while (have > want && moves < MAX_MOVES_PER_FRAME) {
    moveOneToSide_PINNED();
    have--;
    moves++;
  }
}


function setupFadeIn() {
  const fadeEls = document.querySelectorAll(".fade-in");
  if (!fadeEls.length) return;

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          fadeObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  fadeEls.forEach((el) => fadeObserver.observe(el));
}

export function refreshFadeIn() {
  setupFadeIn();
}


function setupLearnMore() {
  const learnMore = document.getElementById("learnMore");
  const projects = document.getElementById("projects");
  if (!learnMore || !projects) return;

  learnMore.addEventListener("click", () => {
    projects.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  
}
function setupSideLinkIntro() {
  // Respect reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const links = sideNav?.querySelectorAll("a");
  if (!links || !links.length) return;

  document.body.classList.add("intro");

  // Stagger from top to bottom
  const step = 110;     // time between each link (ms)
  const duration = 700; // must match CSS animation duration (ms)

  links.forEach((a, i) => {
    a.style.setProperty("--delay", `${i * step}ms`);
  });

  // Remove the intro class after animation finishes
  const total = (links.length - 1) * step + duration + 50;
  setTimeout(() => {
    document.body.classList.remove("intro");
    // Optional: clean up inline vars
    links.forEach((a) => a.style.removeProperty("--delay"));
  }, total);
}

setupSideLinkIntro();

//scroll
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateMenuTransfer();
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  updateMenuTransfer();
});

setupFadeIn();
setupLearnMore();
updateMenuTransfer();

function setupProjectRail() {
  const items = document.querySelectorAll(".rail__item");
  if (!items.length) return;

  const typeEl = document.getElementById("railType");
  const titleEl = document.getElementById("railTitle");
  const subtitleEl = document.getElementById("railSubtitle");
  const bodyEl = document.getElementById("railBody");
  const imageEl = document.getElementById("railImage");
  const videoEl = document.getElementById("railVideo");

  if (!typeEl || !titleEl || !subtitleEl || !bodyEl || !imageEl || !videoEl) return;

  function applyFrom(item) {
    const { type, title, subtitle, body, body2, image, video } = item.dataset;

    items.forEach((el) => el.classList.remove("is-active"));
    item.classList.add("is-active");

    typeEl.textContent = type || "";
    titleEl.textContent = title || "";
    subtitleEl.textContent = subtitle || "";

    bodyEl.innerHTML = "";
    if (body) {
      const p = document.createElement("p");
      p.innerHTML = body;
      bodyEl.appendChild(p);
    }
    if (body2) {
      const p = document.createElement("p");
      p.innerHTML = body2;
      bodyEl.appendChild(p);
    }

    if (image) {
      imageEl.src = image;
    }

    if (video) {
      videoEl.src = video;
      videoEl.style.display = "block";
      imageEl.style.display = "none";
    } else {
      videoEl.src = "";
      videoEl.style.display = "none";
      imageEl.style.display = "block";
    }
  }

  const initial = document.querySelector(".rail__item.is-active") || items[0];
  if (initial) applyFrom(initial);

  // Detect hover capability
  const hasHover = window.matchMedia('(hover: hover)').matches;

  items.forEach((item) => {
    if (hasHover) {
      // Desktop: hover + focus
      item.addEventListener("mouseenter", () => applyFrom(item));
      item.addEventListener("focus", () => applyFrom(item));
    } else {
      // Touch: click only
      item.addEventListener("click", () => applyFrom(item));
    }
  });
}

setupProjectRail();

// Fix mobile viewport height for iOS
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVH();
window.addEventListener('resize', setVH);
