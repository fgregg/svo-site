// Renders a CSV file as an accessible HTML <table>, replacing the old
// datapipes.okfnlabs.org iframe embed (that third-party service went dark and
// no longer returns a table). Each table lives in the CSV, so there is no
// duplicated data to maintain — the page fetches and renders it at load.
//
// Usage:
//   <div class="svo-table" data-csv="data/densities.csv"
//        data-caption="Density (g/ml) of vegetable oils vs. temperature (°C)"></div>
//   <noscript><a href="data/densities.csv">Download the CSV</a></noscript>
//
// The parser follows RFC 4180: fields may be double-quoted and then contain
// commas, newlines, and escaped quotes (""). Several source CSVs use quoted,
// multi-line header cells (e.g. "Viscosity\nmm^2/s @ 40 C"), so this matters.

(function () {
  "use strict";

  // Parse RFC 4180 CSV text into an array of rows (each an array of strings).
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    let i = 0;
    const n = text.length;

    while (i < n) {
      const c = text[i];

      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"'; // escaped quote
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }

      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\r") {
        i++;
        continue; // normalize CRLF
      }
      if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
        continue;
      }
      field += c;
      i++;
    }

    // Flush the final field/row if the file didn't end with a newline.
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    // Drop trailing fully-empty rows (common from a final newline).
    while (rows.length && rows[rows.length - 1].every((v) => v.trim() === "")) {
      rows.pop();
    }
    return rows;
  }

  // Header cells may hold multiple lines (name / units / standard). Render the
  // first line as text and the rest as smaller sub-lines.
  function fillHeaderCell(th, raw) {
    const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) {
      th.textContent = "";
      return;
    }
    th.appendChild(document.createTextNode(lines[0]));
    for (let k = 1; k < lines.length; k++) {
      th.appendChild(document.createElement("br"));
      const small = document.createElement("small");
      small.textContent = lines[k];
      th.appendChild(small);
    }
  }

  function renderTable(container, rows, caption) {
    const table = document.createElement("table");
    table.className = "svo-data-table";

    if (caption) {
      const cap = document.createElement("caption");
      cap.textContent = caption;
      table.appendChild(cap);
    }

    if (rows.length) {
      const thead = document.createElement("thead");
      const htr = document.createElement("tr");
      rows[0].forEach((cell) => {
        const th = document.createElement("th");
        th.scope = "col";
        fillHeaderCell(th, cell);
        htr.appendChild(th);
      });
      thead.appendChild(htr);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      for (let r = 1; r < rows.length; r++) {
        const tr = document.createElement("tr");
        rows[r].forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
    }

    const scroller = document.createElement("div");
    scroller.className = "svo-table-scroll";
    scroller.appendChild(table);

    container.textContent = "";
    container.appendChild(scroller);
  }

  function load(container) {
    const url = container.getAttribute("data-csv");
    if (!url) return;
    const caption = container.getAttribute("data-caption") || "";

    fetch(url)
      .then((resp) => {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.text();
      })
      .then((text) => renderTable(container, parseCSV(text), caption))
      .catch((err) => {
        const p = document.createElement("p");
        p.className = "svo-table-error";
        const a = document.createElement("a");
        a.href = url;
        a.textContent = "Download the CSV";
        p.appendChild(document.createTextNode("Could not load the table (" + err.message + "). "));
        p.appendChild(a);
        container.textContent = "";
        container.appendChild(p);
      });
  }

  function init() {
    document.querySelectorAll(".svo-table[data-csv]").forEach(load);
  }

  // Expose the parser so the viscosity chart (svo-viscosity-plot.js) can reuse
  // it instead of shipping a second CSV parser.
  window.SVO = window.SVO || {};
  window.SVO.parseCSV = parseCSV;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
