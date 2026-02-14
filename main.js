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
const timestampEl = document.getElementById("timestamp");
const timeButtons = document.querySelectorAll(".time-btn");
const trendSvgEl = document.getElementById("trend-svg");
const starfieldEl = document.getElementById("starfield");
const chartWaveEl = document.getElementById("chart-wave");
const timeControlsEl = document.getElementById("time-controls");
const optionsToggleEl = document.getElementById("options-toggle");
const optionsPanelEl = document.getElementById("options-panel");
const optionInputs = document.querySelectorAll("[data-option]");
const centerSignSelectEl = document.getElementById("opt-center-sign");

const TREND_COLORS = {
  sun: "#ffd98d",
  moon: "#d6deff",
  mercury: "#c8f5ff",
  venus: "#ffd6ea",
  mars: "#ffb6a2",
  jupiter: "#f9d7b1",
  saturn: "#ffe8a7",
  uranus: "#acf3ff",
  neptune: "#b7b7ff",
};

const TREND_WINDOW_DAYS = 30;
const TREND_STEP_HOURS = 12;
const DEFAULT_VIEW_OPTIONS = {
  stars: true,
  labels: true,
  drift: true,
  flip: false,
  lock: false,
  centerSign: 0,
  travel: true,
  showTime: true,
};

const SIGN_NAME_TO_INDEX = new Map(
  SIGNS.map((sign, index) => [sign.name.toLowerCase(), index]),
);

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

function geocentricDepthContext(date = new Date()) {
  const A = globalThis.Astronomy;
  if (!A) {
    throw new Error("Astronomy Engine not loaded. Ensure astronomy.browser.min.js is included.");
  }

  const bodyMap = {
    sun: A.Body.Sun,
    moon: A.Body.Moon,
    mercury: A.Body.Mercury,
    venus: A.Body.Venus,
    mars: A.Body.Mars,
    jupiter: A.Body.Jupiter,
    saturn: A.Body.Saturn,
    uranus: A.Body.Uranus,
    neptune: A.Body.Neptune,
  };

  const distances = {};
  Object.entries(bodyMap).forEach(([id, body]) => {
    const v = A.GeoVector(body, date, true);
    distances[id] = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  });

  const moonLat = A.EclipticGeoMoon(date).lat;
  return { distances, moonLat };
}

function zodiacSignFromLongitude(lon) {
  const index = Math.floor(normalizeAngle(lon) / 30) % 12;
  return SIGNS[index];
}

function normalizeSignIndex(index) {
  if (!Number.isFinite(index)) {
    return DEFAULT_VIEW_OPTIONS.centerSign;
  }
  return ((Math.trunc(index) % 12) + 12) % 12;
}

function centerSignLongitude(centerSignIndex) {
  return normalizeAngle(normalizeSignIndex(centerSignIndex) * 30 + 15);
}

function referenceLongitudeForState(state, options) {
  if (options.lock) {
    return centerSignLongitude(options.centerSign);
  }
  return state.sun;
}

function relToX(rel) {
  return ((rel + 180) / 360) * 100;
}

function relToY(rel) {
  return ((rel + 180) / 360) * 100;
}

function motionIcon(speed) {
  if (Math.abs(speed) < 0.005) return "•";
  return speed > 0 ? ">" : "<";
}

function layoutPlanetLabelsHorizontal(markers) {
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
    marker.labelEl.style.left = "50%";
    marker.labelEl.style.transform = "translateX(-50%)";
    marker.labelEl.style.top = `${36 + lane * 14}px`;
  });
}

function layoutPlanetLabelsVertical(markers) {
  const sorted = [...markers].sort((a, b) => a.yPct - b.yPct);
  const lanes = [];
  const maxLanes = 3;
  const minGapPct = 6.5;

  sorted.forEach((marker) => {
    if (!marker.labelEl) return;
    let lane = -1;
    for (let i = 0; i < maxLanes; i += 1) {
      const lastY = lanes[i];
      if (lastY === undefined || marker.yPct - lastY >= minGapPct) {
        lane = i;
        break;
      }
    }

    if (lane === -1) {
      marker.labelEl.style.display = "none";
      return;
    }

    lanes[lane] = marker.yPct;
    marker.labelEl.style.display = "";
    marker.labelEl.style.top = "50%";
    marker.labelEl.style.left = `${42 + lane * 64}px`;
    marker.labelEl.style.transform = "translateY(-50%)";
  });
}

