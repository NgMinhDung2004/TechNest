import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import productImagePaths from "../data/product-image-paths.json";

type ProductImageSource = {
  sku: string;
  name: string;
  brand: string;
  category: string;
  specs: unknown;
};

const imagePathsBySku: Record<string, string> = productImagePaths;

const palettes = [
  { ink: "#193d36", accent: "#48a98d", light: "#dcefe5", screen: "#173e37" },
  { ink: "#272e48", accent: "#818de0", light: "#e5e8f8", screen: "#252f58" },
  { ink: "#55383a", accent: "#e39b71", light: "#f6e5d9", screen: "#463b50" },
  { ink: "#293d50", accent: "#5baac3", light: "#dceef2", screen: "#183e52" },
  { ink: "#463b29", accent: "#d2ad54", light: "#f3ecd5", screen: "#3d4837" },
  { ink: "#40354b", accent: "#b08ad4", light: "#eee5f5", screen: "#383450" },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSpecs(specs: unknown): Record<string, unknown> {
  if (typeof specs !== "object" || specs === null || Array.isArray(specs)) {
    return {};
  }
  return specs as Record<string, unknown>;
}

function getSpecLabel(specs: Record<string, unknown>) {
  return Object.entries(specs)
    .filter(([key, value]) => key !== "type" && value !== null && value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("  ·  ");
}

function drawLaptop(palette: (typeof palettes)[number], brand: string) {
  return `
    <g filter="url(#shadow)">
      <rect x="295" y="185" width="610" height="405" rx="25" fill="#263832"/>
      <rect x="313" y="203" width="574" height="365" rx="13" fill="url(#screen)"/>
      <circle cx="600" cy="210" r="3" fill="#81978d"/>
      <circle cx="600" cy="385" r="118" fill="${palette.accent}" opacity=".13"/>
      <circle cx="600" cy="385" r="78" fill="none" stroke="#ffffff" stroke-opacity=".24" stroke-width="2"/>
      <path d="M600 325 614 369 660 371 624 399 638 443 600 416 562 443 576 399 540 371 586 369Z" fill="${palette.light}" opacity=".92"/>
      <text x="600" y="508" text-anchor="middle" fill="#ffffff" opacity=".8" font-family="Arial,sans-serif" font-size="16" letter-spacing="5">${escapeXml(brand.toUpperCase())}</text>
      <path d="m250 594 700 0 70 48q8 7-11 12H190q-18-5-10-12Z" fill="#c6d0ca"/>
      <path d="M425 598h350l-20 23H445Z" fill="#a8b5ae"/>
      <path d="M530 648h140l-14 8h-112Z" fill="#87968e"/>
    </g>`;
}

function drawMonitor(palette: (typeof palettes)[number], brand: string) {
  return `
    <g filter="url(#shadow)">
      <rect x="285" y="175" width="630" height="440" rx="24" fill="#263832"/>
      <rect x="304" y="194" width="592" height="395" rx="12" fill="url(#screen)"/>
      <circle cx="600" cy="382" r="150" fill="${palette.accent}" opacity=".22"/>
      <circle cx="600" cy="382" r="102" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="2"/>
      <circle cx="600" cy="382" r="57" fill="${palette.light}" opacity=".86"/>
      <path d="M571 382h58M600 353v58" stroke="${palette.ink}" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>
      <text x="600" y="548" text-anchor="middle" fill="#fff" opacity=".75" font-family="Arial,sans-serif" font-size="14" letter-spacing="4">${escapeXml(brand.toUpperCase())}</text>
      <path d="M570 615h60l22 110H548Z" fill="#aebbb4"/>
      <path d="M470 728q130-29 260 0l35 18q-165 24-330 0Z" fill="#cbd4ce"/>
    </g>`;
}

function drawCpu(palette: (typeof palettes)[number]) {
  const pins = Array.from({ length: 8 }, (_, index) => {
    const offset = index * 42;
    return `<path d="M${455 + offset} 275v-31M${455 + offset} 575v31M425 ${305 + offset}h-31M725 ${305 + offset}h31" stroke="#c89d50" stroke-width="8" stroke-linecap="round"/>`;
  }).join("");
  return `
    <g filter="url(#shadow)">
      ${pins}
      <rect x="435" y="275" width="330" height="300" rx="28" fill="#b9c9c1"/>
      <rect x="458" y="298" width="284" height="254" rx="18" fill="#263a34"/>
      <rect x="488" y="328" width="224" height="194" rx="13" fill="url(#screen)"/>
      <rect x="517" y="357" width="166" height="136" rx="10" fill="${palette.accent}"/>
      <path d="M546 386h108M546 410h72M546 434h93M546 458h57" stroke="#fff" stroke-opacity=".7" stroke-width="8" stroke-linecap="round"/>
      <text x="600" y="535" text-anchor="middle" fill="#eaf3ee" font-family="Arial,sans-serif" font-size="16" letter-spacing="3">TECH CORE</text>
    </g>`;
}

function drawGpu(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <path d="M290 328h590q30 0 30 30v230q0 30-30 30H300q-30 0-30-30V358q0-30 30-30Z" fill="#303a38"/>
      <path d="M320 358h530v180H320Z" fill="${palette.ink}"/>
      <circle cx="475" cy="447" r="72" fill="#202826" stroke="${palette.accent}" stroke-width="9"/>
      <circle cx="475" cy="447" r="18" fill="${palette.accent}"/>
      <path d="M475 383q25 40 0 64-25-24 0-64Zm64 64q-40 25-64 0 24-25 64 0Zm-64 64q-25-40 0-64 25 24 0 64Zm-64-64q40-25 64 0-24 25-64 0Z" fill="${palette.accent}" opacity=".8"/>
      <circle cx="695" cy="447" r="72" fill="#202826" stroke="${palette.accent}" stroke-width="9"/>
      <circle cx="695" cy="447" r="18" fill="${palette.accent}"/>
      <path d="M695 383q25 40 0 64-25-24 0-64Zm64 64q-40 25-64 0 24-25 64 0Zm-64 64q-25-40 0-64 25 24 0 64Zm-64-64q40-25 64 0-24 25-64 0Z" fill="${palette.accent}" opacity=".8"/>
      <path d="M360 588h450v30H360Z" fill="#d0a554"/>
      <path d="M375 618v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35" stroke="#c89d50" stroke-width="9"/>
      <circle cx="837" cy="360" r="8" fill="${palette.accent}"/>
    </g>`;
}

function drawRam(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)" transform="rotate(-7 600 445)">
      <rect x="245" y="375" width="710" height="145" rx="24" fill="#263832"/>
      <rect x="275" y="396" width="650" height="103" rx="13" fill="${palette.ink}"/>
      <rect x="310" y="414" width="122" height="68" rx="8" fill="${palette.accent}"/>
      <rect x="450" y="414" width="122" height="68" rx="8" fill="${palette.accent}"/>
      <rect x="590" y="414" width="122" height="68" rx="8" fill="${palette.accent}"/>
      <rect x="730" y="414" width="122" height="68" rx="8" fill="${palette.accent}"/>
      <path d="M310 434h122m18 0h122m18 0h122m18 0h122" stroke="#fff" stroke-opacity=".24" stroke-width="4"/>
      ${Array.from({ length: 24 }, (_, i) => `<path d="M${290 + i * 26} 520v28" stroke="#caa45a" stroke-width="8"/>`).join("")}
    </g>`;
}

function drawSsd(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)" transform="rotate(-13 600 445)">
      <path d="M300 392q0-28 28-28h525q28 0 28 28v105q0 28-28 28H328q-28 0-28-28Z" fill="#283532"/>
      <path d="M332 387h486v116H332Z" fill="${palette.ink}"/>
      <circle cx="366" cy="445" r="11" fill="#d0a554"/>
      <rect x="402" y="414" width="150" height="61" rx="8" fill="#26302d"/>
      <rect x="568" y="414" width="150" height="61" rx="8" fill="#26302d"/>
      <path d="M420 432h110m-110 16h74m-74 16h92m75-32h108m-108 16h76m-76 16h98" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M862 412v65h70v-65l-19-24h-32Z" fill="#cfaa5e"/>
    </g>`;
}

function drawMouse(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <path d="M600 255c-144 0-210 102-210 258v48c0 104 85 180 210 180s210-76 210-180v-48c0-156-66-258-210-258Z" fill="${palette.ink}"/>
      <path d="M600 260v210m-210 3q110 37 210 0 100 37 210 0" fill="none" stroke="${palette.accent}" stroke-width="7" stroke-linecap="round"/>
      <rect x="573" y="327" width="54" height="92" rx="25" fill="${palette.accent}"/>
      <path d="M600 342v42" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="600" cy="664" rx="102" ry="17" fill="#fff" opacity=".11"/>
    </g>`;
}

function drawKeyboard(palette: (typeof palettes)[number]) {
  const keys = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 13 }, (_, col) => {
      const x = 278 + col * 50 + (row === 3 ? 15 : 0);
      const y = 337 + row * 57;
      const width = row === 3 && col === 5 ? 165 : 39;
      if (row === 3 && col > 5 && col < 9) return "";
      return `<rect x="${x}" y="${y}" width="${width}" height="39" rx="8" fill="${(row + col) % 5 === 0 ? palette.accent : "#65716c"}"/>`;
    }).join(""),
  ).join("");
  return `
    <g filter="url(#shadow)" transform="rotate(-5 600 450)">
      <path d="M270 310q0-24 25-24h610q25 0 25 24v280q0 32-32 32H302q-32 0-32-32Z" fill="#26312f"/>
      ${keys}
      <rect x="488" y="565" width="224" height="14" rx="7" fill="#b4c0b9" opacity=".6"/>
      <path d="M350 655h500" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    </g>`;
}

