import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import { PLANT_MARKS } from "@/components/shopping/borderMarks";
import Horizon from "./Horizon";
import PhoneDemo from "./PhoneDemo";

/**
 * The stops on the evening round, in walking order. Each is one band of flat
 * colour that owns one truth about the garden; the planting on its ground
 * line is the boundary with the next. Everything shown inside a white sheet
 * is an illustration of the app with example content, and says so.
 *
 * Styles: styles/pages/_home.scss.
 */

/* ── 4 pm · the garden ───────────────────────────────────────────────── */

export function Garden() {
  return (
    <section id="garden" className="c-walk__band is-lime c-walk-garden">
      <header className="c-walk__wrap c-walk-garden__head">
        <Wordmark className="c-walk-garden__wordmark" />
        <div className="c-walk-garden__links">
          <Link href="/auth/login" className="c-walk__link">
            Log in
          </Link>
          <a href="#gate" className="c-walk__button is-quiet">
            Request access
          </a>
        </div>
      </header>

      <div className="c-walk__wrap c-walk-garden__body">
        <div className="c-walk-garden__copy">
          <h1 className="c-walk__display">
            Every plant you grow, and what this week holds for it.
          </h1>
          <p className="c-walk__lead">
            Plotted is a companion for your own garden. Tell it what you grow and it keeps
            the record, watches the weather where you are, and shows you what is coming
            into flower, what would go with what, and what to buy next.
          </p>
          <div className="c-walk-garden__action">
            <a href="#gate" className="c-walk__button">
              Request access
            </a>
            <p className="c-walk__aside">A private beta. We are inviting gardeners a few at a time.</p>
          </div>
        </div>

        <figure className="c-walk-garden__photo">
          <div className="c-walk__window">
            <Image
              src="/garden-hero-1.jpg"
              alt="Lime-green euphorbia and a wine-red cotinus under a bright May sky"
              fill
              sizes="(max-width: 860px) 100vw, 42vw"
              quality={70}
              priority
            />
          </div>
          <figcaption className="c-walk__caption">Euphorbia and cotinus on a May afternoon</figcaption>
        </figure>
      </div>

      <Horizon
        seed={7}
        blooms={["#fff", "#E26650", "#F3BADF", "#fff", "#82175D"]}
        visitors={[[20, "butterfly"]]}
        reach={0.6}
        immediate
      />
    </section>
  );
}

/* ── 5 pm · the catalogue ────────────────────────────────────────────── */

const THUMBS = [
  ["/demo-thumb-geum.jpg", "Geum"],
  ["/demo-thumb-fern.jpg", "Dryopteris"],
  ["/demo-thumb-digitalis.jpg", "Digitalis"],
  ["/demo-thumb-hosta.jpg", "Hosta"],
  ["/demo-thumb-firecracker.jpg", "Lysimachia"],
  ["/demo-thumb-thyme.jpg", "Thymus"],
  ["/demo-thumb-cola.jpg", "Artemisia"],
] as const;

export function Catalogue() {
  return (
    <section id="catalogue" className="c-walk__band is-sky c-walk-catalogue">
      <div className="c-walk__wrap c-walk-catalogue__body">
        <div className="c-walk-catalogue__copy">
          <h2 className="c-walk__heading">Name a plant. Plotted fills in the rest.</h2>
          <p className="c-walk__lead">
            Type a name, or take a photograph and let Plotted identify it. It looks up the
            common names, sun, flowering season, height and spread, and how much frost the
            plant will take, from UK growing knowledge. Starting a record costs you a few
            seconds.
          </p>

          <div className="c-walk-label" aria-label="Example of a looked-up plant">
            <p className="c-walk-label__typed">
              <span className="c-walk__mono">You type</span>
              digitalis
            </p>
            <p className="c-walk-label__name">
              <i>Digitalis purpurea</i>
            </p>
            <ul className="c-walk-label__traits">
              <li className="o-badge">Foxglove</li>
              <li className="o-badge is-partial-shade">Part shade</li>
              <li className="o-badge is-flowering-summer">Flowers Jun to Sep</li>
              <li className="o-badge is-british-native">British native</li>
              <li className="o-badge is-wildlife-friendly">Good for bees</li>
            </ul>
          </div>
        </div>

        <PhoneDemo />
      </div>

      <ul className="c-walk-catalogue__thumbs" aria-label="Plants from one garden">
        {THUMBS.map(([src, name], i) => (
          <li key={src} style={{ "--_i": i } as CSSProperties}>
            <Image src={src} alt="" width={220} height={220} sizes="(max-width: 860px) 30vw, 12vw" />
            <i>{name}</i>
          </li>
        ))}
      </ul>

      <Horizon seed={23} blooms={["#fff", "#F6B73C", "#F3BADF", "#DBE64A"]} />
    </section>
  );
}