function layoutPlanetLabels(markers, flipped) {
  if (flipped) {
    layoutPlanetLabelsVertical(markers);
  } else {
    layoutPlanetLabelsHorizontal(markers);
  }
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

let trendCache = { key: "", data: null };

function buildTrendData(baseDate, options) {
  const hourKey = Math.floor(baseDate.getTime() / 3600000);
  const centerSign = normalizeSignIndex(options.centerSign);
  const key = `${hourKey}:${TREND_WINDOW_DAYS}:${TREND_STEP_HOURS}:${options.lock ? 1 : 0}:${centerSign}`;
  if (trendCache.key === key && trendCache.data) {
    return trendCache.data;
  }

  const stepMs = TREND_STEP_HOURS * 3600 * 1000;
  const halfWindowMs = TREND_WINDOW_DAYS * 86400000;
  const sampleCount = Math.floor((halfWindowMs * 2) / stepMs) + 1;
  const centerIndex = Math.floor(sampleCount / 2);

  const series = {};
  BODIES.forEach((body) => {
    series[body.id] = [];
  });

  const locked = options.lock;
  const lockedReferenceLon = centerSignLongitude(centerSign);

  for (let i = 0; i < sampleCount; i += 1) {
    const dt = new Date(baseDate.getTime() + (i - centerIndex) * stepMs);
    const state = geocentricLongitudes(dt);
    const referenceLon = locked ? lockedReferenceLon : state.sun;
    BODIES.forEach((body) => {
      const rel = signedDelta(state[body.id], referenceLon);
      series[body.id].push(rel);
    });
  }

  const result = { series, sampleCount, centerIndex };
  trendCache = { key, data: result };
  return result;
}

function renderTrend(baseDate, currentState, options) {
  if (!trendSvgEl) return;

  const { series, sampleCount, centerIndex } = buildTrendData(baseDate, options);
  const width = 1200;
  const height = 620;
  const waveSpanPx = 132;
  const waveFromRel = (rel) => Math.sin(toRad(rel)) * 100;
  const flipped = options.flip;
  const referenceNow = referenceLongitudeForState(currentState, options);
  const relNowForBody = (bodyId) => signedDelta(currentState[bodyId], referenceNow);

  if (flipped) {
    const padX = 16;
    const xAt = (i) => padX + (i / (sampleCount - 1)) * (width - padX * 2);
    const yAtRel = (rel) => ((rel + 180) / 360) * height;
    const pathFor = (bodyId, values) => {
      const relNow = relNowForBody(bodyId);
      const anchorY = yAtRel(relNow);
      const anchorWave = waveFromRel(relNow);
      return values
        .map((rel, i) => {
          const waveY = anchorY - ((waveFromRel(rel) - anchorWave) / 100) * waveSpanPx;
          return `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)} ${waveY.toFixed(2)}`;
        })
        .join(" ");
    };

    const centerX = xAt(centerIndex);
    const axisPath = `M${centerX.toFixed(2)} 0 L${centerX.toFixed(2)} ${height}`;
    const centerPath = `M${padX} ${(height / 2).toFixed(2)} L${(width - padX).toFixed(2)} ${(height / 2).toFixed(2)}`;

    const bodyPaths = BODIES.map((body) => {
      const stroke = TREND_COLORS[body.id] || "#ffffff";
      const lineOpacity = body.id === "sun" ? 0.42 : 0.3;
      const widthPx = body.id === "sun" ? 2.2 : body.id === "moon" ? 2 : 1.6;
      return `<path d="${pathFor(body.id, series[body.id])}" fill="none" stroke="${stroke}" stroke-width="${widthPx}" stroke-linecap="round" stroke-opacity="${lineOpacity}"/>`;
    }).join("");

    const currentDots = BODIES.map((body) => {
      const relNow = relNowForBody(body.id);
      return `<circle cx="${centerX.toFixed(2)}" cy="${yAtRel(relNow).toFixed(2)}" r="${body.id === "sun" ? 3.8 : 2.8}" fill="${TREND_COLORS[body.id] || "#fff"}" fill-opacity="0.75"/>`;
    }).join("");

    trendSvgEl.innerHTML = `
      <path d="${axisPath}" stroke="rgba(240,242,247,0.22)" stroke-width="1" fill="none"/>
      <path d="${centerPath}" stroke="rgba(240,242,247,0.1)" stroke-width="1" fill="none"/>
      ${bodyPaths}
      ${currentDots}
    `;
  } else {
    const padY = 16;
    const yAt = (i) => padY + (i / (sampleCount - 1)) * (height - padY * 2);
    const xAtRel = (rel) => ((rel + 180) / 360) * width;
    const pathFor = (bodyId, values) => {
      const relNow = relNowForBody(bodyId);
      const anchorX = xAtRel(relNow);
      const anchorWave = waveFromRel(relNow);
      return values
        .map((rel, i) => {
          const waveX = anchorX + ((waveFromRel(rel) - anchorWave) / 100) * waveSpanPx;
          return `${i === 0 ? "M" : "L"}${waveX.toFixed(2)} ${yAt(i).toFixed(2)}`;
        })
        .join(" ");
    };

    const centerY = yAt(centerIndex);
    const axisPath = `M0 ${centerY.toFixed(2)} L${width} ${centerY.toFixed(2)}`;
    const centerPath = `M600 ${padY} L600 ${height - padY}`;

    const bodyPaths = BODIES.map((body) => {
      const stroke = TREND_COLORS[body.id] || "#ffffff";
      const lineOpacity = body.id === "sun" ? 0.42 : 0.3;
      const widthPx = body.id === "sun" ? 2.2 : body.id === "moon" ? 2 : 1.6;
      return `<path d="${pathFor(body.id, series[body.id])}" fill="none" stroke="${stroke}" stroke-width="${widthPx}" stroke-linecap="round" stroke-opacity="${lineOpacity}"/>`;
    }).join("");

    const currentDots = BODIES.map((body) => {
      const relNow = relNowForBody(body.id);
      return `<circle cx="${xAtRel(relNow).toFixed(2)}" cy="${centerY.toFixed(2)}" r="${body.id === "sun" ? 3.8 : 2.8}" fill="${TREND_COLORS[body.id] || "#fff"}" fill-opacity="0.75"/>`;
    }).join("");

    trendSvgEl.innerHTML = `
      <path d="${axisPath}" stroke="rgba(240,242,247,0.22)" stroke-width="1" fill="none"/>
      <path d="${centerPath}" stroke="rgba(240,242,247,0.1)" stroke-width="1" fill="none"/>
      ${bodyPaths}
      ${currentDots}
    `;
  }
}

function draw(state, motionDetails, depthContext) {
  const sunLon = state.sun;
  const referenceLon = referenceLongitudeForState(state, viewOptions);
  const markers = [];
  const flipped = viewOptions.flip;

  zodiacBandEl.innerHTML = "";
  planetLayerEl.innerHTML = "";
  const sunDist = depthContext?.distances?.sun ?? 1;
  const moonLat = depthContext?.moonLat ?? 90;
  const chartWidth = Math.max(planetLayerEl.clientWidth, 1);
  const mobile = globalThis.matchMedia?.("(max-width: 640px)").matches ?? false;
  const sunDiameterPx = mobile ? 49 : 55;
  const planetDiameterPx = mobile ? 29 : 31;
  const overlapThresholdDeg = Math.max(
    7,
    (((sunDiameterPx + planetDiameterPx) * 0.5) / chartWidth) * 360 + 0.9,
  );

  for (let k = 0; k < 12; k += 1) {
    const boundaryLon = k * 30;
    const relBoundary = signedDelta(boundaryLon, referenceLon);
    const tick = document.createElement("div");
    if (flipped) {
      tick.className = "zodiac-tick zodiac-tick--h";
      tick.style.top = `${relToY(relBoundary)}%`;
    } else {
      tick.className = "zodiac-tick";
      tick.style.left = `${relToX(relBoundary)}%`;
    }
    zodiacBandEl.appendChild(tick);

    const signCenter = boundaryLon + 15;
    const relCenter = signedDelta(signCenter, referenceLon);
    const label = document.createElement("div");
    if (flipped) {
      label.className = "zodiac-label zodiac-label--v";
      label.style.top = `${relToY(relCenter)}%`;
    } else {
      label.className = "zodiac-label";
      label.style.left = `${relToX(relCenter)}%`;
    }
    label.textContent = glyphText(SIGNS[k].glyph);
    zodiacBandEl.appendChild(label);
  }

  BODIES.forEach((body) => {
    const lon = state[body.id];
    const rel = signedDelta(lon, referenceLon);

    const planetEl = document.createElement("div");
    planetEl.className = `planet ${body.className ? `planet--${body.className}` : ""}`;
    if (flipped) {
      planetEl.style.left = "50%";
      planetEl.style.top = `${relToY(rel)}%`;
    } else {
      planetEl.style.left = `${relToX(rel)}%`;
      planetEl.style.top = "50%";
    }
    planetEl.title = `${body.name} (${motionDetails[body.id].directionIcon})`;

    if (body.id === "sun") {
      planetEl.style.zIndex = "12";
    } else {
      let frontOfSun = false;
      const nearSun = Math.abs(signedDelta(lon, sunLon)) <= overlapThresholdDeg;
      if (nearSun) {
        const dist = depthContext?.distances?.[body.id];
        const isCloserThanSun = Number.isFinite(dist) && dist < sunDist;
        if (body.id === "mercury" || body.id === "venus") {
          frontOfSun = isCloserThanSun;
        } else if (body.id === "moon") {
          // Keep Moon in front only near eclipse-like alignment, otherwise behind.
          frontOfSun = isCloserThanSun && Math.abs(moonLat) < 0.9;
        }
      }
      planetEl.style.zIndex = frontOfSun ? "14" : "9";
    }

    const node = document.createElement("div");
    node.className = "planet__node";
    if (body.id !== "sun") {
      const glyph = document.createElement("span");
      glyph.className = "planet__glyph";
      glyph.textContent = glyphText(body.symbol);
      node.appendChild(glyph);
    }
    const planetColor = TREND_COLORS[body.id] || "#f0f2f7";
    node.style.setProperty("--planet-color", planetColor);

    let txt = null;
    if (body.id !== "sun" && viewOptions.labels) {
      txt = document.createElement("div");
      txt.className = "planet__label";
      txt.textContent = body.name;
    }

    planetEl.append(node);
    if (txt) {
      planetEl.appendChild(txt);
    }
    planetLayerEl.appendChild(planetEl);
    markers.push({ xPct: relToX(rel), yPct: relToY(rel), labelEl: txt });
  });

  layoutPlanetLabels(markers, flipped);
}

function parseViewDateFromParams(params) {
  const raw = params.get("time");
  if (!raw) return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const fromEpoch = new Date(numeric);
    if (!Number.isNaN(fromEpoch.getTime())) return fromEpoch;
  }
  return null;
}

