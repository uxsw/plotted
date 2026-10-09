"use client";

import { useState } from "react";

// Dev-only type trial. Candidate faces load from the Fontshare CDN here so
// they can be compared on real Plotted content before anything is
// self-hosted. Nothing outside this route references these families.

// One stylesheet per family: Fontshare's CSS endpoint returns only the first
// family when several variable (@1,2) families share a request.
const FONTSHARE_CSS = [
  "zodiak@1,2",
  "erode@1,2",
  "recia@1,2",
  "rowan@1,2",
  "bespoke-serif@1,2",
  "sentient@1,2",
  "stardom@400",
  "cabinet-grotesk@1",
  "switzer@1,2",
  "general-sans@1,2",
  "bespoke-sans@1,2",
  "supreme@1,2",
].map((f) => `https://api.fontshare.com/v2/css?f[]=${f}&display=swap`);

interface Heading {
  id: string;
  name: string;
  source: string;
  family: string;
  /** Face for botanical Latin when the heading face has no italic. */
  latinFamily?: string;
  /** Face for card titles when the heading face can't work small. */
  titleFamily?: string;
  weight: number;
  note: string;
}

const SENTIENT = "'Sentient', serif";

const HEADINGS: Heading[] = [
  {
    id: "fraunces",
    name: "Fraunces",
    source: "Current",
    family: "var(--font-fraunces), serif",
    weight: 600,
    note: "What ships today. Soft, wonky old-style; the face you want to move off.",
  },
  {
    id: "zodiak",
    name: "Zodiak",
    source: "Fontshare · 100–900 + italics",
    family: "'Zodiak', serif",
    weight: 600,
    note: "A Clarendon: the bracketed, sturdy letter of 19th-century seed and nursery catalogues.",
  },
  {
    id: "erode",
    name: "Erode",
    source: "Fontshare · 300–700 + italics",
    family: "'Erode', serif",
    weight: 600,
    note: "Cut, wedge-shaped serifs. Reads as chiselled or pruned rather than drawn.",
  },
  {
    id: "recia",
    name: "Recia",
    source: "Fontshare · 300–700 + italics",
    family: "'Recia', serif",
    weight: 600,
    note: "Slab-leaning and squarer. The most engineered of the serifs here.",
  },
  {
    id: "rowan",
    name: "Rowan",
    source: "Fontshare · 300–700 + italics",
    family: "'Rowan', serif",
    weight: 600,
    note: "Calligraphic and warm, with a lively italic.",
  },
  {
    id: "bespoke-serif",
    name: "Bespoke Serif",
    source: "Fontshare · 300–800 + italics",
    family: "'Bespoke Serif', serif",
    weight: 600,
    note: "Has a matching sans (Bespoke Sans), so heading and body share one skeleton.",
  },
  {
    id: "sentient",
    name: "Sentient",
    source: "Fontshare · 200–700 + italics",
    family: SENTIENT,
    weight: 600,
    note: "On your list. A gentle text serif; quiet at heading sizes.",
  },
  {
    id: "stardom",
    name: "Stardom + Sentient",
    source: "Fontshare · Stardom is one weight, no italic",
    family: "'Stardom', serif",
    latinFamily: SENTIENT,
    titleFamily: SENTIENT,
    weight: 400,
    note: "On your list. Stardom takes the large headings only; Sentient has to carry card titles and all Latin.",
  },
  {
    id: "cabinet",
    name: "Cabinet Grotesk + Sentient",
    source: "Fontshare · 100–900, no italic",
    family: "'Cabinet Grotesk', sans-serif",
    latinFamily: SENTIENT,
    weight: 700,
    note: "The sans route. Headings turn technical; a serif italic keeps the Latin botanical.",
  },
];

interface Body {
  id: string;
  name: string;
  family: string;
}

const BODIES: Body[] = [
  { id: "inter", name: "Inter (current)", family: "var(--font-inter), sans-serif" },
  { id: "switzer", name: "Switzer", family: "'Switzer', sans-serif" },
  { id: "general-sans", name: "General Sans", family: "'General Sans', sans-serif" },
  { id: "bespoke-sans", name: "Bespoke Sans", family: "'Bespoke Sans', sans-serif" },
  { id: "supreme", name: "Supreme", family: "'Supreme', sans-serif" },
];

const WEATHER = [
  ["Mon", "14°", "7°", "0.0 mm"],
  ["Tue", "12°", "5°", "3.4 mm"],
  ["Wed", "9°", "1°", "11.8 mm"],
  ["Thu", "11°", "-1°", "0.2 mm"],
];

function Latin({ h, children }: { h: Heading; children: React.ReactNode }) {
  return (
    <em style={{ fontFamily: h.latinFamily ?? "inherit", fontStyle: "italic", fontWeight: h.latinFamily ? 400 : "inherit" }}>
      {children}
    </em>
  );
}

