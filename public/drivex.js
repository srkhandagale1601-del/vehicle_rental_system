gsap.registerPlugin(ScrollTrigger);

const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
let currentUser = null;
let currentVehicle = null;
let currentBookingId = null;
let likedVehicles = new Set();
let activeView = "home";
let vehicles = [];
let filteredVehicles = [];
let bookingTotal = 0;
let selectedMethod = "CARD";
let quickFilter = "all";

const fallbackVehicles = [
  {
    id: 1,
    name: "Toyota Fortuner",
    type: "SUV",
    seats: 7,
    rating: 4.9,
    price_per_day: 5200,
    image_url: "/images/vehicles/toyota_fortuner.jpg",
    emoji: "🚙",
  },
  {
    id: 2,
    name: "Honda City",
    type: "Sedan",
    seats: 5,
    rating: 4.7,
    price_per_day: 3600,
    image_url: "/images/vehicles/hondacity.jpg",
    emoji: "🚘",
  },
  {
    id: 3,
    name: "Tata Nexon",
    type: "SUV",
    seats: 5,
    rating: 4.6,
    price_per_day: 4100,
    image_url: "/images/vehicles/nexon.jpg",
    emoji: "🚗",
  },
  {
    id: 4,
    name: "Swift Zip",
    type: "Hatchback",
    seats: 5,
    rating: 4.5,
    price_per_day: 2400,
    image_url: "/images/vehicles/swift.jpg",
    emoji: "🚕",
  },
  {
    id: 5,
    name: "Pulsar Rider",
    type: "Bike",
    seats: 2,
    rating: 4.8,
    price_per_day: 1400,
    image_url: "/images/vehicles/pulsar.jpg",
    emoji: "🏍️",
  },
  {
    id: 6,
    name: "Duke Street",
    type: "Bike",
    seats: 2,
    rating: 4.4,
    price_per_day: 1700,
    image_url: "/images/vehicles/duke.jpg",
    emoji: "🏍️",
  },
];

const el = {
  navLinks: document.getElementById("navLinks"),
  userChip: document.getElementById("userChip"),
  userEmail: document.getElementById("userEmail"),
  logoutBtn: document.getElementById("logoutBtn"),
  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  mobileToggle: document.getElementById("mobileToggle"),
  vehicleGrid: document.getElementById("vehicleGrid"),
  searchForm: document.getElementById("searchForm"),
  toastWrap: document.getElementById("toastWrap"),
  bookingList: document.getElementById("bookingList"),
  paymentList: document.getElementById("paymentList"),
  homeView: document.getElementById("homeView"),
  bookingsView: document.getElementById("bookingsView"),
  paymentsView: document.getElementById("paymentsView"),
  authOverlay: document.getElementById("authOverlay"),
  bookingOverlay: document.getElementById("bookingOverlay"),
  paymentOverlay: document.getElementById("paymentOverlay"),
  paymentAmount: document.getElementById("paymentAmount"),
  payNowBtn: document.getElementById("payNowBtn"),
  fleetMeta: document.getElementById("fleetMeta"),
  bookingSuccess: document.getElementById("bookingSuccess"),
  paymentSuccess: document.getElementById("paymentSuccess"),
};

const api = async (endpoint, options = {}) => {
  const res = await fetch(API_BASE + endpoint, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    data = {};
  }
  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
};

const formatMoney = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const todayIso = () => new Date().toISOString().split("T")[0];
const escapeHtml = (s) =>
  String(s || "").replace(
    /[&<>'"]/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        ch
      ],
  );

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  el.toastWrap.appendChild(toast);
  gsap.fromTo(
    toast,
    { x: 80, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" },
  );
  setTimeout(
    () =>
      gsap.to(toast, {
        x: 80,
        opacity: 0,
        duration: 0.3,
        onComplete: () => toast.remove(),
      }),
    3500,
  );
}

function updateNav() {
  const isAuth = !!currentUser;
  el.userChip.style.display = isAuth ? "flex" : "none";
  el.logoutBtn.style.display = isAuth ? "inline-flex" : "none";
  el.loginBtn.style.display = isAuth ? "none" : "inline-flex";
  el.signupBtn.style.display = isAuth ? "none" : "inline-flex";
  if (isAuth) el.userEmail.textContent = currentUser.email || "DriveX User";
}

async function handleApiError(err, options = {}) {
  if (err.status === 401) {
    if (options.authRequiredMessage)
      showToast(options.authRequiredMessage, "info");
    if (options.openAuth !== false) openModal("authOverlay");
    return true;
  }
  showToast(err.message || "Request failed", "error");
  return false;
}