function drawHeadphones(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <path d="M350 492v-70c0-145 105-245 250-245s250 100 250 245v70" fill="none" stroke="${palette.ink}" stroke-width="66" stroke-linecap="round"/>
      <path d="M350 441v171q0 32 32 32h45q30 0 30-32V451q0-30-30-30h-45q-32 0-32 32Zm490 0v171q0 32-32 32h-45q-30 0-30-32V451q0-30 30-30h45q32 0 32 32Z" fill="${palette.ink}"/>
      <path d="M376 467v114m448-114v114" stroke="${palette.accent}" stroke-width="15" stroke-linecap="round"/>
      <path d="M855 544q72 10 54 74-11 39-66 37" fill="none" stroke="${palette.accent}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="843" cy="652" r="12" fill="${palette.accent}"/>
    </g>`;
}

function drawBackpack(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <path d="M410 354q0-160 190-160t190 160l64 323q9 48-39 48H385q-48 0-39-48Z" fill="${palette.ink}"/>
      <path d="M467 360q0-111 133-111t133 111" fill="none" stroke="${palette.accent}" stroke-width="22"/>
      <path d="M412 488q188-63 376 0v133q-188 71-376 0Z" fill="${palette.accent}" opacity=".85"/>
      <path d="M458 511h284v89H458Z" rx="18" fill="${palette.ink}" opacity=".42"/>
      <path d="M600 521v73m-145-33h290" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>
      <path d="M400 371q-80 124-48 275m448-275q80 124 48 275" fill="none" stroke="#d7ded9" stroke-width="18" stroke-linecap="round"/>
    </g>`;
}