export default function FontTrialPage() {
  const [headingId, setHeadingId] = useState("zodiak");
  const [bodyId, setBodyId] = useState("switzer");
  const h = HEADINGS.find((x) => x.id === headingId) ?? HEADINGS[0];
  const b = BODIES.find((x) => x.id === bodyId) ?? BODIES[0];

  const head = { fontFamily: h.family, fontWeight: h.weight } as const;
  const title = { fontFamily: h.titleFamily ?? h.family, fontWeight: h.titleFamily ? 600 : h.weight } as const;
  // Marketing register: italic 400. A face with no italic falls back to its
  // Latin companion, which is what the site would have to do too.
  const hero = {
    fontFamily: h.latinFamily ?? h.family,
    fontStyle: "italic",
    fontWeight: 400,
    letterSpacing: "-0.02em",
  } as const;

  return (
    <div className="ft" style={{ fontFamily: b.family }}>
      {FONTSHARE_CSS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <style>{CSS}</style>

      <header className="ft__intro">
        <h1 className="paragon" style={head}>Heading and body type trial</h1>
        <p className="primer o-measure">
          Nine heading options set on the same Plotted content. Pick a row to
          apply it to the specimen below, then change the body face to see how
          the pair sits.
        </p>
      </header>

      <div className="ft__lineup" role="group" aria-label="Heading face">
        {HEADINGS.map((x) => (
          <button
            key={x.id}
            type="button"
            className="ft__row"
            aria-pressed={x.id === h.id}
            onClick={() => setHeadingId(x.id)}
          >
            <span className="ft__row-meta">
              <span className="o-type-label">{x.name}</span>
              <span className="minion ft__muted">{x.source}</span>
            </span>
            <span className="paragon ft__row-head" style={{ fontFamily: x.family, fontWeight: x.weight }}>
              Planting schemes
            </span>
            <span
              className="pica ft__row-title"
              style={{ fontFamily: x.titleFamily ?? x.family, fontWeight: x.titleFamily ? 600 : x.weight }}
            >
              Hydrangea <Latin h={x}>paniculata &lsquo;Limelight&rsquo;</Latin>
            </span>
          </button>
        ))}
      </div>

      <div className="ft__bodies" role="group" aria-label="Body face">
        <span className="o-type-label">Body</span>
        {BODIES.map((x) => (
          <button
            key={x.id}
            type="button"
            className="ft__chip brevier"
            aria-pressed={x.id === b.id}
            style={{ fontFamily: x.family }}
            onClick={() => setBodyId(x.id)}
          >
            {x.name}
          </button>
        ))}
      </div>

      <p className="brevier ft__note">
        <strong className="kirk">{h.name}.</strong> {h.note}
      </p>

      <main className="ft__specimen">
        <section className="ft__block">
          <p className="o-type-label ft__muted">Marketing display · italic 400</p>
          <p className="canon ft__hero" style={hero}>
            A garden that knows what week it is.
          </p>
          <p className="long-primer ft__lead">
            Plotted keeps a record of what you grow, then tells you what the
            week ahead means for it.
          </p>
        </section>

        <section className="ft__block">
          <p className="o-type-label ft__muted">App page · heading 600, body 400</p>
          <h2 className="paragon" style={head}>My plants</h2>
          <p className="primer o-measure">
            Thirty-four plants logged. Frost is forecast for Thursday night, so
            the three tender ones below are worth moving under cover before
            then. Everything else in the border will shrug it off.
          </p>

          <div className="ft__cards">
            <article className="ft__card">
              <p className="o-type-label ft__muted">Plate 014 · Shrub</p>
              <h3 className="pica" style={title}>
                Hydrangea <Latin h={h}>paniculata &lsquo;Limelight&rsquo;</Latin>
              </h3>
              <p className="brevier ft__muted">Panicle hydrangea. Flowers July to October, full sun to part shade.</p>
            </article>
            <article className="ft__card">
              <p className="o-type-label ft__muted">Plate 022 · Fruit tree</p>
              <h3 className="pica" style={title}>Apple</h3>
              <p className="brevier ft__muted">
                <Latin h={h}>Malus domestica &lsquo;Egremont Russet&rsquo;</Latin>
              </p>
              <p className="brevier ft__muted">Hardy to -20°C. Pick from late September.</p>
            </article>
            <article className="ft__card">
              <p className="o-type-label ft__muted">Plate 031 · Perennial</p>
              <h3 className="pica" style={title}>
                Geranium <Latin h={h}>&lsquo;Rozanne&rsquo;</Latin>
              </h3>
              <p className="brevier ft__muted">Cranesbill. Violet-blue from June until the first hard frost.</p>
            </article>
          </div>
        </section>

        <section className="ft__block ft__split">
          <div>
            <p className="o-type-label ft__muted">Scheme intro · display face at 400</p>
            <h2 className="long-pica" style={head}>A west-facing border for late summer</h2>
            <p className="long-primer o-measure" style={{ fontFamily: h.titleFamily ?? h.family, fontWeight: 400 }}>
              The hydrangea sets the height and the tone: lime in July, cream
              by August, flushing pink as the nights cool. Around it,{" "}
              <Latin h={h}>Verbena bonariensis</Latin> threads through at eye
              level and keeps the bees coming into October.
            </p>
            <div className="ft__actions">
              <button type="button" className="ft__btn ft__btn--primary primer">Save scheme</button>
              <button type="button" className="ft__btn primer">Add to shopping list</button>
            </div>
          </div>
          <div>
            <p className="o-type-label ft__muted">Data · tabular numerals</p>
            <table className="ft__table brevier o-type-tabular">
              <thead>
                <tr>
                  <th className="o-type-label" scope="col">Day</th>
                  <th className="o-type-label" scope="col">High</th>
                  <th className="o-type-label" scope="col">Low</th>
                  <th className="o-type-label" scope="col">Rain</th>
                </tr>
              </thead>
              <tbody>
                {WEATHER.map(([day, high, low, rain]) => (
                  <tr key={day}>
                    <th scope="row">{day}</th>
                    <td>{high}</td>
                    <td>{low}</td>
                    <td>{rain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="minion ft__muted">Updated 06:40 · Totnes, Devon</p>
          </div>
        </section>
      </main>
    </div>
  );
}

const CSS = `
.ft {
  min-height: 100vh;
  padding: 48px 24px 96px;
  max-width: 1040px;
  margin: 0 auto;
  color: var(--color-n-deep-grey);
}
.ft h1, .ft h2, .ft h3 { color: var(--color-ink); margin: 0; text-wrap: balance; }
.ft p { margin: 0; }
.ft ::selection { background: var(--color-paper-line); }
.ft__muted { color: var(--color-ink-soft); }
.ft__intro { display: grid; gap: 12px; margin-bottom: 32px; }

.ft__lineup { border-top: 1px solid var(--sem-border-color); }
.ft__row {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: baseline;
  gap: 24px;
  width: 100%;
  padding: 14px 12px;
  border: 0;
  border-bottom: 1px solid var(--sem-border-color);
  background: transparent;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}
.ft__row:hover { background: var(--color-paper-deep); }
.ft__row[aria-pressed="true"] { background: #fff; box-shadow: inset 3px 0 0 var(--color-ink); }
.ft__row:focus-visible, .ft__chip:focus-visible, .ft__btn:focus-visible {
  outline: 2px solid var(--sem-focus-color);
  outline-offset: 2px;
}
.ft__row-meta { display: grid; gap: 2px; }
.ft__row-head { font-size: 1.9rem; }
.ft__row-head, .ft__row-title { line-height: 1.15; }

.ft__bodies {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
  background: var(--color-paper);
  border-bottom: 1px solid var(--sem-border-color);
}
.ft__bodies > .o-type-label { margin-right: 8px; }
.ft__chip {
  padding: 6px 12px;
  border: 1px solid var(--sem-border-color);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
}
.ft__chip:hover { background: var(--color-paper-deep); }
.ft__chip[aria-pressed="true"] { background: var(--color-ink); border-color: var(--color-ink); color: var(--color-paper); }

.ft__note { padding: 16px 12px 0; max-width: 60ch; }

.ft__specimen { display: grid; gap: 56px; margin-top: 48px; }
.ft__block { display: grid; gap: 14px; }
.ft__hero { color: var(--color-ink); max-width: 14ch; }
.ft__lead { max-width: 30rem; }
.ft__cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 10px; }
.ft__card {
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 18px;
  background: #fff;
  border: 1px solid var(--sem-border-color);
  border-radius: var(--radius-m);
}
.ft__split { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 48px; align-items: start; }
.ft__split > div { display: grid; gap: 14px; }
.ft__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.ft__btn {
  padding: 10px 16px;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-m);
  background: transparent;
  color: var(--color-ink);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
}
.ft__btn--primary { background: var(--color-r-marigold); border-color: var(--color-r-marigold); color: var(--color-ink-deep); }
.ft__table { width: 100%; border-collapse: collapse; }
.ft__table th, .ft__table td { padding: 8px 0; border-bottom: 1px solid var(--sem-border-color); text-align: right; font-weight: 400; }
.ft__table th:first-child { text-align: left; }
.ft__table thead th { color: var(--color-ink-soft); }

@media (max-width: 760px) {
  .ft { padding: 28px 16px 72px; }
  .ft__row { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .ft__cards, .ft__split { grid-template-columns: minmax(0, 1fr); }
  .ft__split { gap: 40px; }
}
`;