function splitHeroChars() {
  document.querySelectorAll(".hero-line").forEach((line) => {
    const txt = line.getAttribute("data-text") || line.textContent;
    line.innerHTML = txt
      .split("")
      .map(
        (ch) => `<span class="hero-char">${ch === " " ? "&nbsp;" : ch}</span>`,
      )
      .join("");
  });
}

function animateHero() {
  gsap.from(".hero-char", {
    y: 80,
    opacity: 0,
    duration: 0.8,
    stagger: 0.03,
    ease: "power4.out",
    delay: 0.3,
  });
}

function initScrollReveals() {
  gsap.utils.toArray(".reveal").forEach((item) => {
    gsap.from(item, {
      y: 36,
      opacity: 0,
      duration: 0.65,
      ease: "power3.out",
      scrollTrigger: { trigger: item, start: "top 84%" },
    });
  });
}

function initCounters() {
  document.querySelectorAll("[data-counter]").forEach((node) => {
    const target = Number(node.dataset.counter || 0);
    const decimal = node.dataset.decimal === "1";
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: "#statsRow", start: "top 82%" },
      onUpdate: () => {
        node.textContent = decimal
          ? (obj.v / 10).toFixed(1)
          : `${Math.floor(obj.v)}+`;
      },
    });
  });
}

function initMarquee() {
  const part =
    'INSTANT BOOKING <span class="dot">✦</span> FREE CANCELLATION <span class="dot">✦</span> 24/7 SUPPORT <span class="dot">✦</span> FULL INSURANCE <span class="dot">✦</span> PREMIUM FLEET <span class="dot">✦</span>';
  document.getElementById("marqueeTrack").innerHTML =
    `<div class="marquee-item">${part}</div><div class="marquee-item">${part}</div><div class="marquee-item">${part}</div><div class="marquee-item">${part}</div>`;
}

function renderSkeletons() {
  el.vehicleGrid.innerHTML =
    '<article class="skeleton-card"></article><article class="skeleton-card"></article><article class="skeleton-card"></article>';
}

function getVehicleEmoji(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("bike")) return "🏍️";
  if (t.includes("suv")) return "🚙";
  if (t.includes("hatch")) return "🚕";
  if (t.includes("sedan")) return "🚘";
  return "🚗";
}

function resolveVehicleImage(imageUrl = "", vehicleName = "") {
  const nameKey = String(vehicleName || "")
    .trim()
    .toLowerCase();
  const forcedByName = {
    "maruti suzuki swift": `${API_BASE}/images/vehicles/swift.jpg`,
    "honda amaze": `${API_BASE}/images/vehicles/amaze.jpg`,
    "hyundai amaze": `${API_BASE}/images/vehicles/amaze.jpg`,
  };
  if (forcedByName[nameKey]) return forcedByName[nameKey];

  const raw = String(imageUrl || "").trim();
  if (!raw) {
    const slug = vehicleName.toLowerCase().replace(/\s+/g, "_");
    return `${API_BASE}/images/vehicles/${slug}.jpg`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("images/")) return `${API_BASE}/${raw}`;
  return `${API_BASE}/images/vehicles/${raw}`;
}

function normalizeVehicle(v) {
  return {
    id: Number(v.id),
    name: v.name || "DriveX Ride",
    type: v.type || "Car",
    seats: Number(v.seats || 4),
    rating: Number(v.rating || 4.5),
    price_per_day: Number(v.price_per_day || v.price || 2500),
    image_url: v.image_url || "",
    emoji: v.emoji || getVehicleEmoji(v.type),
  };
}

function getFilterValues() {
  return {
    type: document.getElementById("typeSelect").value,
    seats: Number(document.getElementById("seatsSelect").value || 0),
    rating: Number(document.getElementById("ratingSelect").value || 0),
    min_price: Number(document.getElementById("minPrice").value || 0),
    max_price: Number(document.getElementById("maxPrice").value || 0),
    fromDate: document.getElementById("fromDate").value,
    toDate: document.getElementById("toDate").value,
  };
}

async function refreshFleetFromCurrentFilters() {
  await fetchVehiclesWithFilters(getFilterValues());
}

