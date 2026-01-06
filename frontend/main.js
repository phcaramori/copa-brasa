const ENDPOINT = "/api/campaigns";
const REFRESH_MS = 15000;
const TOTAL_CAP = 10000;
const TEAM_ORDER = ["Time South", "Time North", "Time West", "Time Europa"];
const PLACEHOLDER_CAMPAIGNS = TEAM_ORDER.map((name, idx) => ({
  id: `placeholder-${idx + 1}`,
  name,
  totalRaised: 0,
  currency: "BRL",
  rank: idx + 1,
  chapters: [],
}));

const leaderboard = document.getElementById("leaderboard");
const updated = document.getElementById("updated");
const errorBox = document.getElementById("error");
const regions = document.getElementById("regions");
const campaignTpl = document.getElementById("campaign-template");
const regionTpl = document.getElementById("region-template");

async function load() {
  errorBox.textContent = "";
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    const campaigns = data.campaigns || [];
    renderLeaderboard(campaigns);
    renderRegions(campaigns);
    updated.textContent = `Atualizado ${formatTime(data.updatedAt || new Date().toISOString())}`;
  } catch (err) {
    errorBox.textContent = `Unable to load data. ${err.message}`;
  }
}

function renderLeaderboard(items) {
  leaderboard.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "error";
    empty.textContent = "No campaigns found. Check configuration or try again.";
    leaderboard.appendChild(empty);
    return;
  }

  const currency = items[0]?.currency || "USD";
  const totalRaised = items.reduce((sum, campaign) => sum + (campaign.totalRaised || 0), 0);
  const totalPct = Math.min((totalRaised / TOTAL_CAP) * 100, 100);
  const summary = document.createElement("div");
  summary.className = "total-row";
  summary.innerHTML = `
    <div class="total-header">
      <div>
        <div class="total-label">Total arrecadado (todas as regiões)</div>
        <div class="total-value">${formatMoney(totalRaised, currency)}</div>
      </div>
      <div class="total-cap">Meta fixa: ${formatMoney(TOTAL_CAP, currency)}</div>
    </div>
    <div class="total-track">
      <div class="total-fill" style="width: ${totalPct}%"></div>
    </div>
  `;
  leaderboard.appendChild(summary);

  const max = items.reduce((highest, campaign) => Math.max(highest, campaign.totalRaised || 0), 0);
  items.forEach((item) => {
    const pct = max ? Math.max((item.totalRaised / max) * 100, 4) : 4;
    const node = campaignTpl.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-role="bar"]').style.width = `${pct}%`;
    node.querySelector('[data-role="rank"]').textContent = ordinal(item.rank);
    node.querySelector('[data-role="name"]').textContent = item.name;
    node.querySelector('[data-role="total"]').textContent = formatMoney(item.totalRaised, item.currency || "USD");
    leaderboard.appendChild(node);
  });
}

function renderRegions(items) {
  regions.innerHTML = "";
  if (!items.length) return;

  items.forEach((item) => {
    const card = regionTpl.content.firstElementChild.cloneNode(true);
    card.querySelector('[data-role="region-name"]').textContent = item.name;
    card.querySelector('[data-role="region-rank"]').textContent = `Rank ${ordinal(item.rank)}`;
    card.querySelector('[data-role="region-total"]').textContent = formatMoney(item.totalRaised, item.currency || "USD");

    const list = card.querySelector('[data-role="chapter-list"]');
    const chapters = item.chapters || [];
    list.innerHTML = "";
    if (!chapters.length) {
      const empty = document.createElement("div");
      empty.className = "chapter-empty";
      empty.textContent = "No chapter donations yet.";
      list.appendChild(empty);
    } else {
      chapters.forEach((chapter, idx) => {
        const row = document.createElement("div");
        row.className = "chapter-row";

        row.innerHTML = `
          <div class="chapter-badge">${idx + 1}</div>
          <div class="chapter-name">${chapter.name}</div>
          <div class="chapter-amount">${formatMoney(chapter.totalRaised, item.currency || "USD")}</div>
        `;
        list.appendChild(row);
      });
    }

    regions.appendChild(card);
  });
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch (e) {
    return `$${Math.round(amount || 0).toLocaleString()}`;
  }
}

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const mod = n % 100;
  return n + (suffixes[(mod - 20) % 10] || suffixes[mod] || suffixes[0]);
}

function formatTime(iso) {
  const date = new Date(iso);
  return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

renderLeaderboard(PLACEHOLDER_CAMPAIGNS);
renderRegions(PLACEHOLDER_CAMPAIGNS);
load();
setInterval(load, REFRESH_MS);