function drawCharger(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)" transform="rotate(-10 600 455)">
      <rect x="420" y="305" width="360" height="350" rx="64" fill="${palette.ink}"/>
      <rect x="453" y="338" width="294" height="284" rx="45" fill="url(#screen)"/>
      <path d="M520 305v-91m160 91v-91" stroke="#c4ccc7" stroke-width="22" stroke-linecap="round"/>
      <circle cx="600" cy="475" r="92" fill="${palette.accent}" opacity=".25"/>
      <path d="M600 410v130m-65-65h130" stroke="${palette.light}" stroke-width="15" stroke-linecap="round"/>
      <text x="600" y="591" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="19" letter-spacing="4">65W GAN</text>
    </g>`;
}

function drawHub(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)" transform="rotate(-12 600 445)">
      <rect x="324" y="373" width="552" height="144" rx="60" fill="${palette.ink}"/>
      <rect x="364" y="411" width="142" height="67" rx="11" fill="#161f1d"/>
      <rect x="535" y="411" width="96" height="67" rx="11" fill="#161f1d"/>
      <rect x="660" y="411" width="96" height="67" rx="11" fill="#161f1d"/>
      <path d="M875 443h104v20H875" fill="none" stroke="#9ca9a2" stroke-width="20" stroke-linecap="round"/>
      <path d="M408 431h54v26h-54Zm146 0h48v26h-48Zm126 0h48v26h-48Z" fill="${palette.accent}"/>
      <circle cx="810" cy="446" r="8" fill="${palette.accent}"/>
    </g>`;
}

