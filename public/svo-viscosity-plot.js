// Interactive kinematic-viscosity-vs-temperature chart, drawn with Observable
// Plot from data/centistoke.csv. For each oil it plots the reported values as
// dots and the fitted MacCoull-Walther (ASTM D-341) viscosity-temperature curve
// as a smooth line — the same kind of curve the old viscosity_color.pdf showed,
// now computed from the data itself.
//
// MacCoull-Walther (ASTM D341): log10(log10(nu + 0.7)) = A - B * log10(T),
// with nu in mm^2/s (cSt) and T the absolute temperature in kelvin. Fitting is a
// linear least-squares regression in those "Walther" coordinates.
//
// Requires (loaded first, as globals): d3 (vendor/d3.min.js),
// Plot (vendor/plot.umd.min.js), and SVO.parseCSV (svo-table.js).

(function () {
  "use strict";

  const container = document.getElementById("viscosity-plot");
  if (!container) return;
  if (typeof Plot === "undefined" || !window.SVO || !window.SVO.parseCSV) {
    container.textContent =
      "Interactive chart unavailable (charting library did not load).";
    return;
  }

  const KELVIN = 273.15;

  // Fit A, B for log10(log10(nu + 0.7)) = A + B*log10(T_kelvin).
  function fitWalther(points) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const p of points) {
      if (!(p.viscosity + 0.7 > 1)) continue; // loglog needs argument > 1
      const x = Math.log10(p.temperature + KELVIN);
      const y = Math.log10(Math.log10(p.viscosity + 0.7));
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
    }
    if (n < 2) return null;
    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-12) return null; // all points at one temperature
    const b = (n * sxy - sx * sy) / denom;
    const a = (sy - b * sx) / n;
    return { a: a, b: b };
  }

  function waltherViscosity(fit, tC) {
    const y = fit.a + fit.b * Math.log10(tC + KELVIN);
    return Math.pow(10, Math.pow(10, y)) - 0.7;
  }

  // No. 2 diesel viscosity–temperature correlation from Tat & Van Gerpen (1999),
  // JAOCS 76:1511–1513 (Table 2): ln(nu) = A + B/T + C/T^2, with T in kelvin and
  // nu in cSt (mm^2/s). Valid ~ -14.4 to 100 °C. Drawn as a reference against the
  // vegetable oils. The ASTM D975 spec ceiling for #2 diesel is 4.1 cSt at 40 °C.
  const DIESEL = { A: 1.5029, B: -2316.0, C: 672200.0 };
  const DIESEL_COLOR = "#111111";
  const ASTM_COLOR = "#c1121f";
  const ASTM_D975_MAX = 4.1;
  function dieselViscosity(tC) {
    const T = tC + KELVIN;
    return Math.exp(DIESEL.A + DIESEL.B / T + DIESEL.C / (T * T));
  }

  // Render a compact tabular (grid) legend below the chart, viscosity-ordered,
  // and wire hover-to-highlight: hovering an oil's legend cell or its curve
  // highlights that oil and dims the rest. With 27 oils the colors necessarily
  // repeat, so this is what makes the legend usable. Marks are tagged by DOM
  // order: Plot draws one <path> per curved oil in color-domain order, and one
  // <circle> per data point in data order.
  function wireHighlight(chart, container, orderedOils, curvedOils, points, styleOf) {
    const SVGNS = "http://www.w3.org/2000/svg";
    function lineSwatch(color, dash, width) {
      const swatch = document.createElementNS(SVGNS, "svg");
      swatch.setAttribute("class", "svo-legend-swatch");
      swatch.setAttribute("viewBox", "0 0 26 8");
      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", "1"); line.setAttribute("y1", "4");
      line.setAttribute("x2", "25"); line.setAttribute("y2", "4");
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", String(width || 2));
      if (dash && dash !== "none") line.setAttribute("stroke-dasharray", dash);
      swatch.appendChild(line);
      return swatch;
    }
    const lineG = chart.querySelector('g[aria-label="line"]');
    // Plot wraps each series path in an inner <g>, so query descendants.
    const linePaths = lineG ? Array.from(lineG.querySelectorAll("path")) : [];
    linePaths.forEach((p, i) => {
      const oil = curvedOils[i];
      if (!oil) return;
      p.setAttribute("data-oil", oil);
      // strokeDasharray isn't a per-series channel in Plot, so apply the oil's
      // dash pattern to its path here (matches the legend swatch).
      const st = styleOf.get(oil);
      if (st && st.dash !== "none") p.setAttribute("stroke-dasharray", st.dash);
    });

    const dotG = chart.querySelector('g[aria-label="dot"]');
    const dots = dotG ? Array.from(dotG.querySelectorAll("circle")) : [];
    dots.forEach((c, i) => {
      if (points[i]) c.setAttribute("data-oil", points[i].oil);
    });

    // Custom grid legend, ordered by viscosity, each swatch a mini line drawn in
    // the oil's color AND dash pattern so it matches its curve.
    const legend = document.createElement("div");
    legend.className = "svo-legend";

    const items = orderedOils.map((oil) => {
      const style = styleOf.get(oil) || { color: "#888", dash: "none" };
      const item = document.createElement("div");
      item.className = "svo-legend-item";
      item.__oil = oil;
      const label = document.createElement("span");
      label.className = "svo-legend-label";
      label.textContent = oil;
      item.appendChild(lineSwatch(style.color, style.dash, 2));
      item.appendChild(label);
      legend.appendChild(item);
      return item;
    });
    container.appendChild(legend);

    function setHighlight(oil) {
      const on = !!oil;
      linePaths.forEach((p) => {
        const match = !on || p.getAttribute("data-oil") === oil;
        p.style.opacity = on ? (match ? "1" : "0.08") : "";
        p.style.strokeWidth = on && match ? "3" : "";
      });
      dots.forEach((c) => {
        const match = !on || c.getAttribute("data-oil") === oil;
        c.style.opacity = on ? (match ? "1" : "0.08") : "";
      });
      items.forEach((it) => {
        const match = !on || it.__oil === oil;
        it.classList.toggle("is-dim", on && !match);
        it.classList.toggle("is-on", on && match);
      });
    }

    items.forEach((it) => {
      it.addEventListener("mouseenter", () => setHighlight(it.__oil));
      it.addEventListener("mouseleave", () => setHighlight(null));
    });
    linePaths.forEach((p) => {
      p.style.cursor = "pointer";
      p.addEventListener("mouseenter", () =>
        setHighlight(p.getAttribute("data-oil"))
      );
      p.addEventListener("mouseleave", () => setHighlight(null));
    });
  }

  fetch("data/centistoke.csv")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    })
    .then((text) => {
      const rows = window.SVO.parseCSV(text);
      if (!rows.length) throw new Error("empty CSV");

      const header = rows[0];
      // Columns: Oil, Variety or Processing, <temperatures…>, Source.
      const sourceIdx = header.length - 1;
      const tempCols = [];
      for (let c = 2; c < sourceIdx; c++) {
        const t = parseFloat(header[c]);
        if (isFinite(t)) tempCols.push({ idx: c, t: t });
      }

      const points = [];
      const byOil = new Map(); // one fitted curve per oil, over all its points
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const oil = (row[0] || "").trim();
        if (!oil) continue;
        const variety = (row[1] || "").trim();
        const source = (row[sourceIdx] || "").trim();
        const series =
          oil +
          (variety ? " (" + variety + ")" : "") +
          (source ? " — " + source : "");
        tempCols.forEach(function (col) {
          const v = parseFloat(row[col.idx]);
          if (!isNaN(v) && v > 0) {
            const pt = {
              oil: oil, variety: variety, source: source, series: series,
              temperature: col.t, viscosity: v,
            };
            points.push(pt);
            if (!byOil.has(oil)) byOil.set(oil, []);
            byOil.get(oil).push(pt);
          }
        });
      }

      // One fit per oil, plus a reference viscosity (at 40 °C) used to order the
      // legend high → low so it reads top-to-bottom like the curves stack.
      const oilInfo = [];
      byOil.forEach(function (pts, oil) {
        const fit = fitWalther(pts);
        let refV = fit ? waltherViscosity(fit, 40) : NaN;
        if (!isFinite(refV)) {
          refV = Math.max.apply(null, pts.map((p) => p.viscosity));
        }
        oilInfo.push({ oil: oil, fit: fit, pts: pts, refV: refV });
      });
      oilInfo.sort((a, b) => b.refV - a.refV);
      const orderedOils = oilInfo.map((o) => o.oil);

      // Like the PDF, distinguish oils by color AND line pattern. Ten colors
      // recycle; each time they wrap, the dash pattern changes — so color+dash
      // stays unique across all oils. (10 colors x 4 dashes = 40 combinations.)
      const PALETTE =
        window.d3 && d3.schemeTableau10
          ? d3.schemeTableau10
          : ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f",
             "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"];
      const DASHES = ["none", "5 3", "1 2.5", "8 3 1 3"]; // solid, dashed, dotted, dash-dot
      const styleOf = new Map();
      orderedOils.forEach(function (oil, i) {
        styleOf.set(oil, {
          color: PALETTE[i % PALETTE.length],
          dash: DASHES[Math.floor(i / PALETTE.length) % DASHES.length],
        });
      });

      // Build one smooth fitted curve per oil, fitting all of that oil's points.
      const curve = [];
      oilInfo.forEach(function (info) {
        if (!info.fit) return;
        const temps = info.pts.map((p) => p.temperature);
        const tmin = Math.min.apply(null, temps);
        const tmax = Math.max.apply(null, temps);
        if (tmax <= tmin) return;
        const STEPS = 60;
        for (let i = 0; i <= STEPS; i++) {
          const t = tmin + ((tmax - tmin) * i) / STEPS;
          const v = waltherViscosity(info.fit, t);
          if (isFinite(v) && v > 0) {
            curve.push({ oil: info.oil, temperature: t, viscosity: v });
          }
        }
      });

      // Oils that actually got a drawn curve, in the same (legend) order Plot
      // draws their <path> elements — used to tag them for highlighting.
      const curvedSet = new Set(curve.map((c) => c.oil));
      const curvedOils = orderedOils.filter((o) => curvedSet.has(o));

      // Reference #2 diesel curve (Tat & Van Gerpen 1999 correlation) plus the
      // ASTM D975 spec ceiling, overlaid on the vegetable oils for comparison.
      const dieselCurve = [];
      for (let t = 0; t <= 100; t += 2) {
        dieselCurve.push({ temperature: t, viscosity: dieselViscosity(t) });
      }

      const width = Math.max(320, Math.min(720, container.clientWidth || 720));

      const chart = Plot.plot({
        width: width,
        height: Math.round(width * 0.72),
        marginLeft: 52,
        marginBottom: 42,
        style: { fontFamily: "inherit", fontSize: "12px", overflow: "visible" },
        x: {
          label: "Temperature (°C / °F) →",
          grid: true,
          nice: true,
          // Dual Celsius/Fahrenheit tick labels, like the original PDF (e.g. 40/104).
          tickFormat: (d) => d + "/" + Math.round((d * 9) / 5 + 32),
        },
        y: {
          // Linear scale, capped at 100 cSt like the original PDF graph. A few
          // cold, high-viscosity points sit above 100 and are clipped.
          label: "↑ Kinematic viscosity (mm²/s, cSt)",
          domain: [0, 100],
          grid: true,
        },
        // Built-in legend off; we render a custom tabular grid legend below.
        // Explicit range = our palette so curve colors match the legend swatches.
        color: { legend: false, domain: orderedOils, range: PALETTE },
        marks: [
          Plot.line(curve, {
            x: "temperature",
            y: "viscosity",
            z: "oil",
            stroke: "oil",
            strokeWidth: 1.5,
            strokeOpacity: 0.85,
            clip: true,
          }),
          Plot.dot(points, {
            x: "temperature",
            y: "viscosity",
            stroke: "oil",
            fill: "oil",
            r: 2.5,
            clip: true,
            title: (d) =>
              d.series + "\n" + d.temperature + " °C, " + d.viscosity + " cSt",
            tip: true,
          }),
          // Reference #2 diesel curve (drawn on top, bold black).
          Plot.line(dieselCurve, {
            x: "temperature",
            y: "viscosity",
            stroke: DIESEL_COLOR,
            strokeWidth: 2.5,
            clip: true,
          }),
          // ASTM D975 viscosity ceiling for #2 diesel (spec is at 40 °C).
          Plot.ruleY([ASTM_D975_MAX], {
            stroke: ASTM_COLOR,
            strokeWidth: 1.5,
            strokeDasharray: "5 4",
          }),
          Plot.text([{ x: 22, y: ASTM_D975_MAX, label: "ASTM D975 max, #2 diesel (40 °C)" }], {
            x: "x", y: "y", text: "label",
            textAnchor: "start", dy: -4, fill: ASTM_COLOR, fontSize: 10, clip: true,
          }),
          Plot.text([{ x: 66, y: dieselViscosity(66), label: "#2 diesel" }], {
            x: "x", y: "y", text: "label",
            textAnchor: "start", dx: 4, dy: -6, fill: DIESEL_COLOR, fontSize: 11, clip: true,
          }),
        ],
      });

      container.textContent = "";
      container.append(chart);

      wireHighlight(chart, container, orderedOils, curvedOils, points, styleOf);
    })
    .catch(function (err) {
      container.textContent = "Could not load the chart: " + err.message;
    });
})();