function applyQuickFilter(list) {
  if (quickFilter === "car")
    return list.filter((v) => String(v.type).toLowerCase() === "car");
  if (quickFilter === "bike")
    return list.filter((v) => String(v.type).toLowerCase() === "bike");
  if (quickFilter === "seats5") return list.filter((v) => Number(v.seats) >= 5);
  if (quickFilter === "top") return list.filter((v) => Number(v.rating) >= 4.5);
  return list;
}

function applyLocalFilters(list, filterVals) {
  let out = [...list];
  if (filterVals.type)
    out = out.filter(
      (v) => String(v.type).toLowerCase() === filterVals.type.toLowerCase(),
    );
  if (filterVals.seats)
    out = out.filter((v) => Number(v.seats) >= filterVals.seats);
  if (filterVals.rating)
    out = out.filter((v) => Number(v.rating) >= filterVals.rating);
  if (filterVals.min_price)
    out = out.filter((v) => Number(v.price_per_day) >= filterVals.min_price);
  if (filterVals.max_price)
    out = out.filter((v) => Number(v.price_per_day) <= filterVals.max_price);
  return applyQuickFilter(out);
}

async function fetchVehiclesWithFilters(filterVals) {
  try {
    let rows = [];
    const hasDateRange = filterVals.fromDate && filterVals.toDate;

    if (hasDateRange) {
      if (new Date(filterVals.fromDate) >= new Date(filterVals.toDate)) {
        showToast("Available To must be after Available From", "error");
        return;
      }
      const res = await api("/vehicles/available", {
        method: "POST",
        body: JSON.stringify({
          start_date: filterVals.fromDate,
          end_date: filterVals.toDate,
        }),
      });
      rows = res.data || [];
    } else {
      const params = new URLSearchParams();
      if (filterVals.type) params.set("type", filterVals.type);
      if (filterVals.seats) params.set("seats", String(filterVals.seats));
      if (filterVals.rating) params.set("rating", String(filterVals.rating));
      if (filterVals.min_price)
        params.set("min_price", String(filterVals.min_price));
      if (filterVals.max_price)
        params.set("max_price", String(filterVals.max_price));
      rows = await api(
        `/vehicles${params.toString() ? `?${params.toString()}` : ""}`,
      );
    }

    const normalized = (Array.isArray(rows) ? rows : []).map(normalizeVehicle);
    vehicles = normalized;
    filteredVehicles = hasDateRange
      ? applyLocalFilters(normalized, filterVals)
      : applyQuickFilter(normalized);
    renderVehicleGrid();
  } catch (err) {
    await handleApiError(err, {
      authRequiredMessage: "Unable to refresh fleet right now",
      openAuth: false,
    });
  }
}

function initPriceSlider() {
  const minSlider = document.getElementById("priceMin");
  const maxSlider = document.getElementById("priceMax");
  const rangeLabel = document.getElementById("priceRangeLabel");
  const minInput = document.getElementById("minPrice");
  const maxInput = document.getElementById("maxPrice");
  const sliderFill = document.getElementById("sliderFill");

  if (
    !minSlider ||
    !maxSlider ||
    !rangeLabel ||
    !minInput ||
    !maxInput ||
    !sliderFill
  )
    return;

  const sliderMin = Number(minSlider.min || 0);
  const sliderMax = Number(minSlider.max || 15000);
  const sliderStep = Number(minSlider.step || 100);

  const clampToStep = (value) => {
    const clamped = Math.min(
      sliderMax,
      Math.max(sliderMin, Number(value) || 0),
    );
    return Math.round(clamped / sliderStep) * sliderStep;
  };

  const render = (minVal, maxVal) => {
    const minPercent = ((minVal - sliderMin) / (sliderMax - sliderMin)) * 100;
    const maxPercent = ((maxVal - sliderMin) / (sliderMax - sliderMin)) * 100;
    sliderFill.style.left = `${minPercent}%`;
    sliderFill.style.width = `${maxPercent - minPercent}%`;
    rangeLabel.textContent = `₹${minVal.toLocaleString("en-IN")} – ₹${maxVal.toLocaleString("en-IN")}`;
  };

  const syncFromSliders = (changed) => {
    let minVal = clampToStep(minSlider.value);
    let maxVal = clampToStep(maxSlider.value);

    if (minVal > maxVal) {
      if (changed === "min") maxVal = minVal;
      else minVal = maxVal;
    }

    minSlider.value = String(minVal);
    maxSlider.value = String(maxVal);
    minInput.value = String(minVal);
    maxInput.value = String(maxVal);
    render(minVal, maxVal);
  };

  const syncFromNumbers = (changed) => {
    let minVal = clampToStep(minInput.value);
    let maxVal = clampToStep(maxInput.value);

    if (minInput.value === "") minVal = sliderMin;
    if (maxInput.value === "") maxVal = sliderMax;

    if (minVal > maxVal) {
      if (changed === "min") maxVal = minVal;
      else minVal = maxVal;
    }

    minSlider.value = String(minVal);
    maxSlider.value = String(maxVal);
    minInput.value = String(minVal);
    maxInput.value = String(maxVal);
    render(minVal, maxVal);
  };

  minSlider.addEventListener("input", () => syncFromSliders("min"));
  maxSlider.addEventListener("input", () => syncFromSliders("max"));
  minInput.addEventListener("input", () => syncFromNumbers("min"));
  maxInput.addEventListener("input", () => syncFromNumbers("max"));

  syncFromSliders("max");
}

