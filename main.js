const SIGNS = [
  { glyph: "♈", name: "Aries" },
  { glyph: "♉", name: "Taurus" },
  { glyph: "♊", name: "Gemini" },
  { glyph: "♋", name: "Cancer" },
  { glyph: "♌", name: "Leo" },
  { glyph: "♍", name: "Virgo" },
  { glyph: "♎", name: "Libra" },
  { glyph: "♏", name: "Scorpio" },
  { glyph: "♐", name: "Sagittarius" },
  { glyph: "♑", name: "Capricorn" },
  { glyph: "♒", name: "Aquarius" },
  { glyph: "♓", name: "Pisces" },
];

const BODIES = [
  { id: "sun", name: "Sun", symbol: "☉", className: "sun" },
  { id: "moon", name: "Moon", symbol: "☽" },
  { id: "mercury", name: "Mercury", symbol: "☿" },
  { id: "venus", name: "Venus", symbol: "♀" },
  { id: "mars", name: "Mars", symbol: "♂" },
  { id: "jupiter", name: "Jupiter", symbol: "♃" },
  { id: "saturn", name: "Saturn", symbol: "♄" },
  { id: "uranus", name: "Uranus", symbol: "♅" },
  { id: "neptune", name: "Neptune", symbol: "♆" },
];

function glyphText(symbol) {
  // Force text presentation for symbols that may render as emoji by default.
  return `${symbol}\uFE0E`;
}

const zodiacBandEl = document.getElementById("zodiac-band");
const planetLayerEl = document.getElementById("planet-layer");
const legendEl = document.getElementById("legend");
const timestampEl = document.getElementById("timestamp");
const timeButtons = document.querySelectorAll(".time-btn");

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function sinDeg(deg) {
  return Math.sin(toRad(deg));
}

function cosDeg(deg) {
  return Math.cos(toRad(deg));
}

function normalizeAngle(angle) {
  const a = angle % 360;
  return a < 0 ? a + 360 : a;
}

function signedDelta(target, origin) {
  let d = normalizeAngle(target - origin);
  if (d > 180) d -= 360;
  return d;
}

function solveKepler(Mrad, e) {
  let E = Mrad + e * Math.sin(Mrad) * (1 + e * Math.cos(Mrad));
  for (let i = 0; i < 10; i += 1) {
    const dE = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}

function orbitalElements(planet, d) {
  switch (planet) {
    case "mercury":
      return {
        N: 48.3313 + 3.24587e-5 * d,
        i: 7.0047 + 5.0e-8 * d,
        w: 29.1241 + 1.01444e-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59e-10 * d,
        M: 168.6562 + 4.0923344368 * d,
      };
    case "venus":
      return {
        N: 76.6799 + 2.4659e-5 * d,
        i: 3.3946 + 2.75e-8 * d,
        w: 54.891 + 1.38374e-5 * d,
        a: 0.72333,
        e: 0.006773 - 1.302e-9 * d,
        M: 48.0052 + 1.6021302244 * d,
      };
    case "earth":
      return {
        N: 0,
        i: 0,
        w: 282.9404 + 4.70935e-5 * d,
        a: 1,
        e: 0.016709 - 1.151e-9 * d,
        M: 356.047 + 0.9856002585 * d,
      };
    case "mars":
      return {
        N: 49.5574 + 2.11081e-5 * d,
        i: 1.8497 - 1.78e-8 * d,
        w: 286.5016 + 2.92961e-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516e-9 * d,
        M: 18.6021 + 0.5240207766 * d,
      };
    case "jupiter":
      return {
        N: 100.4542 + 2.76854e-5 * d,
        i: 1.303 - 1.557e-7 * d,
        w: 273.8777 + 1.64505e-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469e-9 * d,
        M: 19.895 + 0.0830853001 * d,
      };
    case "saturn":
      return {
        N: 113.6634 + 2.3898e-5 * d,
        i: 2.4886 - 1.081e-7 * d,
        w: 339.3939 + 2.97661e-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499e-9 * d,
        M: 316.967 + 0.0334442282 * d,
      };
    case "uranus":
      return {
        N: 74.0005 + 1.3978e-5 * d,
        i: 0.7733 + 1.9e-8 * d,
        w: 96.6612 + 3.0565e-5 * d,
        a: 19.18171 - 1.55e-8 * d,
        e: 0.047318 + 7.45e-9 * d,
        M: 142.5905 + 0.011725806 * d,
      };
    case "neptune":
      return {
        N: 131.7806 + 3.0173e-5 * d,
        i: 1.77 - 2.55e-7 * d,
        w: 272.8461 - 6.027e-6 * d,
        a: 30.05826 + 3.313e-8 * d,
        e: 0.008606 + 2.15e-9 * d,
        M: 260.2471 + 0.005995147 * d,
      };
    default:
      throw new Error(`Unknown planet: ${planet}`);
  }
}

function rectangularFromElements({ N, i, w, a, e, M }) {
  const Mrad = toRad(normalizeAngle(M));
  const E = solveKepler(Mrad, e);

  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));

  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const Nrad = toRad(N);
  const irad = toRad(i);
  const wrad = toRad(w);
  const vw = v + wrad;

  const xh =
    r * (Math.cos(Nrad) * Math.cos(vw) - Math.sin(Nrad) * Math.sin(vw) * Math.cos(irad));
  const yh =
    r * (Math.sin(Nrad) * Math.cos(vw) + Math.cos(Nrad) * Math.sin(vw) * Math.cos(irad));
  const zh = r * Math.sin(vw) * Math.sin(irad);

  return { x: xh, y: yh, z: zh };
}

