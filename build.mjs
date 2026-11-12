// Static site generator for noworriesfix.com. No dependencies: `node build.mjs` writes ./dist
import { mkdirSync, writeFileSync, copyFileSync, cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const SITE = "https://noworriesfix.com";
const BIZ = {
  name: "No Worries Home Improvements",
  phone: "(571) 354-0654",
  tel: "+15713540654",
  email: "noworries.1llc@gmail.com",
  hours: "Mon–Sat, 8am–6pm",
};
// Public Airtable form (Lead Intake). Confirm this matches the URL Airtable shows after you publish the form.
const QUOTE_FORM_URL = "https://airtable.com/app6notXDAuIhLpEG/pagMX8QI9t0Zwm3r5/form";
const GA_ID = "G-7J7M54ZLW0";

const SMS = `sms:${BIZ.tel}?&body=${encodeURIComponent("Hi, I'd like a flat-price quote. Photos attached:")}`;
const TEL = `tel:${BIZ.tel}`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const AREA_CITIES = ["Fredericksburg", "Stafford", "Spotsylvania", "King George", "Caroline County"];

const orgSchema = {
  "@type": "HomeAndConstructionBusiness",
  "@id": `${SITE}/#business`,
  name: BIZ.name,
  url: SITE,
  telephone: "+1-571-354-0654",
  email: BIZ.email,
  image: `${SITE}/og-image.png`,
  logo: `${SITE}/favicon.svg`,
  priceRange: "$$",
  address: { "@type": "PostalAddress", addressLocality: "Fredericksburg", addressRegion: "VA", postalCode: "22405", addressCountry: "US" },
  areaServed: AREA_CITIES.map((c) => ({ "@type": c.includes("County") ? "AdministrativeArea" : "City", name: `${c}, VA` })),
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00", closes: "18:00",
  }],
};

const NAV = [
  ["/", "Home"], ["/services", "Services"], ["/landlords", "Landlords"],
  ["/service-areas/fredericksburg-va", "Service Area"], ["/about", "About"], ["/get-a-quote", "Get a Quote"],
];

function head({ path, title, description, schema = [], styles = '<link rel="stylesheet" href="/styles.css">' }) {
  const canonical = SITE + (path === "/" ? "/" : path);
  const ld = { "@context": "https://schema.org", "@graph": [orgSchema, ...schema] };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BIZ.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${styles}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>
</head>`;
}

function layout({ path, title, description, body, schema = [] }) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${href === path ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `${head({ path, title, description, schema })}
<body>
<a class="skip" href="#main">Skip to main content</a>
<header class="site"><div class="wrap">
  <a class="logo" href="/">NO WORRIES<small>HOME IMPROVEMENTS</small></a>
  <nav class="main" aria-label="Main">${nav}<a class="phone" href="${TEL}">${BIZ.phone}</a></nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site"><div class="wrap">
  <div class="cols">
    <div><strong>${BIZ.name}</strong><p>Flat-price handyman work from a photo. Based in Fredericksburg, VA.</p></div>
    <div><strong>Contact</strong><ul>
      <li><a href="${TEL}">Call ${BIZ.phone}</a></li>
      <li><a href="${SMS}">Text a photo</a></li>
      <li><a href="mailto:${BIZ.email}">${BIZ.email}</a></li>
      <li>${BIZ.hours}</li></ul></div>
    <div><strong>Pages</strong><ul>
      <li><a href="/services">Services &amp; prices</a></li>
      <li><a href="/tv-mounting-fredericksburg-va">TV mounting</a></li>
      <li><a href="/landlords">Landlords &amp; property managers</a></li>
      <li><a href="/get-a-quote">Get a photo quote</a></li></ul></div>
    <div><strong>Areas</strong><ul>
      <li><a href="/service-areas/fredericksburg-va">Fredericksburg &amp; Stafford</a></li>
      <li><a href="/service-areas/northern-virginia">Northern Virginia</a></li>
      <li><a href="/service-areas/washington-dc">Washington, DC</a></li></ul></div>
  </div>
  <p class="fine">© ${new Date().getFullYear()} ${BIZ.name}. <a href="/privacy-policy">Privacy policy</a></p>
</div></footer>
<div class="sticky-bar" role="navigation" aria-label="Quick contact">
  <a class="btn btn-ghost" style="color:#fff" href="${TEL}">Call</a>
  <a class="btn btn-primary" href="${SMS}">Text a photo</a>
</div>
</body>
</html>`;
}

const ctaButtons = (extra = "") => `<div class="btn-row ${extra}">
  <a class="btn btn-primary" href="${SMS}">Text a photo</a>
  <a class="btn btn-ghost" href="${TEL}">Call ${BIZ.phone}</a>
  <a class="btn btn-ghost" href="/get-a-quote">Upload photos online</a>
</div>`;

const ctaBand = (h = "Send the photo. Get the price. Decide from there.") => `<section class="cta-band"><div class="wrap">
  <h2>${h}</h2>
  <p>It takes thirty seconds and costs nothing. Worst case, you find out what the job actually costs.</p>
  ${ctaButtons()}
</div></section>`;

const SERVICES = [
  { name: "TV mounting", price: "From $150 per TV", note: "Stud-mounted, level, cords tidied. Brick, concrete or plaster wall +$50. In-wall cable concealment +$75." },
  { name: "Furniture & console assembly", price: "From $95 per piece", note: "Beds, dressers, desks, TV stands. Solid or heavy (not flat-pack) furniture +$60." },
  { name: "Trim, baseboard & drywall patch", price: "From $120 per patch", note: "Holes, dents and damaged trim. Paint match +$40." },
  { name: "Blinds installation", price: "From $40 per window", note: "Patio slider vertical +$85. Take-down of old blinds +$10 per window." },
];
const OTHER_WORK = ["Interior painting", "Light fixture & ceiling fan swaps", "Shelves, mirrors & art hanging", "Faucet & toilet swaps", "Hauling & junk removal", "Punch lists & turnover work", "Smart doorbells & thermostats", "Pressure washing"];

const FAQ = [
  ["How accurate is a photo quote?", "For most small jobs, very. A wide shot plus a close-up usually tells us everything. If we can't price it from photos, we'll say so instead of guessing."],
  ["What if the job is bigger than the photo showed?", "We stop, photograph it, and quote the extra before doing anything. You decide. You never get a surprise on the invoice."],
  ["Do you charge for quotes?", "No. Photo quotes are free and there's no obligation."],
  ["Do you bring the hardware?", "Standard mounting hardware is included with installs. If a job needs special parts, they're listed in your quote before you approve."],
  ["Is there a minimum?", "Yes: $95 per visit, which is also the price of our smallest standard job. Anything below that is quoted at $95."],
  ["Do you do multiple jobs in one visit?", "Yes, and it's cheaper. Two services get 8% off the base prices; three or more get 11% off."],
  ["What hours do you work?", `${BIZ.hours}. Send photos anytime and we'll reply during business hours.`],
  ["Where do you work?", "Fredericksburg, Stafford, Spotsylvania, King George and Caroline County. Northern Virginia and DC by quote; any travel charge is included in your flat price before you approve."],
];