function vehicleCardTemplate(v) {
  const liked = likedVehicles.has(v.id);
  const imgSrc = resolveVehicleImage(v.image_url, v.name);
  const safeName = escapeHtml(v.name);
  const safeType = escapeHtml(v.type);

  return `
    <article class="vehicle-card" data-id="${v.id}">
      <span class="card-badge">★ ${Number(v.rating).toFixed(1)}</span>
      <button class="like-btn ${liked ? "liked" : ""}" data-like="${v.id}">${liked ? "♥" : "♡"}</button>
      <div class="card-visual media-frame is-loading">
        <img class="card-img vehicle-image" src="${imgSrc}" alt="${safeName}" loading="lazy" decoding="async" width="1200" height="800" />
        <div class="media-skeleton"></div>
        <div class="card-emoji media-fallback" style="display:none;">${v.emoji}</div>
      </div>
      <div class="card-body">
        <div class="type-chip">${safeType}</div>
        <h3 class="vehicle-name">${safeName}</h3>
        <div class="meta-row"><span>👥 ${v.seats} seats</span><span>⭐ ${Number(v.rating).toFixed(1)}</span></div>
        <div class="price-row">
          <div class="price">${formatMoney(v.price_per_day)} <span>/ day</span></div>
          <button class="btn btn-accent" data-book="${v.id}">Book Now</button>
        </div>
      </div>
    </article>
  `;
}

function setupCardImageLoading() {
  document.querySelectorAll(".media-frame .vehicle-image").forEach((img) => {
    const frame = img.closest(".media-frame");
    const fallback = frame?.querySelector(".media-fallback");
    if (!frame) return;

    const markLoaded = () => frame.classList.remove("is-loading");
    const markError = () => {
      img.style.display = "none";
      if (fallback) fallback.style.display = "grid";
      frame.classList.remove("is-loading");
    };

    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded();
      else markError();
      return;
    }

    img.addEventListener("load", markLoaded, { once: true });
    img.addEventListener("error", markError, { once: true });
  });
}

function renderVehicleGrid() {
  if (el.fleetMeta) {
    el.fleetMeta.textContent = `${filteredVehicles.length} of ${vehicles.length} vehicles shown`;
  }
  if (!filteredVehicles.length) {
    el.vehicleGrid.innerHTML =
      '<div class="empty"><span class="emoji">🔍</span>No vehicles matched your filters. Try broader search.</div>';
    return;
  }
  el.vehicleGrid.innerHTML = filteredVehicles.map(vehicleCardTemplate).join("");
  setupCardImageLoading();
  gsap.from(el.vehicleGrid.querySelectorAll(".vehicle-card"), {
    y: 40,
    opacity: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power3.out",
  });
}

async function fetchVehicles() {
  renderSkeletons();
  try {
    const rows = await api("/vehicles");
    vehicles = (Array.isArray(rows) ? rows : []).map(normalizeVehicle);
    if (!vehicles.length) vehicles = fallbackVehicles.map(normalizeVehicle);
  } catch (err) {
    vehicles = fallbackVehicles.map(normalizeVehicle);
    if (err.status === 401) {
      showToast("Login to load DB fleet; showing demo images now", "info");
    } else {
      showToast("Using local demo fleet (API unavailable)", "info");
    }
  }
  setTimeout(() => {
    filteredVehicles = applyQuickFilter([...vehicles]);
    renderVehicleGrid();
  }, 1200);
}

function setActivePill(pill) {
  quickFilter = pill;
  document
    .querySelectorAll(".pill")
    .forEach((b) => b.classList.toggle("active", b.dataset.pill === pill));
  const f = getFilterValues();
  fetchVehiclesWithFilters(f);
}