function parseBoolParam(params, key, fallback) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  return fallback;
}

function parseCenterSignParam(params, key, fallbackIndex) {
  const raw = params.get(key);
  if (!raw) return fallbackIndex;

  const parsedIndex = Number(raw);
  if (Number.isInteger(parsedIndex) && parsedIndex >= 0 && parsedIndex < SIGNS.length) {
    return parsedIndex;
  }

  const mappedIndex = SIGN_NAME_TO_INDEX.get(raw.trim().toLowerCase());
  if (mappedIndex !== undefined) {
    return mappedIndex;
  }
  return fallbackIndex;
}

function parseViewOptionsFromParams(params) {
  return {
    stars: parseBoolParam(params, "stars", DEFAULT_VIEW_OPTIONS.stars),
    labels: parseBoolParam(params, "labels", DEFAULT_VIEW_OPTIONS.labels),
    drift: parseBoolParam(params, "drift", DEFAULT_VIEW_OPTIONS.drift),
    flip: parseBoolParam(params, "flip", DEFAULT_VIEW_OPTIONS.flip),
    lock: parseBoolParam(params, "lock", DEFAULT_VIEW_OPTIONS.lock),
    centerSign: parseCenterSignParam(params, "center", DEFAULT_VIEW_OPTIONS.centerSign),
    travel: parseBoolParam(params, "travel", DEFAULT_VIEW_OPTIONS.travel),
    showTime: parseBoolParam(params, "showtime", DEFAULT_VIEW_OPTIONS.showTime),
  };
}

