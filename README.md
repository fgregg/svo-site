# svo.bunkum.us — Fuel & Chemical Properties of Vegetable Oils

Companion site and **open data compilation** for the book *SVO: Powering Your
Vehicle with Straight Vegetable Oil* by Forest Gregg.

The heart of this repo is a curated compilation of the physical, chemical, and
fuel properties of vegetable oils and animal fats, gathered from ~30 papers in
the research literature and published as open CSV data with full citations. The
site renders each table in the browser and offers an interactive
viscosity-vs-temperature chart (Observable Plot), while the raw CSVs stay the
single source of truth.

Live: <https://svo.bunkum.us/>

## Data

All data is in [`public/data/`](public/data/) and described machine-readably in
[`datapackage.json`](datapackage.json) (Frictionless Tabular Data Package).

| File | Contents |
| --- | --- |
| `data/fatty_acid_profiles.csv` | Fatty acid make-up (% by weight) of oils/fats. Columns: `Fat`, `Variety or processing`, one column per fatty acid (Myristic 14:0 … Lignoceric 24:0), `Other`, `Total`, `Sources`. |
| `data/fuel_properties.csv` | Fuel & chemical properties (viscosity, density, calorific value, cetane, flash/cloud/pour points, iodine/acid/saponification values, elemental composition, …). Columns include the measurement units and ASTM/AOCS method; last column is `Source`. |
| `data/centistoke.csv` | Kinematic viscosity (mm²/s, cSt). Columns: `Oil`, `Variety or Processing`, then one column per temperature in °C (0 … 110), `Source`. |
| `data/densities.csv` | Density (g/ml). Column `Oils`, then one column per temperature in °C (23.9 … 110). |

Where a source reported a value as a range, the range is preserved in the CSV.
Each table's page lists the full literature citations.

The viscosity page also draws an interactive chart: the reported values as dots
plus a fitted MacCoull–Walther (ASTM D-341) viscosity-vs-temperature curve per
oil, computed in the browser from `centistoke.csv`. `viscosity_color.pdf` is a
static graph of the same curves, linked (no longer embedded) from that page.

## License

The compilation is licensed **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**
(see [`LICENSE`](LICENSE)). Reuse freely with attribution. The underlying
measured values come from the cited primary sources.

## Citing this data

This compilation is archived on Zenodo with a permanent DOI.

> **DOI:** [10.5281/zenodo.21152346](https://doi.org/10.5281/zenodo.21152346)
>
> Gregg, Forest. *Fuel and Chemical Properties of Vegetable Oils: an open data
> compilation*. Zenodo. https://doi.org/10.5281/zenodo.21152346

## Structure

```
public/
  index.html                 # landing + bibliography + errata (DataCatalog JSON-LD)
  fatty_acid.html            # each data page carries schema.org Dataset JSON-LD
  fuel_property.html
  viscosity.html             # + interactive Observable Plot chart (fitted curves)
  density.html
  svo.css
  svo-table.js               # renders each CSV as an accessible <table>
  svo-viscosity-plot.js      # fits MacCoull-Walther curves, builds the chart
  vendor/d3.min.js           # d3 v7.9.0 (Observable Plot dependency)
  vendor/plot.umd.min.js     # Observable Plot v0.6.16
  viscosity_color.pdf        # static graph of the fitted curves (linked, not embedded)
  data/*.csv
datapackage.json             # Frictionless description of the CSVs
CITATION.cff                 # citation metadata
```

## Discoverability (schema.org)

Every page embeds JSON-LD: each data page is a `schema.org/Dataset` with a
`DataDownload` distribution pointing at its CSV, its `license`, `creator`,
`variableMeasured`, and literature `citation`; the landing page ties them
together in a `DataCatalog` and links the `Book`. This is what makes the
compilation eligible for Google Dataset Search and citation tooling. After the
Zenodo DOI is minted, add it as the `identifier`/`sameAs` on each `Dataset`.

## Develop & deploy

Static site, no build step.

```sh
npm install
npm run dev      # wrangler pages dev  → local preview
```

Pushing to `main` deploys `public/` to the Cloudflare Pages project `svo` via
GitHub Actions (`.github/workflows/deploy.yml`); the custom domain
`svo.bunkum.us` is attached to that project.