async function switchView(view) {
  activeView = view;
  el.homeView.classList.toggle("active", view === "home");
  el.bookingsView.classList.toggle("active", view === "bookings");
  el.paymentsView.classList.toggle("active", view === "payments");
  document
    .querySelectorAll(".nav-link")
    .forEach((btn) => btn.classList.remove("active"));
  if (view === "bookings") {
    document
      .querySelector('.nav-link[data-link="bookings"]')
      .classList.add("active");
    await loadBookings();
  }
  if (view === "payments") {
    document
      .querySelector('.nav-link[data-link="payments"]')
      .classList.add("active");
    await loadPayments();
  }
  if (view === "home") window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(id) {
  const overlay = document.getElementById(id);
  const modal = overlay.querySelector(".modal");
  overlay.classList.add("active");
  gsap.fromTo(
    modal,
    { scale: 0.95, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" },
  );
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  const modal = overlay.querySelector(".modal");
  gsap.to(modal, {
    scale: 0.95,
    opacity: 0,
    duration: 0.18,
    onComplete: () => overlay.classList.remove("active"),
  });
}

function dayDiff(start, end) {
  return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
}

function updateBookingBreakdown() {
  if (!currentVehicle) return;
  const s = document.getElementById("bookingStart").value;
  const e = document.getElementById("bookingEnd").value;
  const valid = s && e && new Date(s) < new Date(e);
  const days = valid ? dayDiff(s, e) : 0;
  const subtotal = days * currentVehicle.price_per_day;
  const fee = subtotal * 0.08;
  bookingTotal = subtotal + fee;
  document.getElementById("durationDays").textContent =
    `${days} day${days === 1 ? "" : "s"}`;
  document.getElementById("subtotalAmt").textContent = formatMoney(subtotal);
  document.getElementById("feeAmt").textContent = formatMoney(fee);
  document.getElementById("totalAmt").textContent = formatMoney(bookingTotal);
}

function openBookingModal(vehicleId) {
  const vehicle = vehicles.find((v) => v.id === Number(vehicleId));
  if (!vehicle) return;
  currentVehicle = vehicle;
  document.getElementById("bookingTitle").textContent = vehicle.name;
  document.getElementById("bookingType").textContent = vehicle.type;
  document.getElementById("dailyRate").textContent = formatMoney(
    vehicle.price_per_day,
  );
  document.getElementById("bookingStart").value = "";
  document.getElementById("bookingEnd").value = "";
  document.getElementById("bookingStart").min = todayIso();
  document.getElementById("bookingEnd").min = todayIso();
  el.bookingSuccess.classList.remove("active");
  updateBookingBreakdown();
  openModal("bookingOverlay");
}

function successAnimation(targetEl, message, sub = "") {
  targetEl.innerHTML = `<svg viewBox="0 0 100 100" class="success-svg"><circle cx="50" cy="50" r="36" stroke="#00e676" stroke-width="6" fill="transparent" class="ok-circle"></circle><path d="M30 52 L45 66 L72 37" stroke="#00e676" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" class="ok-path"></path></svg><h4>${message}</h4><p style="color:var(--text2); margin-top:4px;">${sub}</p><div class="confetti-host" style="position:relative; height:20px;"></div>`;
  targetEl.classList.add("active");
  const circle = targetEl.querySelector(".ok-circle");
  const path = targetEl.querySelector(".ok-path");
  circle.style.transformOrigin = "50% 50%";
  path.style.strokeDasharray = 100;
  path.style.strokeDashoffset = 100;
  gsap.fromTo(
    circle,
    { scale: 0 },
    { scale: 1, duration: 0.45, ease: "back.out(2)" },
  );
  gsap.to(path, {
    strokeDashoffset: 0,
    duration: 0.45,
    delay: 0.12,
    ease: "power2.out",
  });
  for (let i = 0; i < 7; i += 1) {
    const c = document.createElement("span");
    c.style.position = "absolute";
    c.style.left = "50%";
    c.style.top = "5px";
    c.style.width = "8px";
    c.style.height = "8px";
    c.style.background = ["#ff3c00", "#ffd166", "#00e5ff", "#00e676"][i % 4];
    c.style.transform = "translate(-50%, -50%)";
    targetEl.querySelector(".confetti-host").appendChild(c);
    gsap.to(c, {
      x: gsap.utils.random(-90, 90),
      y: gsap.utils.random(-40, 50),
      rotation: gsap.utils.random(-240, 240),
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => c.remove(),
    });
  }
}

function openPaymentModal(bookingId, amount) {
  currentBookingId = bookingId;
  bookingTotal = Number(amount || 0);
  selectedMethod = "CARD";
  document
    .querySelectorAll(".method-card")
    .forEach((card) =>
      card.classList.toggle("active", card.dataset.method === "CARD"),
    );
  el.paymentAmount.textContent = formatMoney(bookingTotal);
  el.payNowBtn.textContent = `Pay ${formatMoney(bookingTotal)} →`;
  el.paymentSuccess.classList.remove("active");
  openModal("paymentOverlay");
}

async function loadBookings() {
  el.bookingList.innerHTML = '<div class="empty">Loading bookings...</div>';
  try {
    const res = await api("/bookings");
    const list = res.data || [];
    if (!list.length) {
      el.bookingList.innerHTML =
        '<div class="empty"><span class="emoji">🧳</span><h3>No trips yet</h3><p>Your confirmed bookings will appear here.</p></div>';
      return;
    }
    el.bookingList.innerHTML = list
      .map((b) => {
        const status = String(b.status || "PENDING").toLowerCase();
        const isUnpaidBooking = status === "pending" || status === "confirmed";
        const days = dayDiff(b.start_date, b.end_date);
        const total = Number(
          b.total_price || days * Number(b.price_per_day || 0) * 1.08,
        );
        return `<article class="booking-card"><div class="booking-top"><div><h3 style="font-family:'Bebas Neue',sans-serif;letter-spacing:1px;font-size:30px;">${escapeHtml(b.vehicle_name || "DriveX Vehicle")}</h3><p style="color:var(--text2);">${fmtDate(b.start_date)} - ${fmtDate(b.end_date)}</p></div><span class="status ${status}">${b.status || "PENDING"}</span></div><div><strong>${formatMoney(total)}</strong></div><div class="booking-actions">${isUnpaidBooking ? `<button class="btn btn-accent" data-pay-booking="${b.id}" data-amount="${total}">Pay Now</button><button class="btn" data-cancel-booking="${b.id}">Cancel</button>` : ""}</div></article>`;
      })
      .join("");
  } catch (err) {
    if (
      await handleApiError(err, {
        authRequiredMessage: "Login required to view trips",
      })
    )
      return;
  }
}

async function loadPayments() {
  el.paymentList.innerHTML = '<div class="empty">Loading payments...</div>';
  try {
    const res = await api("/payments");
    const list = res.data || [];
    if (!list.length) {
      el.paymentList.innerHTML =
        '<div class="empty"><span class="emoji">💳</span><h3>No payments yet</h3><p>Completed transactions will be listed here.</p></div>';
      return;
    }
    const rows = list
      .map(
        (p) =>
          `<tr><td>${escapeHtml(p.transaction_id || "-")}</td><td>${escapeHtml(p.vehicle_name || "-")}</td><td>${fmtDate(p.start_date)} - ${fmtDate(p.end_date)}</td><td>${formatMoney(p.amount)}</td><td>${escapeHtml(p.payment_method || "-")}</td><td><span class="status ${String(p.status || "PAID").toLowerCase()}">${p.status || "PAID"}</span></td></tr>`,
      )
      .join("");
    el.paymentList.innerHTML = `<div class="payment-table-wrap"><table><thead><tr><th>Transaction ID</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } catch (err) {
    if (
      await handleApiError(err, {
        authRequiredMessage: "Login required to view payments",
      })
    )
      return;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    currentUser = { email };
    updateNav();
    closeModal("authOverlay");
    showToast("Login successful", "success");
    await fetchVehicles();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const password = document.getElementById("signupPassword").value;
  try {
    const res = await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, password }),
    });
    currentUser = { id: res.user?.id, email: res.user?.email || email };
    updateNav();
    closeModal("authOverlay");
    showToast("Account created successfully", "success");
    await fetchVehicles();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleLogout() {
  try {
    await api("/auth/logout", { method: "POST" });
    currentUser = null;
    updateNav();
    showToast("Logged out", "info");
    await fetchVehicles();
    switchView("home");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function setupAuthTabs() {
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const which = tab.dataset.authTab;
      document
        .querySelectorAll(".auth-tab")
        .forEach((t) => t.classList.toggle("active", t === tab));
      document
        .getElementById("authTabs")
        .style.setProperty("--tab-x", which === "signup" ? "100%" : "0%");
      document
        .getElementById("loginForm")
        .classList.toggle("active", which === "login");
      document
        .getElementById("signupForm")
        .classList.toggle("active", which === "signup");
    });
  });
}

function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);
  const particles = Array.from({ length: 72 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 1.5 + Math.random() * 1.5,
    o: 0.15 + Math.random() * 0.25,
    glow: i < 2,
  }));
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      for (let j = i + 1; j < particles.length; j += 1) {
        const q = particles[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(255,60,0,${0.18 * (1 - d / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.fillStyle = p.glow
        ? "rgba(255,60,0,0.6)"
        : `rgba(255,255,255,${p.o})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener("resize", () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });
}

function initCursor() {
  if (window.innerWidth <= 640 || "ontouchstart" in window) return;
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
  });
  (function loop() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(loop);
  })();
}

function initScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  window.addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = `${p}%`;
  });
}

function bindEvents() {
  document
    .getElementById("browseFleetBtn")
    .addEventListener("click", async () => {
      await switchView("home");
      document
        .getElementById("vehicles")
        .scrollIntoView({ behavior: "smooth" });
    });
  document
    .getElementById("howItWorksBtn")
    .addEventListener("click", async () => {
      await switchView("home");
      document
        .getElementById("features")
        .scrollIntoView({ behavior: "smooth" });
    });
  el.mobileToggle.addEventListener("click", () =>
    el.navLinks.classList.toggle("open"),
  );

  document.querySelectorAll(".nav-link").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const key = btn.dataset.link;
      el.navLinks.classList.remove("open");
      if (key === "fleet") {
        await switchView("home");
        document
          .getElementById("vehicles")
          .scrollIntoView({ behavior: "smooth" });
      } else if (key === "features") {
        await switchView("home");
        document
          .getElementById("features")
          .scrollIntoView({ behavior: "smooth" });
      } else if (key === "bookings") await switchView("bookings");
      else if (key === "payments") await switchView("payments");
    }),
  );

  document.querySelectorAll("[data-footer]").forEach((link) =>
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const key = link.dataset.footer;
      if (key === "fleet") {
        await switchView("home");
        document
          .getElementById("vehicles")
          .scrollIntoView({ behavior: "smooth" });
      } else if (key === "features") {
        await switchView("home");
        document
          .getElementById("features")
          .scrollIntoView({ behavior: "smooth" });
      } else await switchView(key);
    }),
  );

  el.loginBtn.addEventListener("click", () => openModal("authOverlay"));
  el.signupBtn.addEventListener("click", () => {
    openModal("authOverlay");
    document.querySelector('.auth-tab[data-auth-tab="signup"]').click();
  });
  el.logoutBtn.addEventListener("click", handleLogout);

  document
    .querySelectorAll("[data-close]")
    .forEach((btn) =>
      btn.addEventListener("click", () => closeModal(btn.dataset.close)),
    );
  el.authOverlay.addEventListener("click", (e) => {
    if (e.target === el.authOverlay) closeModal("authOverlay");
  });
  el.bookingOverlay.addEventListener("click", (e) => {
    if (e.target === el.bookingOverlay) closeModal("bookingOverlay");
  });
  el.paymentOverlay.addEventListener("click", (e) => {
    if (e.target === el.paymentOverlay) closeModal("paymentOverlay");
  });

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document
    .getElementById("signupForm")
    .addEventListener("submit", handleSignup);

  el.searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = getFilterValues();
    await fetchVehiclesWithFilters(f);
  });

  const syncFleet = async () => {
    if (activeView === "home") {
      await refreshFleetFromCurrentFilters();
    }
  };

  window.addEventListener("focus", syncFleet);
  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden) await syncFleet();
  });
  window.addEventListener("storage", async (e) => {
    if (
      e.key === "drivex_booking_updated" ||
      e.key === "drivex_booking_cancelled"
    ) {
      await syncFleet();
    }
  });

  document
    .querySelectorAll(".pill")
    .forEach((btn) =>
      btn.addEventListener("click", () => setActivePill(btn.dataset.pill)),
    );

  el.vehicleGrid.addEventListener("click", (e) => {
    const likeBtn = e.target.closest("[data-like]");
    if (likeBtn) {
      const id = Number(likeBtn.dataset.like);
      if (likedVehicles.has(id)) likedVehicles.delete(id);
      else likedVehicles.add(id);
      renderVehicleGrid();
      gsap.fromTo(
        `[data-like="${id}"]`,
        { scale: 0.8 },
        { scale: 1, duration: 0.28, ease: "back.out(3)" },
      );
      return;
    }
    const bookBtn = e.target.closest("[data-book]");
    if (bookBtn) openBookingModal(bookBtn.dataset.book);
  });

  document.getElementById("bookingStart").addEventListener("change", () => {
    document.getElementById("bookingEnd").min =
      document.getElementById("bookingStart").value || todayIso();
    updateBookingBreakdown();
  });
  document
    .getElementById("bookingEnd")
    .addEventListener("change", updateBookingBreakdown);

  document
    .getElementById("confirmBookingBtn")
    .addEventListener("click", async () => {
      if (!currentUser) {
        showToast("Please login to continue booking", "info");
        openModal("authOverlay");
        return;
      }
      const start_date = document.getElementById("bookingStart").value;
      const end_date = document.getElementById("bookingEnd").value;
      if (
        !start_date ||
        !end_date ||
        new Date(start_date) >= new Date(end_date)
      ) {
        showToast("Please select a valid date range", "error");
        return;
      }
      try {
        const res = await api("/bookings", {
          method: "POST",
          body: JSON.stringify({
            vehicle_id: currentVehicle.id,
            start_date,
            end_date,
          }),
        });
        const booking = res.booking;
        successAnimation(
          el.bookingSuccess,
          "Booking Confirmed",
          `${currentVehicle.name} is reserved.`,
        );
        showToast("Booking created successfully", "success");
        await refreshFleetFromCurrentFilters();
        await loadBookings();
        localStorage.setItem("drivex_booking_updated", String(Date.now()));
        setTimeout(async () => {
          closeModal("bookingOverlay");
          await switchView("bookings");
          openPaymentModal(
            booking.id,
            bookingTotal || booking.total_price || 0,
          );
        }, 2000);
      } catch (err) {
        await handleApiError(err, {
          authRequiredMessage: "Login required for booking",
        });
      }
    });

  document.getElementById("methodGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".method-card");
    if (!card) return;
    selectedMethod = card.dataset.method;
    document
      .querySelectorAll(".method-card")
      .forEach((c) => c.classList.toggle("active", c === card));
  });

  el.payNowBtn.addEventListener("click", async () => {
    if (!currentUser) {
      openModal("authOverlay");
      return;
    }
    if (!currentBookingId) {
      showToast("No booking selected for payment", "error");
      return;
    }
    const oldText = el.payNowBtn.innerHTML;
    el.payNowBtn.disabled = true;
    el.payNowBtn.innerHTML = '<span class="spinner"></span>Processing...';
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await api("/payments", {
        method: "POST",
        body: JSON.stringify({
          booking_id: currentBookingId,
          payment_method: selectedMethod,
          amount: bookingTotal,
        }),
      });
      successAnimation(
        el.paymentSuccess,
        "Payment Successful",
        `Transaction: ${res.transaction_id || "TXN"}`,
      );
      showToast("Payment completed", "success");
      setTimeout(() => {
        closeModal("paymentOverlay");
        if (activeView === "bookings") loadBookings();
        if (activeView === "payments") loadPayments();
      }, 1800);
    } catch (err) {
      await handleApiError(err, {
        authRequiredMessage: "Login required for payment",
      });
    } finally {
      el.payNowBtn.disabled = false;
      el.payNowBtn.innerHTML = oldText;
    }
  });

  el.bookingList.addEventListener("click", async (e) => {
    const payBtn = e.target.closest("[data-pay-booking]");
    if (payBtn) {
      openPaymentModal(
        payBtn.dataset.payBooking,
        Number(payBtn.dataset.amount || 0),
      );
      return;
    }
    const cancelBtn = e.target.closest("[data-cancel-booking]");
    if (cancelBtn) {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this booking?",
      );
      if (!confirmed) return;
      try {
        await api(`/bookings/${cancelBtn.dataset.cancelBooking}`, {
          method: "DELETE",
        });
        showToast("Booking cancelled", "info");
        await loadBookings();
        await refreshFleetFromCurrentFilters();
        localStorage.setItem("drivex_booking_cancelled", String(Date.now()));
      } catch (err) {
        await handleApiError(err, {
          authRequiredMessage: "Login required to cancel booking",
        });
      }
    }
  });
}

async function init() {
  splitHeroChars();
  animateHero();
  initMarquee();
  initScrollReveals();
  initCounters();
  initParticles();
  initCursor();
  initScrollProgress();
  initPriceSlider();
  setupAuthTabs();
  bindEvents();
  updateNav();
  await fetchVehicles();
}

init();