function readUrlState() {
  const params = new URLSearchParams(globalThis.location.search);
  return {
    date: parseViewDateFromParams(params),
    options: parseViewOptionsFromParams(params),
  };
}

function syncStateToUrl(date, options) {
  const url = new URL(globalThis.location.href);
  const centerSign = SIGNS[normalizeSignIndex(options.centerSign)]?.name.toLowerCase() || "aries";
  const desired = {
    time: date.toISOString(),
    stars: options.stars ? "1" : "0",
    labels: options.labels ? "1" : "0",
    drift: options.drift ? "1" : "0",
    flip: options.flip ? "1" : "0",
    lock: options.lock ? "1" : "0",
    center: centerSign,
    travel: options.travel ? "1" : "0",
    showtime: options.showTime ? "1" : "0",
  };

  let changed = false;
  Object.entries(desired).forEach(([key, value]) => {
    if (url.searchParams.get(key) !== value) {
      url.searchParams.set(key, value);
      changed = true;
    }
  });

  if (changed) {
    globalThis.history.replaceState(null, "", url);
  }
}

const initialState = readUrlState();
let viewDate = initialState.date || new Date();
let viewOptions = initialState.options;

const starfieldState = {
  canvas: starfieldEl,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  stars: [],
};

function setOptionsPanelOpen(open) {
  if (!optionsPanelEl || !optionsToggleEl) return;
  optionsPanelEl.hidden = !open;
  optionsToggleEl.setAttribute("aria-expanded", open ? "true" : "false");
}