function drawRouter(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <path d="M420 405v-190q0-18 17-11l75 211m195 0 75-211q17-7 17 11v190" fill="none" stroke="#303b37" stroke-width="20" stroke-linecap="round"/>
      <path d="M305 405q0-35 42-35h506q42 0 42 35v178q0 44-44 44H349q-44 0-44-44Z" fill="${palette.ink}"/>
      <path d="M344 437h512v112H344Z" fill="url(#screen)"/>
      <path d="M402 483q198-134 396 0m-310 2q112-76 224 0m-139 3q55-38 110 0" fill="none" stroke="${palette.accent}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="600" cy="531" r="9" fill="${palette.light}"/>
      <path d="M408 601h12m40 0h12m40 0h12m40 0h12" stroke="${palette.accent}" stroke-width="9" stroke-linecap="round"/>
    </g>`;
}

function drawMesh(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <rect x="440" y="230" width="320" height="470" rx="112" fill="${palette.ink}"/>
      <rect x="461" y="252" width="278" height="427" rx="97" fill="url(#screen)"/>
      <circle cx="600" cy="415" r="94" fill="${palette.accent}" opacity=".2"/>
      <path d="M600 349q-85 0-134 64m134-64q85 0 134 64m-134-1q-56 0-88 42m88-42q56 0 88 42m-88 1v76" fill="none" stroke="${palette.light}" stroke-width="13" stroke-linecap="round"/>
      <circle cx="600" cy="585" r="10" fill="${palette.accent}"/>
    </g>`;
}

function drawSwitch(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)" transform="rotate(-5 600 445)">
      <rect x="270" y="352" width="660" height="206" rx="28" fill="${palette.ink}"/>
      <rect x="298" y="379" width="604" height="152" rx="17" fill="url(#screen)"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${348 + i * 66}" y="422" width="42" height="58" rx="7" fill="#141e1c" stroke="${palette.accent}" stroke-width="3"/><circle cx="${369 + i * 66}" cy="500" r="5" fill="${i < 5 ? palette.accent : "#708078"}"/>`).join("")}
      <path d="M372 575v33m456-33v33" stroke="#aab5af" stroke-width="14" stroke-linecap="round"/>
      <path d="M348 620h504" stroke="#aab5af" stroke-width="12" stroke-linecap="round"/>
    </g>`;
}

function drawWifiAdapter(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)" transform="rotate(-18 600 445)">
      <rect x="438" y="285" width="324" height="366" rx="74" fill="${palette.ink}"/>
      <rect x="470" y="317" width="260" height="250" rx="52" fill="url(#screen)"/>
      <path d="M520 414q80-80 160 0m-123 36q62-62 123 0m-86 39q43-43 86 0" fill="none" stroke="${palette.accent}" stroke-width="13" stroke-linecap="round"/>
      <circle cx="600" cy="515" r="9" fill="${palette.light}"/>
      <path d="M535 650v94h130v-94" fill="#bdc7c1"/>
      <path d="M557 660v72m30-72v72m30-72v72m30-72v72" stroke="#84928a" stroke-width="7"/>
    </g>`;
}

function drawGeneric(palette: (typeof palettes)[number]) {
  return `
    <g filter="url(#shadow)">
      <rect x="360" y="285" width="480" height="340" rx="58" fill="${palette.ink}"/>
      <rect x="390" y="315" width="420" height="280" rx="38" fill="url(#screen)"/>
      <circle cx="600" cy="455" r="96" fill="${palette.accent}" opacity=".3"/>
      <path d="M600 390v130m-65-65h130" stroke="${palette.light}" stroke-width="16" stroke-linecap="round"/>
    </g>`;
}