const faqSchema = { "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
const faqHtml = FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n");

const pages = {};

// Homepage: a scroll-driven page with its own chrome (no shared header/footer).
// Markup lives here; styles, script and images live in src/home/. The engine
// (src/home/scrollcraft.*) is vendored from nateherkai/scroll-craft, MIT.
const HOME_SMS = `sms:${BIZ.tel}?&body=${encodeURIComponent("Hi, I'd like a flat-price quote for TV mounting. Photos attached:")}`;
// One entry per SERVICES row, same order. `amount` is the example the price tag shows.
const HOME_JOBS = [
  { img: "job-tv.jpg", h: 880, alt: "A TV mounted level on a slate-blue wall above an oak console.", job: "TV mounting", amount: 150, line: "TV mounting, one TV", cta: "Put it on the tag" },
  { img: "job-assembly.jpg", h: 1000, alt: "A half-assembled oak dresser on a bedroom floor with its last drawer beside it.", job: "Furniture assembly", amount: 95, line: "Furniture assembly, one piece", cta: "Put it on the tag" },
  { img: "job-patch.jpg", h: 1000, alt: "A freshly filled and sanded drywall patch on a blue wall, putty knife resting on the baseboard.", job: "Drywall patch", amount: 120, line: "Drywall patch, one patch", cta: "Put it on the tag" },
  // One window is under the $95 visit minimum, so the example prices three.
  { img: "job-blinds.jpg", h: 1000, alt: "New white blinds half lowered in a window at dusk.", job: "Blinds, 3 windows", amount: 120, line: "Blinds, three windows at $40", cta: "Put 3 windows on the tag" },
];
const homeJobs = SERVICES.map((s, i) => {
  const j = HOME_JOBS[i];
  return `        <article class="nw-job">
          <div class="nw-job__img"><img src="/home/img/${j.img}" width="800" height="${j.h}" alt="${esc(j.alt)}" loading="lazy"></div>
          <h3>${esc(s.name)}</h3>
          <p class="nw-job__price">${esc(s.price)}</p>
          <p class="nw-job__note">${esc(s.note)}</p>
          <button class="nw-pick" type="button" aria-pressed="${i === 0}" data-nw-pick data-job="${esc(j.job)}" data-amount="${j.amount}" data-line="${esc(j.line)}" data-idle="${esc(j.cta)}">${i === 0 ? "On the tag" : esc(j.cta)}</button>
        </article>`;
}).join("\n");
// [href, label, what the index sheet prints at the end of the line]
const HOME_LINKS = [
  ["/services", "Services &amp; prices", "every job"],
  ["/tv-mounting-fredericksburg-va", "TV mounting", SERVICES[0].price.replace(/ per .*/, "").toLowerCase()],
  ["/landlords", "Landlords", "approve by text"],
  ["/service-areas/fredericksburg-va", "Fredericksburg &amp; Stafford", "home base"],
  ["/service-areas/northern-virginia", "Northern Virginia", "by quote"],
  ["/service-areas/washington-dc", "Washington, DC", "by quote"],
  ["/about", "About", "who shows up"],
  ["/get-a-quote", "Upload photos online", "free"],
];
const HOME_JUMPS = [["#how", "How it works"], ["#prices", "Prices"], ["#terms", "The fine print"], ["#invoice", "The invoice"]];

pages["/"] = `${head({
  path: "/",
  title: "Flat-Price Handyman in Fredericksburg, VA | No Worries",
  description: "Text a photo, get one flat price back, usually the same day. TV mounting, assembly, drywall and more in Fredericksburg, Stafford & Spotsylvania.",
  schema: [faqSchema],
  styles: '<link rel="preload" as="image" href="/home/img/wall-before.jpg">\n<link rel="stylesheet" href="/home/scrollcraft.css">\n<link rel="stylesheet" href="/home/home.css">',
})}
<body>

<a class="nw-skip" href="#main">Skip to main content</a>

<header class="nw-bar">
  <a class="nw-mark" href="/" aria-label="No Worries Home Improvements, top of page">No Worries<small>Home Improvements</small></a>
  <div class="nw-bar__right">
    <a class="nw-link nw-bar__tel" href="${TEL}">${BIZ.phone}</a>
    <a class="nw-menu-open" href="#pages" aria-haspopup="dialog" data-nw-menu-open><i aria-hidden="true"></i>Menu</a>
    <a class="nw-btn" data-nw-sms href="${HOME_SMS}">Text a photo</a>
  </div>
</header>

<!-- The index: the site's pages printed as a sheet from the invoice book.
     Without JavaScript the Menu link jumps to the same links in the page. -->
<dialog class="nw-menu" aria-labelledby="nw-menu-title" data-nw-menu>
  <div class="nw-sheet">
    <header>
      <strong>No Worries<br>Home Improvements</strong>
      <span id="nw-menu-title">Index</span>
      <button class="nw-sheet__x" type="button" data-nw-menu-close>Close</button>
    </header>
    <ol class="nw-lines">
      ${HOME_LINKS.map(([href, label, detail], i) => `<li style="--i:${i}"><a href="${href}"><span class="nw-lines__l">${label}</span><span class="nw-lines__dots" aria-hidden="true"></span><span class="nw-lines__d">${detail}</span></a></li>`).join("\n      ")}
    </ol>
    <p class="nw-sheet__jump" style="--i:${HOME_LINKS.length}"><span>On this page</span>${HOME_JUMPS.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</p>
    <div class="nw-sheet__total" style="--i:${HOME_LINKS.length + 1}">
      <span>Fastest way to a price</span>
      <a class="nw-btn" data-nw-sms href="${HOME_SMS}">Text a photo</a>
    </div>
    <small style="--i:${HOME_LINKS.length + 2}"><a href="${TEL}">${BIZ.phone}</a> · ${BIZ.hours}</small>
  </div>
</dialog>

<!-- The held price. Decorative duplicate of figures that exist as real text in
     the rail and the invoice, so it is hidden from assistive tech. -->
<div class="nw-tag" data-nw-tag aria-hidden="true">
  <div class="nw-tag__body">
    <span class="nw-tag__k" data-nw-status>Example quote</span>
    <span class="nw-tag__v" data-nw-amount>$150</span>
    <span class="nw-tag__j" data-nw-jobname>TV mounting</span>
  </div>
</div>

<main id="main">
  <span id="top"></span>

  <!-- 1 · RECOGNITION: layered hero -->
  <section class="nw-hero" data-sc-act="pin" data-sc-span="2.2" data-nw-status="Example quote">
    <div data-sc-stage>
      <img class="nw-plane nw-plane--wall" src="/home/img/wall-before.jpg" width="2200" height="1228" alt="A living room in the evening. A new TV still in its box leans against a slate-blue wall beside a lamp-lit console, with the wall mount lying unopened on top.">
      <div class="nw-bloom" aria-hidden="true"></div>
      <div class="nw-hero__scrim" aria-hidden="true"></div>
      <img class="nw-plane nw-plane--bag" src="/home/img/toolbag.png" width="560" height="546" alt="">
      <img class="nw-plane nw-plane--phone" src="/home/img/phone.png" width="480" height="798" alt="">

      <div class="nw-hero__copy" data-sc-cue="0 0.46 0 0.35">
        <h1 class="sc-display sc-display--xl">Text us a photo. Get a flat price today.</h1>
        <p class="sc-lede">And that's the price you pay. You'll have the number in writing before anyone sets foot in your house.</p>
        <div class="nw-actions">
          <a class="nw-btn" data-nw-sms href="${HOME_SMS}">Text a photo</a>
          <a class="nw-link" href="${TEL}">Call ${BIZ.phone}</a>
        </div>
      </div>

      <div class="nw-hero__beat" data-sc-cue="0.54 1 0.14 0.03">
        <p class="sc-display sc-display--md">It takes thirty seconds. Bad lighting is fine.</p>
        <p class="sc-body">No site visit. No hourly meter. No three-day wait for a callback.</p>
      </div>
    </div>
  </section>

  <!-- 2 · EASE: three lines cross over -->
  <section class="nw-steps" id="how" data-sc-act="pin" data-sc-span="3" data-nw-status="Photo quote">
    <div data-sc-stage>
      <div class="nw-steps__grid">
        <figure class="nw-print">
          <img src="/home/img/wall-before.jpg" width="2200" height="1228" alt="" loading="lazy">
          <figcaption>The photo you sent</figcaption>
        </figure>
        <div class="nw-steps__copy">
          <h2 data-sc-cue="0 1 0 0">A price, without anyone coming out</h2>
          <div class="nw-step" data-sc-cue="0 0.35 0 0.2">
            <p class="sc-display sc-display--lg">Send a photo.</p>
            <p class="sc-lede">Text ${BIZ.phone} or upload online. One wide shot and one close-up usually tell us everything.</p>
          </div>
          <div class="nw-step" data-sc-cue="0.33 0.68 0.2 0.2">
            <p class="sc-display sc-display--lg" data-sc-kinetic="lines">Get a flat price back.</p>
            <p class="sc-lede">In writing, usually the same day. One number. Not a range, not an estimate, not a "starting at."</p>
          </div>
          <div class="nw-step" data-sc-cue="0.66 1 0.2 0">
            <p class="sc-display sc-display--lg">We show up and do the work.</p>
            <p class="sc-lede">${BIZ.hours}. Standard mounting hardware is included with installs. You pay the number you were quoted.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 · DOUBT: the one part that reads like a document -->
  <section class="sc-section nw-doubt" data-sc-act="flow" data-nw-status="Held. Your call">
    <div class="sc-wrap">
      <figure data-sc-in>
        <img src="/home/img/behind-wall.jpg" width="1500" height="1125" alt="A torch held up to a neat inspection hole in drywall, lighting an old water stain on the stud behind it." loading="lazy">
      </figure>
      <div data-sc-in data-sc-stagger="70">
        <h2 class="sc-display sc-display--lg">What if there's a surprise behind the wall?</h2>
        <p class="sc-lede">The price changes for two reasons only, and you approve both before any extra work happens. You never get a surprise on the invoice.</p>
        <ul class="nw-excepts">
          <li><strong>You add work.</strong> A different job gets its own price, quoted the same way.</li>
          <li><strong>Something was hidden.</strong> Rot behind the tile, an old leak in the wall. We stop, send you a photo and quote the extra. You decide whether we keep going.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- 4 · PAYOFF: a wipe is a change of state -->
  <section class="nw-wipe" data-sc-act="pin" data-sc-span="2.2" data-nw-status="Done. Same price">
    <div data-sc-stage>
      <img src="/home/img/wall-before.jpg" width="2200" height="1228" alt="" loading="lazy">
      <figure data-sc-reveal="right" data-sc-reveal-at="0.08 0.52">
        <img src="/home/img/wall-after.jpg" width="2200" height="1228" alt="The same wall afterwards: the TV is mounted level above the console, the boxes and cables are gone." loading="lazy">
      </figure>
      <div class="nw-wipe__level" aria-hidden="true"></div>
      <div class="nw-wipe__scrim" aria-hidden="true"></div>
      <div class="sc-copy sc-copy--lead" data-sc-cue="0.46 1 0.16 0.03">
        <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">The price doesn't move.</h2>
        <p class="sc-lede">Mounted to the studs, level, cords tidied. The job matched the photo, so the price is the one we sent you.</p>
      </div>
    </div>
  </section>

  <!-- 5 · RANGE: lateral travel reads as options -->
  <section class="nw-range" id="prices" data-sc-act="pan" data-sc-span="2.4" data-nw-status="Pick a job">
    <div data-sc-stage>
      <div class="nw-rail" data-sc-pan="0.04">
        <div class="nw-rail__lead">
          <h2 class="sc-display sc-display--lg">What we fix</h2>
          <p class="sc-body">Starting prices for the jobs we do most. Put one on the tag and it carries that price all the way to the invoice.</p>
        </div>

${homeJobs}

        <div class="nw-rail__note">
          <h3>Also on the list</h3>
          <ul>${OTHER_WORK.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
          <p><strong>Not sure if it's on the list? Send the photo anyway.</strong> If we can't do it, we'll tell you who can.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 6 · TERMS: authored quiet before the peak -->
  <section class="sc-section nw-terms" id="terms" data-sc-act="flow" data-nw-status="Flat price">
    <div class="sc-wrap">
      <div class="nw-terms__top">
        <div data-sc-in data-sc-stagger="60">
          <h2 class="sc-display sc-display--lg">The number we quote is the number on your invoice.</h2>
          <p class="sc-body">Not "about." Not "plus materials." Not "depending on what we find." Two exceptions, and you approve both before any extra work happens, not after. That's the whole policy.</p>
        </div>
        <dl class="nw-facts" data-sc-in data-sc-stagger="50">
          <div><dt>Managing properties? You don't need to be there.</dt><dd>Your tenant texts us the photo. We quote you the flat price. You approve by text. One invoice, one point of contact, photos when it's done.</dd></div>
          <div><dt>Where we work</dt><dd>Fredericksburg, Stafford, Spotsylvania, King George and Caroline County. Northern Virginia and DC by quote.</dd></div>
          <div><dt>More than one job</dt><dd>Two services get 8% off the base prices; three or more get 11% off. The minimum visit is $95.</dd></div>
        </dl>
      </div>

      <div class="nw-faq" data-sc-in>
        <h3>Questions people ask before they text</h3>
        ${faqHtml}
      </div>

      <nav class="nw-pages" id="pages" aria-label="Site pages" data-sc-in>
        ${HOME_LINKS.map(([href, label]) => `<a class="nw-link" href="${href}">${label}</a>`).join("")}
      </nav>
    </div>
  </section>

  <!-- 7 · COMMITMENT: the tag lands on the invoice. Last element on the page. -->
  <section class="nw-close" id="invoice" data-sc-act="pin" data-sc-span="2.6" data-nw-status="Total due">
    <div data-sc-stage>
      <div class="nw-close__grid">
        <div class="nw-close__copy">
          <div class="nw-close__pre" data-sc-cue="0 0.48 0 0.25">
            <p class="sc-display sc-display--lg">Then the invoice arrives.</p>
            <p class="sc-lede">One line is still blank.</p>
          </div>
          <div class="nw-close__main">
            <h2 class="sc-display sc-display--lg" data-sc-cue="0.6">Send the photo. Get the price. Decide from there.</h2>
            <p class="sc-lede" data-sc-cue="0.64">It takes thirty seconds and costs nothing. Worst case, you find out what the job actually costs.</p>
            <div class="nw-actions" data-sc-cue="0.64" data-sc-rise="0">
              <a class="nw-btn" data-nw-sms href="${HOME_SMS}">Text a photo</a>
              <a class="nw-link" href="${TEL}">Call ${BIZ.phone}</a>
              <a class="nw-link" href="/get-a-quote">Upload photos online</a>
            </div>
          </div>
        </div>

        <article class="nw-invoice" aria-label="Example invoice">
          <header><strong>No Worries<br>Home Improvements</strong><span>Example invoice</span></header>
          <dl>
            <div><dt>Job</dt><dd data-nw-line>TV mounting, one TV</dd></div>
            <div><dt>Quoted</dt><dd>From your photo, in writing</dd></div>
            <div><dt>Changes on site</dt><dd>None. Job matched the photo.</dd></div>
          </dl>
          <div class="nw-invoice__total">
            <span>Total due</span>
            <div class="nw-slot" data-nw-slot><span class="nw-sr" data-nw-total>$150, the same as quoted</span></div>
          </div>
          <small>Example at a starting price. Your photo quote is one flat number for your job.</small>
        </article>
      </div>

      <footer class="nw-foot">
        <span>© ${new Date().getFullYear()} No Worries Home Improvements. Flat-price handyman work from a photo. Fredericksburg, VA.</span>
        <span>${BIZ.hours}</span>
        <span><a href="mailto:${BIZ.email}">${BIZ.email}</a> · <a href="/privacy-policy">Privacy policy</a></span>
      </footer>
    </div>
  </section>

</main>
<script src="/home/scrollcraft.js"></script>
<script src="/home/home.js"></script>
</body>
</html>`;

pages["/services"] = layout({
  path: "/services",
  title: "Handyman Services & Prices | No Worries, Fredericksburg VA",
  description: "Starting prices for TV mounting, furniture assembly, drywall patches and blinds. Bundle discounts on multi-job visits. Text a photo for one flat price.",
  body: `<section class="hero"><div class="wrap">
  <h1>Services &amp; starting prices</h1>
  <p class="lead">Every job gets one flat price from your photos. These are where common jobs start.</p>
  ${ctaButtons()}
</div></section>
<section><div class="wrap">
  <table class="prices">
    <thead><tr><th>Service</th><th>Starts at</th><th>Common add-ons</th></tr></thead>
    <tbody>
      <tr><td>TV mounting</td><td>$150 per TV</td><td>Brick/concrete/plaster wall +$50 · In-wall cable concealment +$75</td></tr>
      <tr><td>Furniture / console assembly</td><td>$95 per piece</td><td>Solid or heavy furniture (not flat-pack) +$60</td></tr>
      <tr><td>Trim / baseboard / drywall patch</td><td>$120 per patch</td><td>Paint match +$40</td></tr>
      <tr><td>Blinds installation</td><td>$40 per window</td><td>Patio slider vertical +$85 · Tile/stone surround +$15 · High or stairwell window +$15 · Take down old blinds +$10 · Haul away +$45 per visit</td></tr>
    </tbody>
  </table>
  <p class="prose" style="margin-top:14px"><strong>Visit minimum: $95.</strong> Smaller jobs are quoted at the minimum, never turned away.</p>
  <h2 style="margin-top:40px">Bundle and save</h2>
  <p class="prose">Two services in one visit: 8% off the base prices. Three or more: 11% off. Add-ons are never discounted. Example: TV mount + dresser assembly + trim patch is $365 separately, <strong>$325 together</strong>.</p>
  <h2 style="margin-top:40px">Other work we quote from photos</h2>
  <ul class="tags">${OTHER_WORK.map((w) => `<li>${w}</li>`).join("")}</ul>
  <p class="prose">Send a photo of anything else. If it isn't something we do, we'll say so and point you to someone who does.</p>
</div></section>
${ctaBand()}`,
});

pages["/tv-mounting-fredericksburg-va"] = layout({
  path: "/tv-mounting-fredericksburg-va",
  title: "TV Mounting in Fredericksburg, VA from $150 | No Worries",
  description: "Stud-mounted, level TV installs in Fredericksburg, Stafford and Spotsylvania. From $150 per TV. Text a photo of your TV and wall for a flat price.",
  schema: [{
    "@type": "Service", name: "TV mounting", serviceType: "TV wall mounting",
    provider: { "@id": `${SITE}/#business` },
    areaServed: AREA_CITIES.map((c) => `${c}, VA`),
    offers: { "@type": "Offer", price: "150", priceCurrency: "USD", description: "Starting price per TV, standard drywall install" },
  }],
  body: `<section class="hero"><div class="wrap">
  <h1>TV mounting in Fredericksburg, VA, from $150</h1>
  <p class="lead">Text a photo of the TV and the wall. You'll get one flat price back, usually the same day.</p>
  ${ctaButtons()}
</div></section>
<section><div class="wrap">
  <div class="grid">
    <div class="card"><h3>Standard install</h3><div class="price">$150 per TV</div><p>Mounted into studs on drywall, leveled, cords tidied.</p></div>
    <div class="card"><h3>Brick, concrete or plaster</h3><div class="price">+$50</div><p>Masonry anchors and the right bits for harder walls, including above fireplaces.</p></div>
    <div class="card"><h3>Hide the wires</h3><div class="price">+$75</div><p>In-wall cable concealment so no cords hang below the screen.</p></div>
  </div>
  <h2 style="margin-top:40px">What to send for a fast quote</h2>
  <ul class="prose">
    <li>A photo of the wall where the TV goes (step back so we can see the whole wall)</li>
    <li>TV size, and the mount if you already have one</li>
    <li>Whether you want the wires hidden</li>
  </ul>
  <p class="prose">Mounting a TV plus another job in the same visit? Two services get 8% off; three or more get 11% off.</p>
</div></section>
${ctaBand("Need your TV up this week? Send the photo.")}`,
});

pages["/landlords"] = layout({
  path: "/landlords",
  title: "Handyman for Landlords & Property Managers | Fredericksburg VA",
  description: "Turnovers, punch lists and tenant repairs across Fredericksburg, Stafford and Spotsylvania. Flat price per job from tenant photos. Approve by text.",
  body: `<section class="hero"><div class="wrap">
  <h1>Managing properties? You don't need to be there.</h1>
  <p class="lead">Your tenant texts us the photo. We quote you the flat price. You approve by text. We coordinate access, do the work, and send you photos when it's done.</p>
  ${ctaButtons()}
</div></section>
<section><div class="wrap">
  <div class="grid">
    <div class="card"><h3>Turnovers &amp; punch lists</h3><p>Patch, paint touch-ups, blinds, fixtures, hardware: one visit, one invoice.</p></div>
    <div class="card"><h3>Tenant repair requests</h3><p>Tenants send photos straight to us. You see the price before anyone is dispatched.</p></div>
    <div class="card"><h3>Multiple properties</h3><p>One point of contact across your doors, with before/after photos for your records.</p></div>
  </div>
  <p class="prose" style="margin-top:28px">Text "PM" to ${BIZ.phone} with your portfolio size and the areas you cover, and we'll set up how approvals and access work for you.</p>
</div></section>
${ctaBand()}`,
});

const areaPage = ({ path, name, title, description, h1, intro, places, note }) => layout({
  path, title, description,
  body: `<section class="hero"><div class="wrap">
  <h1>${h1}</h1>
  <p class="lead">${intro}</p>
  ${ctaButtons()}
</div></section>
<section><div class="wrap">
  <h2>Areas we cover${name ? ` near ${name}` : ""}</h2>
  <ul class="tags">${places.map((p) => `<li>${p}</li>`).join("")}</ul>
  ${note ? `<p class="note prose" style="margin-top:20px">${note}</p>` : ""}
  <h2 style="margin-top:40px">Popular jobs</h2>
  <div class="grid">${SERVICES.map((s) => `<div class="card"><h3>${s.name}</h3><div class="price">${s.price}</div></div>`).join("")}</div>
</div></section>
${ctaBand()}`,
});

pages["/service-areas/fredericksburg-va"] = areaPage({
  path: "/service-areas/fredericksburg-va", name: "Fredericksburg",
  title: "Handyman in Fredericksburg, Stafford & Spotsylvania, VA",
  description: "Fredericksburg-based handyman. Flat price from a photo for TV mounting, assembly, drywall and more across Stafford, Spotsylvania, King George and Caroline.",
  h1: "Fredericksburg's flat-price handyman",
  intro: "Based in Fredericksburg. Text a photo of the job and get one flat price back, usually the same day.",
  places: ["Downtown Fredericksburg", "Stafford", "Falmouth", "Spotsylvania", "Massaponax", "King George", "Caroline County", "Lake Anna"],
});
pages["/service-areas/northern-virginia"] = areaPage({
  path: "/service-areas/northern-virginia", name: "",
  title: "Handyman Jobs in Northern Virginia by Photo Quote | No Worries",
  description: "Fredericksburg-based handyman taking Northern Virginia jobs by photo quote. Any travel charge is built into one flat price before you approve.",
  h1: "Northern Virginia jobs, quoted from a photo",
  intro: "We're based in Fredericksburg and take Northern Virginia jobs case by case. Send the photo and your ZIP; you'll get one flat price that already includes any travel.",
  places: ["Stafford / Quantico", "Woodbridge", "Dumfries", "Lorton", "Springfield", "Alexandria", "Fairfax"],
  note: "Larger or multi-task jobs are the best fit this far out. If the trip doesn't make sense for a small job, we'll tell you upfront.",
});
pages["/service-areas/washington-dc"] = areaPage({
  path: "/service-areas/washington-dc", name: "",
  title: "Handyman Jobs in Washington, DC by Photo Quote | No Worries",
  description: "Washington, DC handyman jobs quoted from photos by a Fredericksburg-based team. One flat price, travel included, before any work starts.",
  h1: "Washington, DC jobs, quoted from a photo",
  intro: "DC is outside our home base, so we take jobs here by quote. Send photos and your address; the flat price we send includes any travel.",
  places: ["Capitol Hill", "Navy Yard", "Southwest Waterfront", "Anacostia", "Brookland", "Petworth"],
  note: "Condo or apartment building? Tell us about loading dock, elevator or certificate requirements in your message so the quote covers them.",
});

pages["/about"] = layout({
  path: "/about",
  title: "About No Worries Home Improvements | Fredericksburg, VA",
  description: "Founder-run handyman business in Fredericksburg, VA. Built on flat prices from photos and on showing up when we say we will.",
  body: `<section class="hero"><div class="wrap">
  <h1>About No Worries</h1>
  <p class="lead">Home repair shouldn't come with a knot in your stomach.</p>
</div></section>
<section><div class="wrap prose">
  <p>I'm Duna, and I started No Worries by doing what I've always done: helping people solve real problems in their homes. Friends, neighbors and referrals kept calling because the work was done right, communication was clear, and they felt comfortable letting me into their space.</p>
  <p>The problem I kept hearing about wasn't the repair. It was the contractor: no callback, a no-show, a price that doubled once the work started. So I built the business around a procedure that makes that impossible. You send a photo, I send one flat price, and that's the price you pay. If something hidden turns up, I stop and quote it before going further.</p>
  <p>I'm hands-on with every job. I'll explain what I'm doing and why, protect your floors, and clean up before I leave. When the job's done, you should feel relieved, not worried.</p>
  <p>— Duna, founder</p>
  ${ctaButtons()}
</div></section>`,
});

pages["/get-a-quote"] = layout({
  path: "/get-a-quote",
  title: "Get a Flat-Price Photo Quote | No Worries Home Improvements",
  description: "Send photos of the job by text or upload them online. You'll get one flat price back, usually the same day. Free, no obligation.",
  body: `<section class="hero"><div class="wrap">
  <h1>Get your flat price</h1>
  <p class="lead">Two ways to send photos. Either way, you'll get one number back, usually the same day. Free, no obligation.</p>
</div></section>
<section><div class="wrap">
  <div class="grid">
    <div class="card"><h3>Fastest: text the photo</h3><p>Text a wide shot and a close-up to ${BIZ.phone} with a one-line description and your ZIP.</p><p><a class="btn btn-primary" href="${SMS}">Text a photo</a></p></div>
    <div class="card"><h3>Or upload online</h3><p>Short form: name, number, address, what needs fixing, and your photos. Goes straight to us.</p><p><a class="btn btn-primary" href="${QUOTE_FORM_URL}" target="_blank" rel="noopener">Open the quote form</a></p></div>
    <div class="card"><h3>Rather talk?</h3><p>Call ${BIZ.phone}, ${BIZ.hours}. If we miss you, we'll call back the same business day.</p><p><a class="btn btn-ghost" href="${TEL}">Call now</a></p></div>
  </div>
  <h2 style="margin-top:40px">What makes a good photo</h2>
  <ul class="prose">
    <li>One wide shot so we can see the room or wall</li>
    <li>One close-up of the problem</li>
    <li>Anything that changes the job: brick, high ceilings, stairs, tight access</li>
  </ul>
</div></section>`,
});

pages["/privacy-policy"] = layout({
  path: "/privacy-policy",
  title: "Privacy Policy | No Worries Home Improvements",
  description: "How No Worries Home Improvements handles information you send through this website.",
  body: `<section><div class="wrap prose">
  <h1>Privacy policy</h1>
  <p><strong>What we collect.</strong> If you text, call, email or use the quote form, we receive what you send: your name, contact details, service address, job description and photos. The quote form is hosted by Airtable, which stores your submission for us.</p>
  <p><strong>How we use it.</strong> Only to quote, schedule and complete your job and to follow up about it. We don't sell your information.</p>
  <p><strong>Analytics.</strong> This site uses Google Analytics to count visits and see which pages are useful. Google may set cookies to do this. You can block them with your browser settings or Google's opt-out add-on.</p>
  <p><strong>Removal.</strong> Email ${BIZ.email} to have your information deleted.</p>
</div></section>`,
});

pages["/404"] = layout({
  path: "/404",
  title: "Page not found | No Worries Home Improvements",
  description: "This page doesn't exist.",
  body: `<section class="hero"><div class="wrap">
  <h1>That page moved or doesn't exist.</h1>
  <p class="lead">The fastest way to get what you came for: text a photo of the job.</p>
  ${ctaButtons()}
</div></section>`,
});

// ---- write output ----
const out = "dist";
if (existsSync(out)) rmSync(out, { recursive: true });
for (const [path, html] of Object.entries(pages)) {
  const file = path === "/" ? "index.html" : path === "/404" ? "404.html" : join(path.slice(1), "index.html");
  const dest = join(out, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
}
for (const f of ["styles.css", "favicon.svg", "og-image.png", "_redirects", "_headers", "robots.txt"]) copyFileSync(join("src", f), join(out, f));
cpSync(join("src", "home"), join(out, "home"), { recursive: true });

const urls = Object.keys(pages).filter((p) => p !== "/404");
writeFileSync(join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`Built ${urls.length} pages + 404 into ./${out}`);