function syncOptionsUi() {
  optionInputs.forEach((input) => {
    const key = input.dataset.option;
    if (!key || !(key in DEFAULT_VIEW_OPTIONS)) return;
    if (typeof DEFAULT_VIEW_OPTIONS[key] !== "boolean") return;
    input.checked = Boolean(viewOptions[key]);
  });
  if (centerSignSelectEl) {
    centerSignSelectEl.value = String(normalizeSignIndex(viewOptions.centerSign));
    centerSignSelectEl.disabled = !viewOptions.lock;
  }
}

function applyDisplayOptions() {
  if (starfieldEl) {
    starfieldEl.style.display = viewOptions.stars ? "block" : "none";
  }
  if (chartWaveEl) {
    chartWaveEl.style.display = viewOptions.drift ? "block" : "none";
  }
  if (timeControlsEl) {
    timeControlsEl.style.display = viewOptions.travel ? "" : "none";
  }
  if (timestampEl) {
    timestampEl.style.display = viewOptions.showTime ? "" : "none";
  }
  if (globalThis.document?.body) {
    globalThis.document.body.classList.toggle("flip-mode", viewOptions.flip);
    globalThis.document.body.classList.toggle("controls-right", !viewOptions.flip);
    globalThis.document.body.classList.toggle("zodiac-locked", viewOptions.lock);
  }
  if (centerSignSelectEl) {
    centerSignSelectEl.disabled = !viewOptions.lock;
  }
}

function setupCenterSignSelect() {
  if (!centerSignSelectEl) return;
  centerSignSelectEl.innerHTML = "";
  SIGNS.forEach((sign, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = sign.name;
    centerSignSelectEl.appendChild(option);
  });
}

if (centerSignSelectEl) {
  centerSignSelectEl.addEventListener("change", () => {
    const nextIndex = Number(centerSignSelectEl.value);
    if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= SIGNS.length) return;
    viewOptions = { ...viewOptions, centerSign: nextIndex };
    render();
  });
}

function normalizeViewOptions(options) {
  return {
    ...options,
    centerSign: normalizeSignIndex(options.centerSign),
  };
}

function seededRandom(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let n = Math.imul(t ^ (t >>> 15), 1 | t);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStarfield(width, height, count, seed = 48271) {
  const rand = seededRandom(seed);
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    const pick = rand();
    const size = pick < 0.82 ? 0.55 + rand() * 0.65 : pick < 0.97 ? 1 + rand() * 0.8 : 1.95 + rand() * 0.9;
    const temp = rand();
    const color =
      temp < 0.22
        ? [255, 224 + Math.floor(rand() * 18), 198 + Math.floor(rand() * 24)]
        : temp < 0.8
          ? [236 + Math.floor(rand() * 18), 240 + Math.floor(rand() * 14), 255]
          : [205 + Math.floor(rand() * 28), 225 + Math.floor(rand() * 24), 255];

    stars.push({
      x: rand() * width,
      y: rand() * height,
      r: size,
      alpha: 0.25 + rand() * 0.6,
      twinklePhase: rand() * Math.PI * 2,
      twinkleSpeed: 0.15 + rand() * 0.55,
      driftScale: 0.15 + rand() * 0.95,
      color,
    });
  }
  return stars;
}

