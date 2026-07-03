# Publishing the compilation on Zenodo

This is a planning aid — it is **not** deployed. It gives the exact values to
enter when depositing the data compilation on <https://zenodo.org>, and the
one-time follow-up to wire the minted DOI back into the site.

Zenodo is an appropriate home for this: a curated compilation of literature
values is a derived **dataset**, which is exactly what Zenodo's *Dataset* upload
type is for. It mints a permanent, citable DOI and supports versioning (each new
release gets a new version DOI under one concept DOI).

## What to upload

Zip the data + its documentation (keep it self-describing):

```sh
cd svo-site
zip -j svo-data-compilation.zip \
  public/data/fatty_acid_profiles.csv \
  public/data/fuel_properties.csv \
  public/data/centistoke.csv \
  public/data/densities.csv \
  datapackage.json README.md LICENSE CITATION.cff
```

(Or connect the GitHub repo to Zenodo later and let a GitHub *release* archive it
automatically — but you chose manual upload, so the zip is the path.)

## Web-form field values (New upload → Dataset)

- **Upload type:** Dataset
- **Title:** Fuel and Chemical Properties of Vegetable Oils: an open data compilation
- **Authors / Creators:** Gregg, Forest  *(add ORCID if you have one)*
- **Description:**
  > A curated compilation of the physical, chemical, and fuel properties of
  > vegetable oils and animal fats, drawn from roughly thirty papers in the
  > research literature and published as open CSV data with full citations.
  > Assembled for the book *SVO: Powering Your Vehicle with Straight Vegetable
  > Oil* (Forest Gregg). Four tables: fatty acid profiles, fuel properties,
  > kinematic viscosity vs. temperature, and density vs. temperature. Each row
  > cites its primary source; the accompanying `datapackage.json` describes the
  > columns. Data compiled with citations; underlying measurements are from the
  > cited primary literature.
- **License:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Keywords:** vegetable oil; straight vegetable oil; SVO; biodiesel; fuel
  properties; kinematic viscosity; fatty acid profile; density; diesel engine
- **Language:** English
- **Version:** 1.0.0
- **Related / alternate identifiers:**
  - `https://svo.bunkum.us/`  — relation: *is documented by* (or *is supplement to*)
  - ISBN `0865716129` (the SVO book) — relation: *is part of*
  - (optional) add the source-paper DOIs listed on each page as *references*

## Reserve the DOI *before* publishing

In the deposit's **Basic information**, click **Reserve DOI** (or **Get a DOI
now**). This mints the DOI immediately so you can:

1. Put it in this repo before/while publishing (see below), and
2. Include the DOI in the README/CITATION you upload, if you want it inside the
   archived files too (optional — you can also publish, then update the site).

Then **Publish**.

## After publishing — wire the DOI into the site

You'll have two DOIs: a **concept DOI** (always points at the latest version —
use this for general citation) and a **version DOI** (this exact version).

Replace the placeholders (grep the repo for `ZENODO DOI` and `zenodo.XXXXXXX`):

1. **Each HTML page** (`index.html`, `fatty_acid.html`, `fuel_property.html`,
   `viscosity.html`, `density.html`): in the `Dataset` / `DataCatalog` JSON-LD add
   ```json
   "identifier": "https://doi.org/10.5281/zenodo.XXXXXXX",
   "sameAs": "https://doi.org/10.5281/zenodo.XXXXXXX"
   ```
   (use the **concept** DOI).
2. **`index.html`** → the "Citing this data" section: replace the "to be
   assigned" sentence with the real DOI and a citation line.
3. **`CITATION.cff`** → uncomment and set `doi:`.
4. **`README.md`** → replace the "DOI: to be assigned" note.

Commit and push — GitHub Actions redeploys `svo.bunkum.us`.
