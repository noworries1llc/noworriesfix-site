// Static site generator for noworriesfix.com. No dependencies: `node build.mjs` writes ./dist
import { mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync } from "node:fs";
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

function layout({ path, title, description, body, schema = [] }) {
  const canonical = SITE + (path === "/" ? "/" : path);
  const ld = { "@context": "https://schema.org", "@graph": [orgSchema, ...schema] };
  const nav = NAV.map(([href, label]) => `<a href="${href}"${href === path ? ' aria-current="page"' : ""}>${label}</a>`).join("");
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
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>
</head>
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
  ["Do you do multiple jobs in one visit?", "Yes, and it's cheaper. Two services get 8% off the base prices; three or more get 11% off."],
  ["What hours do you work?", `${BIZ.hours}. Send photos anytime and we'll reply during business hours.`],
  ["Where do you work?", "Fredericksburg, Stafford, Spotsylvania, King George and Caroline County. Northern Virginia and DC by quote; any travel charge is included in your flat price before you approve."],
];

const faqSchema = { "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
const faqHtml = FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n");

const pages = {};

pages["/"] = layout({
  path: "/",
  title: "Flat-Price Handyman in Fredericksburg, VA | No Worries",
  description: "Text a photo, get one flat price back, usually the same day. TV mounting, assembly, drywall and more in Fredericksburg, Stafford & Spotsylvania.",
  schema: [faqSchema],
  body: `<section class="hero"><div class="wrap">
  <h1>Text us a photo. Get a flat price today. That's the price you pay.</h1>
  <p class="lead">No hourly meter. No "we'll see when we get there." No three-day wait for a callback. You'll know the number before anyone touches your house.</p>
  ${ctaButtons()}
  <p class="micro">Fredericksburg, Stafford &amp; Spotsylvania · Most quotes back same day · ${BIZ.hours}</p>
</div></section>

<section><div class="wrap">
  <h2>How you get a price without anyone coming out</h2>
  <div class="steps">
    <div class="step"><h3>Send a photo</h3><p>Text ${BIZ.phone} or upload here. Thirty seconds. Bad lighting is fine.</p></div>
    <div class="step"><h3>Get a flat price back</h3><p>In writing, usually the same day. One number: not a range, not an "estimate," not a starting-at.</p></div>
    <div class="step"><h3>We show up and do the work</h3><p>The price doesn't move. If we find something hidden behind the wall, we stop and re-quote before we touch it. Your call.</p></div>
  </div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="promise">
    <h2>The Flat Price Promise</h2>
    <p>The number we quote is the number on your invoice.</p>
    <p>Not "about." Not "plus materials." Not "depending on what we find." If the job is what the photo showed, the price is what we said.</p>
    <p>Two exceptions, and we'll tell you about both before we start work, not after:</p>
    <ul>
      <li><strong>You add work.</strong> Different job, new price, quoted the same way.</li>
      <li><strong>Something's hidden.</strong> Rot behind the tile, a surprise in the wall. We stop, show you a photo, and quote it. You decide whether we keep going.</li>
    </ul>
    <p>That's it. That's the whole policy.</p>
  </div>
</div></section>

<section><div class="wrap">
  <h2>What we fix</h2>
  <p class="sub">Starting prices for the most common jobs. Your photo quote is one flat number.</p>
  <div class="grid">
    ${SERVICES.map((s) => `<div class="card"><h3>${s.name}</h3><div class="price">${s.price}</div><p>${s.note}</p></div>`).join("")}
  </div>
  <h3 style="margin-top:28px">Also on the list</h3>
  <ul class="tags">${OTHER_WORK.map((w) => `<li>${w}</li>`).join("")}</ul>
  <p><strong>Not sure if it's on the list? Send the photo anyway.</strong> If we can't do it, we'll tell you who can.</p>
  <p><a href="/services">See all services and add-on prices →</a></p>
</div></section>

<section class="alt"><div class="wrap">
  <h2>Managing properties? You don't need to be there.</h2>
  <p class="prose">Your tenant texts us the photo. We quote you the flat price. You approve by text. We coordinate access, do the work, and send you photos when it's done. One invoice. One point of contact.</p>
  <p><a class="btn btn-primary" href="/landlords">Landlords &amp; property managers →</a></p>
</div></section>

<section><div class="wrap">
  <h2>Where we work</h2>
  <p class="prose">Based in Fredericksburg, VA. We serve ${AREA_CITIES.join(", ")}. Northern Virginia and DC jobs are quoted case by case. Outside that? Send the photo anyway; if it's close, we'll tell you.</p>
</div></section>

<section class="alt"><div class="wrap prose">
  <h2>Questions people ask before they text</h2>
  ${faqHtml}
</div></section>
${ctaBand()}`,
});

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

const urls = Object.keys(pages).filter((p) => p !== "/404");
writeFileSync(join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`Built ${urls.length} pages + 404 into ./${out}`);