function sphericalFromRectangular({ x, y, z }) {
  const lon = normalizeAngle(toDeg(Math.atan2(y, x)));
  const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
  const r = Math.sqrt(x * x + y * y + z * z);
  return { lon, lat, r };
}

function rectangularFromSpherical({ lon, lat, r }) {
  const clat = cosDeg(lat);
  return {
    x: r * clat * cosDeg(lon),
    y: r * clat * sinDeg(lon),
    z: r * sinDeg(lat),
  };
}

function heliocentricState(planet, d) {
  const elements = orbitalElements(planet, d);
  const rect = rectangularFromElements(elements);
  const sph = sphericalFromRectangular(rect);
  return {
    ...rect,
    ...sph,
    M: normalizeAngle(elements.M),
  };
}

function moonGeocentricLongitude(d, sunMeanAnomaly, sunTrueLongitude) {
  const N = 125.1228 - 0.0529538083 * d;
  const i = 5.1454;
  const w = 318.0634 + 0.1643573223 * d;
  const a = 60.2666;
  const e = 0.0549;
  const M = 115.3654 + 13.0649929509 * d;

  const E = solveKepler(toRad(normalizeAngle(M)), e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const Nrad = toRad(N);
  const irad = toRad(i);
  const wrad = toRad(w);
  const vw = v + wrad;
  const xh =
    r * (Math.cos(Nrad) * Math.cos(vw) - Math.sin(Nrad) * Math.sin(vw) * Math.cos(irad));
  const yh =
    r * (Math.sin(Nrad) * Math.cos(vw) + Math.cos(Nrad) * Math.sin(vw) * Math.cos(irad));

  let lon = normalizeAngle(toDeg(Math.atan2(yh, xh)));
  let lat = toDeg(Math.atan2(r * Math.sin(vw) * Math.sin(irad), Math.sqrt(xh * xh + yh * yh)));

  const Mm = normalizeAngle(M);
  const Ms = normalizeAngle(sunMeanAnomaly);
  const Lm = normalizeAngle(N + w + M);
  const Ls = normalizeAngle(sunTrueLongitude);
  const D = normalizeAngle(Lm - Ls);
  const F = normalizeAngle(Lm - N);

  lon +=
    -1.274 * sinDeg(Mm - 2 * D) +
    0.658 * sinDeg(2 * D) -
    0.186 * sinDeg(Ms) -
    0.059 * sinDeg(2 * Mm - 2 * D) -
    0.057 * sinDeg(Mm - 2 * D + Ms) +
    0.053 * sinDeg(Mm + 2 * D) +
    0.046 * sinDeg(2 * D - Ms) +
    0.041 * sinDeg(Mm - Ms) -
    0.035 * sinDeg(D) -
    0.031 * sinDeg(Mm + Ms) -
    0.015 * sinDeg(2 * F - 2 * D) +
    0.011 * sinDeg(Mm - 4 * D);

  lat +=
    -0.173 * sinDeg(F - 2 * D) -
    0.055 * sinDeg(Mm - F - 2 * D) -
    0.046 * sinDeg(Mm + F - 2 * D) +
    0.033 * sinDeg(F + 2 * D) +
    0.017 * sinDeg(2 * Mm + F);

  return normalizeAngle(lon);
}

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function daysSinceJ2000(date) {
  return julianDay(date) - 2451543.5;
}

function geocentricLongitudes(date = new Date()) {
  const A = globalThis.Astronomy;
  if (!A) {
    throw new Error("Astronomy Engine not loaded. Ensure astronomy.browser.min.js is included.");
  }

  const sun = normalizeAngle(A.SunPosition(date).elon);
  const moon = normalizeAngle(A.EclipticGeoMoon(date).lon);

  const bodyMap = {
    mercury: A.Body.Mercury,
    venus: A.Body.Venus,
    mars: A.Body.Mars,
    jupiter: A.Body.Jupiter,
    saturn: A.Body.Saturn,
    uranus: A.Body.Uranus,
    neptune: A.Body.Neptune,
  };

  const planetLons = {};
  Object.entries(bodyMap).forEach(([id, body]) => {
    const geoVec = A.GeoVector(body, date, true);
    const ecl = A.Ecliptic(geoVec);
    planetLons[id] = normalizeAngle(ecl.elon);
  });

  return { sun, moon, ...planetLons };
}

function zodiacSignFromLongitude(lon) {
  const index = Math.floor(normalizeAngle(lon) / 30) % 12;
  return SIGNS[index];
}

function relToX(rel) {
  return ((rel + 180) / 360) * 100;
}

function motionIcon(speed) {
  if (Math.abs(speed) < 0.005) return "•";
  return speed > 0 ? ">" : "<";
}

function layoutPlanetLabels(markers) {
  const sorted = [...markers].sort((a, b) => a.xPct - b.xPct);
  const lanes = [];
  const maxLanes = 3;
  const minGapPct = 8;

  sorted.forEach((marker) => {
    if (!marker.labelEl) return;
    let lane = -1;
    for (let i = 0; i < maxLanes; i += 1) {
      const lastX = lanes[i];
      if (lastX === undefined || marker.xPct - lastX >= minGapPct) {
        lane = i;
        break;
      }
    }

    if (lane === -1) {
      marker.labelEl.style.display = "none";
      return;
    }

    lanes[lane] = marker.xPct;
    marker.labelEl.style.display = "";
    marker.labelEl.style.top = `${30 + lane * 14}px`;
  });
}

function motionSnapshot(now, deltaHours = 6) {
  const ms = deltaHours * 3600 * 1000;
  const next = new Date(now.getTime() + ms);
  const nowState = geocentricLongitudes(now);
  const nextState = geocentricLongitudes(next);
  const days = deltaHours / 24;

  const details = {};
  BODIES.forEach((body) => {
    const id = body.id;
    const nowLon = nowState[id];
    const nextLon = nextState[id];
    const speed = signedDelta(nextLon, nowLon) / days;
    const directionIcon = motionIcon(speed);

    const relNow = id === "sun" ? 0 : signedDelta(nowLon, nowState.sun);
    const relNext = id === "sun" ? 0 : signedDelta(nextLon, nextState.sun);
    const relativeSpeed = signedDelta(relNext, relNow) / days;
    const axisDriftIcon = motionIcon(relativeSpeed);

    details[id] = { speed, directionIcon, relativeSpeed, axisDriftIcon };
  });

  return { nowState, details };
}

function draw(state, motionDetails) {
  const sunLon = state.sun;
  const markers = [];

  zodiacBandEl.innerHTML = "";
  planetLayerEl.innerHTML = "";
  legendEl.innerHTML = "";

  for (let k = 0; k < 12; k += 1) {
    const boundaryLon = k * 30;
    const relBoundary = signedDelta(boundaryLon, sunLon);
    const tick = document.createElement("div");
    tick.className = "zodiac-tick";
    tick.style.left = `${relToX(relBoundary)}%`;
    zodiacBandEl.appendChild(tick);

    const signCenter = boundaryLon + 15;
    const relCenter = signedDelta(signCenter, sunLon);
    const label = document.createElement("div");
    label.className = "zodiac-label";
    label.style.left = `${relToX(relCenter)}%`;
    label.textContent = glyphText(SIGNS[k].glyph);
    zodiacBandEl.appendChild(label);
  }

  BODIES.forEach((body) => {
    const lon = state[body.id];
    const rel = body.id === "sun" ? 0 : signedDelta(lon, sunLon);

    const planetEl = document.createElement("div");
    planetEl.className = `planet ${body.className ? `planet--${body.className}` : ""}`;
    planetEl.style.left = `${relToX(rel)}%`;
    planetEl.title = `${body.name} (${motionDetails[body.id].directionIcon})`;

    const node = document.createElement("div");
    node.className = "planet__node";
    node.textContent = body.id === "sun" ? "" : glyphText(body.symbol);

    let txt = null;
    if (body.id !== "sun") {
      txt = document.createElement("div");
      txt.className = "planet__label";
      txt.textContent = body.name;
    }

    planetEl.append(node);
    if (txt) {
      planetEl.appendChild(txt);
    }
    planetLayerEl.appendChild(planetEl);
    markers.push({ xPct: relToX(rel), labelEl: txt });

    const sign = zodiacSignFromLongitude(lon);
    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";
    const motion = motionDetails[body.id];
    legendItem.innerHTML = `
      <div class="legend-left">
        <span class="legend-symbol">${glyphText(body.symbol)}</span>
        <span>${body.name}</span>
      </div>
      <div class="legend-value">${glyphText(sign.glyph)} ${sign.name} ${lon.toFixed(1)}° ${motion.directionIcon}</div>
    `;
    legendEl.appendChild(legendItem);
  });

  layoutPlanetLabels(markers);
}

let viewDate = new Date();

function shiftViewDate(amount, unit) {
  const next = new Date(viewDate);
  if (unit === "day") next.setUTCDate(next.getUTCDate() + amount);
  if (unit === "week") next.setUTCDate(next.getUTCDate() + amount * 7);
  if (unit === "month") next.setUTCMonth(next.getUTCMonth() + amount);
  if (unit === "year") next.setUTCFullYear(next.getUTCFullYear() + amount);
  viewDate = next;
}

function render() {
  const snapshot = motionSnapshot(viewDate);
  draw(snapshot.nowState, snapshot.details);
  const iso = viewDate.toISOString().replace("T", " ");
  timestampEl.textContent = `UTC ${iso.slice(0, 16)}`;
}

timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const step = button.dataset.step || "";
    if (step === "now") {
      viewDate = new Date();
      render();
      return;
    }
    const match = step.match(/^([+-]?\d+)-(day|week|month|year)$/);
    if (!match) return;
    const amount = Number(match[1]);
    const unit = match[2];
    shiftViewDate(amount, unit);
    render();
  });
});

render();
setInterval(() => {
  viewDate = new Date(viewDate.getTime() + 1000);
  render();
}, 1000);