function setupStarfield() {
  const canvas = starfieldState.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  starfieldState.ctx = ctx;

  const resize = () => {
    const dpr = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, 2));
    const width = globalThis.innerWidth;
    const height = globalThis.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    starfieldState.dpr = dpr;
    starfieldState.width = width;
    starfieldState.height = height;
    const density = 3800;
    const count = Math.max(180, Math.floor((width * height) / density));
    starfieldState.stars = buildStarfield(width, height, count);
  };

  resize();
  globalThis.addEventListener("resize", resize);
}

function renderStarfield(date) {
  const { ctx, width, height, stars } = starfieldState;
  if (!ctx || !width || !height || stars.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  const unixSeconds = date.getTime() / 1000;
  const driftXBase = (unixSeconds / 190) % width;
  const driftYBase = (unixSeconds / 470) % height;

  stars.forEach((star) => {
    const x = (star.x + driftXBase * star.driftScale) % width;
    const y = (star.y + driftYBase * star.driftScale * 0.3) % height;
    const twinkle = 0.82 + 0.24 * Math.sin(unixSeconds * star.twinkleSpeed + star.twinklePhase);
    const alpha = Math.max(0.08, Math.min(1, star.alpha * twinkle));
    const [r, g, b] = star.color;

    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
    ctx.fill();
  });
}

function clearStarfield() {
  const { ctx, width, height } = starfieldState;
  if (!ctx || !width || !height) return;
  ctx.clearRect(0, 0, width, height);
}

function shiftViewDate(amount, unit) {
  const next = new Date(viewDate);
  if (unit === "minute") next.setUTCMinutes(next.getUTCMinutes() + amount);
  if (unit === "hour") next.setUTCHours(next.getUTCHours() + amount);
  if (unit === "day") next.setUTCDate(next.getUTCDate() + amount);
  if (unit === "week") next.setUTCDate(next.getUTCDate() + amount * 7);
  if (unit === "month") next.setUTCMonth(next.getUTCMonth() + amount);
  if (unit === "year") next.setUTCFullYear(next.getUTCFullYear() + amount);
  viewDate = next;
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

function render() {
  const snapshot = motionSnapshot(viewDate);
  const depthContext = geocentricDepthContext(viewDate);
  draw(snapshot.nowState, snapshot.details, depthContext);
  if (viewOptions.drift) {
    renderTrend(viewDate, snapshot.nowState, viewOptions);
  } else if (trendSvgEl) {
    trendSvgEl.innerHTML = "";
  }
  applyDisplayOptions();
  if (viewOptions.stars) {
    renderStarfield(viewDate);
  } else {
    clearStarfield();
  }
  syncStateToUrl(viewDate, viewOptions);
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
    const match = step.match(/^([+-]?\d+)-(minute|hour|day|week|month|year)$/);
    if (!match) return;
    const amount = Number(match[1]);
    const unit = match[2];
    shiftViewDate(amount, unit);
    render();
  });
});

optionInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const key = input.dataset.option;
    if (!key || !(key in DEFAULT_VIEW_OPTIONS)) return;
    if (typeof DEFAULT_VIEW_OPTIONS[key] !== "boolean") return;
    viewOptions = { ...viewOptions, [key]: input.checked };
    render();
  });
});

globalThis.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (isEditableTarget(event.target)) return;

  event.preventDefault();
  shiftViewDate(event.key === "ArrowRight" ? 1 : -1, "day");
  render();
});

if (optionsToggleEl && optionsPanelEl) {
  optionsToggleEl.addEventListener("click", (event) => {
    event.stopPropagation();
    setOptionsPanelOpen(optionsPanelEl.hidden);
  });

  globalThis.addEventListener("pointerdown", (event) => {
    if (optionsPanelEl.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (optionsPanelEl.contains(target) || optionsToggleEl.contains(target)) return;
    setOptionsPanelOpen(false);
  });

  globalThis.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOptionsPanelOpen(false);
    }
  });
}

globalThis.addEventListener("popstate", () => {
  const state = readUrlState();
  if (state.date) {
    viewDate = state.date;
  }
  viewOptions = normalizeViewOptions(state.options);
  syncOptionsUi();
  setOptionsPanelOpen(false);
  render();
});

setupCenterSignSelect();
viewOptions = normalizeViewOptions(viewOptions);
syncOptionsUi();
setOptionsPanelOpen(false);
setupStarfield();
render();
setInterval(() => {
  viewDate = new Date(viewDate.getTime() + 1000);
  render();
}, 1000);