/* ── 7 pm · this week ────────────────────────────────────────────────── */

const WEEK = [
  ["Mon", 0, 21, 11],
  ["Tue", 2, 22, 12],
  ["Wed", 3, 19, 12],
  ["Thu", 61, 17, 11],
  ["Fri", 80, 16, 9],
  ["Sat", 2, 18, 8],
  ["Sun", 0, 20, 10],
] as const;

const IN_FLOWER = [
  ["Digitalis purpurea", "Foxglove", "June to September", "#C86AA6"],
  ["Geum ‘Mrs Bradshaw’", "Avens", "May to August", "#E2452F"],
  ["Salvia ‘Caradonna’", "Balkan clary", "June to September", "#5B3FA0"],
] as const;

export function Week() {
  return (
    <section id="week" className="c-walk__band is-gold c-walk-week">
      <div className="c-walk__wrap c-walk-week__body">
        <div className="c-walk-week__copy">
          <h2 className="c-walk__heading">This week, in your garden.</h2>
          <p className="c-walk__lead">
            Set where your garden is, once. From then on Plotted reads the forecast against
            what you actually grow, so the week ahead is about your plants and not a
            weather map.
          </p>
        </div>

        <figure className="c-walk-week__photo">
          <div className="c-walk__window">
            <Image
              src="/garden-hero-2.jpg"
              alt="A stone path through a planted garden in low evening sun, foxgloves on either side"
              fill
              sizes="(max-width: 860px) 100vw, 56vw"
              quality={70}
            />
          </div>
          <figcaption className="c-walk__caption">The path at seven, late May</figcaption>
        </figure>

        <div className="c-walk__sheet c-walk-week__sheet">
          <div className="c-walk-week__forecast">
            <h3 className="c-walk__sheet-title">The week ahead</h3>
            <ol className="c-walk-week__days">
              {WEEK.map(([day, code, hi, lo]) => (
                <li key={day}>
                  <span className="c-walk__mono">{day}</span>
                  <WeatherIcon code={code} size={28} />
                  <span className="c-walk-week__hi">{hi}°</span>
                  <span className="c-walk-week__lo">{lo}°</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="c-walk-week__flower">
            <h3 className="c-walk__sheet-title">In flower in your garden</h3>
            <ul>
              {IN_FLOWER.map(([latin, common, season, colour]) => (
                <li key={latin}>
                  <span className="c-walk__dot" style={{ "--_bloom": colour } as CSSProperties} />
                  <span>
                    <b>
                      <i>{latin}</i>
                    </b>
                    <span className="c-walk-week__meta">
                      {common} · {season}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="c-walk__sheet-note">An example week. Yours is drawn from your own plants and location.</p>
        </div>
      </div>

      <Horizon seed={41} blooms={["#fff", "#E2452F", "#82175D", "#fff"]} visitors={[[27, "bird"]]} />
    </section>
  );
}

/* ── 8.30 pm · planting schemes ──────────────────────────────────────── */

const SCHEME = [
  ["Allium ‘Purple Sensation’", 5, 6, "#8E4FA8", 9],
  ["Salvia ‘Caradonna’", 6, 9, "#5B3FA0", 1],
  ["Achillea ‘Terracotta’", 6, 8, "#E08A3C", 5],
  ["Erigeron karvinskianus", 5, 10, "#F7E3EC", 12],
  ["Verbena bonariensis", 7, 10, "#B07CC6", 4],
  ["Stipa tenuissima", 6, 9, "#E6D08A", 14],
] as const;

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/* Where each plant stands along the example border, back to front. */
const SCHEME_BORDER = [
  [14, 2, 1.05],
  [9, 34, 1],
  [1, 62, 1],
  [4, 92, 1.05],
  [5, 124, 0.9],
  [9, 152, 0.92],
  [12, 180, 0.8],
  [14, 208, 0.95],
  [1, 236, 0.9],
] as const;

export function Schemes() {
  return (
    <section id="schemes" className="c-walk__band is-coral c-walk-schemes">
      <div className="c-walk__wrap c-walk-schemes__body">
        <div className="c-walk-schemes__copy">
          <h2 className="c-walk__heading">Ask what would go with what you have.</h2>
          <p className="c-walk__lead">
            Pick a few plants you already grow, or start with a bare bed, and talk it
            through. Plotted drafts a planting scheme and sets it out like a page from a
            good catalogue: the border drawn in elevation, the year in flower, how to
            arrange it, and the jobs month by month.
          </p>
          <div className="c-walk-schemes__talk" aria-label="Example conversation">
            <p className="is-you">A dry, sunny strip by the path. I already have the salvia.</p>
            <p className="is-plotted">
              Then build on its violet. Alliums before it, achillea beside it, and grasses to
              keep the border moving into autumn.
            </p>
          </div>
        </div>

        <article className="c-walk__sheet c-walk-schemes__sheet" aria-label="Example planting scheme">
          <h3 className="c-walk-schemes__title">A dry, sunny border</h3>
          <p className="c-walk-schemes__summary">Violet and rust from May, with grasses carrying it to October.</p>

          <svg className="c-walk-schemes__border" viewBox="0 14 280 66" aria-hidden="true">
            <path d="M0 78 H280" />
            {SCHEME_BORDER.map(([mark, x, scale], i) => (
              <g key={i} transform={`translate(${x} ${78 - 78 * scale}) scale(${scale})`}>
                {PLANT_MARKS[mark].paths.map((d, j) => (
                  <path key={j} d={d} />
                ))}
                {PLANT_MARKS[mark].dots.map((dot, j) => (
                  <circle
                    key={j}
                    cx={dot.cx}
                    cy={dot.cy}
                    r={dot.r * 1.3}
                    style={{ "--_bloom": SCHEME[i % SCHEME.length][3] } as CSSProperties}
                  />
                ))}
              </g>
            ))}
          </svg>

          <h4 className="c-walk__sheet-title">The year in flower</h4>
          <div className="c-walk-schemes__chart" role="img" aria-label="Flowering months for six plants, from May to October">
            <div className="c-walk-schemes__months">
              {MONTHS.map((m, i) => (
                <span key={i} className="c-walk__mono">
                  {m}
                </span>
              ))}
            </div>
            {SCHEME.map(([name, from, to, colour]) => (
              <div key={name} className="c-walk-schemes__row">
                <i>{name}</i>
                <div className="c-walk-schemes__track">
                  <span
                    style={{ gridColumn: `${from} / ${to + 1}`, "--_bloom": colour } as CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="c-walk__sheet-note">An example scheme, set out as Plotted sets out yours.</p>
        </article>
      </div>

      <Horizon seed={58} blooms={["#fff", "#82175D", "#F6B73C", "#5B3FA0"]} />
    </section>
  );
}

/* ── 9.15 pm · the shopping list ─────────────────────────────────────── */

export function List() {
  return (
    <section id="list" className="c-walk__band is-mulberry c-walk-list">
      <div className="c-walk__wrap c-walk-list__body">
        <div className="c-walk-list__copy">
          <h2 className="c-walk__heading">The name of that plant you saw.</h2>
          <p className="c-walk__lead">
            Type or dictate whatever you can remember of it. Plotted works out the proper
            name, adds a line about the plant and a picture when there is one, and offers
            you choices when it isn’t sure. Mark it as bought and it goes straight into
            your garden.
          </p>
        </div>

        <ol className="c-walk-list__notes" aria-label="Examples of notes and what Plotted makes of them">
          <li>
            <p className="c-walk-list__said">“that purple salvia at the show”</p>
            <div className="c-walk__sheet c-walk-list__entry">
              <h3>
                <i>Salvia nemorosa</i> ‘Caradonna’
              </h3>
              <p className="c-walk-list__names">
                <span className="o-badge">Balkan clary</span>
              </p>
              <p>Upright violet spikes on near-black stems, from June. Full sun, and loved by bees.</p>
            </div>
          </li>
          <li>
            <p className="c-walk-list__said">“the little daisy on the steps”</p>
            <div className="c-walk__sheet c-walk-list__entry">
              <h3>
                <i>Erigeron karvinskianus</i>
              </h3>
              <p className="c-walk-list__names">
                <span className="o-badge">Mexican fleabane</span>
              </p>
              <p>Small daisies that open white and fade pink, seeding into walls and paving.</p>
            </div>
          </li>
          <li>
            <p className="c-walk-list__said">“steeper ten you is ima”</p>
            <div className="c-walk__sheet c-walk-list__entry is-unsure">
              <p className="c-walk__mono">It might be</p>
              <ul>
                <li>Keep as typed</li>
                <li className="is-likely">
                  <i>Stipa tenuissima</i>
                  <span>Mexican feather grass</span>
                </li>
              </ul>
            </div>
          </li>
        </ol>
      </div>

      <Horizon seed={77} blooms={["#F8D6EC", "#F6B73C", "#fff", "#F28D7C"]} />
    </section>
  );
}

/* ── 9.45 pm · visitors ──────────────────────────────────────────────── */

const BIRDS = [
  ["robin", "Robin", true],
  ["blackbird", "Blackbird", true],
  ["blue-tit", "Blue tit", true],
  ["wren", "Wren", false],
  ["goldfinch", "Goldfinch", true],
  ["sparrow", "House sparrow", true],
  ["starling", "Starling", false],
  ["thrush", "Song thrush", false],
  ["chaffinch", "Chaffinch", true],
  ["magpie", "Magpie", true],
  ["pigeon", "Woodpigeon", false],
  ["crow", "Crow", false],
] as const;

export function Visitors() {
  return (
    <section id="visitors" className="c-walk__band is-indigo c-walk-visitors">
      <div className="c-walk__wrap c-walk-visitors__body">
        <figure className="c-walk-visitors__photo">
          <div className="c-walk__window">
            <Image
              src="/garden-hero-3.jpg"
              alt="The bottom of a garden at dusk, a single bird on the wire against a pink sky"
              fill
              sizes="(max-width: 860px) 100vw, 40vw"
              quality={70}
            />
          </div>
          <figcaption className="c-walk__caption">One on the wire, a quarter to ten in July</figcaption>
        </figure>

        <div className="c-walk-visitors__copy">
          <h2 className="c-walk__heading">And who came by.</h2>
          <p className="c-walk__lead">
            Twelve garden birds worth knowing by sight. Tick each one off the first time
            you see it in your own garden. It is a small collection to complete, not a
            score to keep.
          </p>
          <ul className="c-walk-visitors__birds" aria-label="Twelve garden birds, seven marked as spotted in this example">
            {BIRDS.map(([file, name, spotted]) => (
              <li key={file} className={spotted ? "is-spotted" : undefined}>
                <span className="c-walk-visitors__portrait">
                  <Image src={`/birds/${file}.webp`} alt="" width={120} height={120} />
                </span>
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Horizon
        seed={91}
        blooms={["#F6B73C", "#F8D6EC", "#F6B73C"]}
        visitors={[
          [19, "bird"],
          [28, "bird"],
        ]}
      />
    </section>
  );
}