function drawDevice(
  product: ProductImageSource,
  palette: (typeof palettes)[number],
  specs: Record<string, unknown>,
) {
  if (product.category === "laptop") return drawLaptop(palette, product.brand);
  if (product.category === "man-hinh") return drawMonitor(palette, product.brand);

  const type = String(specs.type ?? "");
  if (type === "CPU") return drawCpu(palette);
  if (type === "GPU") return drawGpu(palette);
  if (type === "RAM") return drawRam(palette);
  if (type === "SSD") return drawSsd(palette);
  if (type === "Mouse") return drawMouse(palette);
  if (type === "Keyboard") return drawKeyboard(palette);
  if (type === "Headset" || type === "Headphones") return drawHeadphones(palette);
  if (type === "Backpack") return drawBackpack(palette);
  if (type === "Charger") return drawCharger(palette);
  if (type === "Hub") return drawHub(palette);
  if (type === "Router") return drawRouter(palette);
  if (type === "Mesh Wi-Fi") return drawMesh(palette);
  if (type === "Switch") return drawSwitch(palette);
  if (type === "Wi-Fi Adapter") return drawWifiAdapter(palette);
  return drawGeneric(palette);
}

function renderProductImage(product: ProductImageSource, index: number) {
  const palette = palettes[index % palettes.length];
  const specs = getSpecs(product.specs);
  const titleSize = product.name.length > 27 ? 31 : 39;
  const category = product.category.replace(/-/g, " ").toUpperCase();
  const specLabel = getSpecLabel(specs);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(product.name)}</title>
  <desc id="desc">${escapeXml(product.brand)} ${escapeXml(String(specs.type ?? "laptop"))} product illustration</desc>
  <defs>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.screen}"/><stop offset="1" stop-color="${palette.ink}"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#20372e" flood-opacity=".2"/></filter>
  </defs>
  <rect x="24" y="24" width="1152" height="852" rx="40" fill="${palette.light}" opacity=".34"/>
  <circle cx="600" cy="432" r="287" fill="#fff" opacity=".48"/>
  <circle cx="600" cy="432" r="246" fill="none" stroke="${palette.accent}" stroke-opacity=".17" stroke-width="2"/>
  <circle cx="600" cy="432" r="207" fill="none" stroke="${palette.accent}" stroke-opacity=".1" stroke-width="2" stroke-dasharray="4 12"/>
  <text x="68" y="91" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="23" font-weight="700" letter-spacing="1">TECHNEST</text>
  <text x="68" y="121" fill="${palette.ink}" opacity=".58" font-family="Arial,sans-serif" font-size="13" letter-spacing="3">THIET BI CONG NGHE</text>
  <rect x="900" y="62" width="230" height="44" rx="22" fill="#fff" opacity=".78"/>
  <text x="1015" y="90" text-anchor="middle" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="2">${escapeXml(category)}</text>
  <path d="M175 238h44m-22-22v44m785 370h38m-19-19v38" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round" opacity=".55"/>
  ${drawDevice(product, palette, specs)}
  <text x="68" y="779" fill="${palette.ink}" opacity=".62" font-family="Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="3">${escapeXml(product.brand.toUpperCase())}</text>
  <text x="68" y="824" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(product.name)}</text>
  <text x="68" y="855" fill="${palette.ink}" opacity=".58" font-family="Arial,sans-serif" font-size="14">${escapeXml(specLabel)}</text>
  <text x="1128" y="824" text-anchor="end" fill="${palette.ink}" opacity=".48" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="2">${escapeXml(product.sku)}</text>
</svg>`;
}

export async function writeProductImageAssets(products: ProductImageSource[]) {
  const publicDirectory = resolve(process.cwd(), "public");
  const outputDirectory = join(publicDirectory, "products");
  await mkdir(outputDirectory, { recursive: true });

  for (const [index, product] of products.entries()) {
    const imagePath = imagePathsBySku[product.sku];
    if (!imagePath || !/^\/products\/[a-z0-9-]+\.svg$/i.test(imagePath)) {
      throw new Error(`Missing or invalid product image path for "${product.sku}".`);
    }

    await writeFile(
      join(outputDirectory, basename(imagePath)),
      renderProductImage(product, index),
      "utf8",
    );
  }
}
