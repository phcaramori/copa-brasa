// Fetch four Donorbox campaigns, cache in memory, return rankings

const CACHE_TTL_MS = 30000;
const TEAM_NAMES = ["Time South", "Time North", "Time West", "Time Europa"];
const CAMPAIGN_ID_LIST = (process.env.DONORBOX_CAMPAIGN_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean)
  .map(String);
const CAMPAIGN_IDS = new Set(CAMPAIGN_ID_LIST);
console.log("Configured CAMPAIGN_IDS:", CAMPAIGN_IDS);
const CAMPAIGN_NAME_MAP = new Map(
  CAMPAIGN_ID_LIST.map((id, idx) => [id, TEAM_NAMES[idx] || `Campaign ${id}`]),
);

let cache = {
  expiresAt: 0,
  payload: null,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); //! TODO: Mudar para gobrasa.org
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const now = Date.now();
  if (cache.payload && cache.expiresAt > now) {
    res.status(200).json(cache.payload);
    return;
  }

  try {
    const { campaigns, donations } = await fetchData();
    const ranked = rankCampaigns(campaigns);
    const chaptersByCampaign = aggregateChapters(donations);

    const payload = {
      updatedAt: new Date().toISOString(),
      maxTotal: ranked[0]?.totalRaised || 0,
      campaigns: ranked.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        totalRaised: campaign.totalRaised,
        currency: campaign.currency || "USD",
        rank: campaign.rank,
        pctOfMax: ranked[0]?.totalRaised ? campaign.totalRaised / ranked[0].totalRaised : 0,
        chapters: chaptersByCampaign.get(String(campaign.id)) || [],
      })),
    };

    cache = {
      expiresAt: now + CACHE_TTL_MS,
      payload,
    };

    res.status(200).json(payload);
  } catch (err) {
    console.error("Error in /api/campaigns handler:", err);
    res.status(500).json({ error: "Unexpected error", details: String(err).slice(0, 200) });
  }
}

function rankCampaigns(campaigns) {
  const sorted = [...campaigns].sort((a, b) => toNumber(b.total_raised) - toNumber(a.total_raised));
  return sorted.map((campaign, index) => ({
    id: campaign.id,
    name: CAMPAIGN_NAME_MAP.get(String(campaign.id)) || `Campaign ${campaign.id}`,
    totalRaised: toNumber(campaign.total_raised),
    currency: campaign.currency,
    rank: index + 1,
  }));
}

function toNumber(value) {
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.]/g, "")) : Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function fetchData() {
  if (!process.env.DONORBOX_API_KEY) {
    console.error("Missing DONORBOX_API_KEY; cannot reach Donorbox");
    throw new Error("Missing DONORBOX_API_KEY");
  }
  if (!process.env.DONORBOX_LOGIN_EMAIL) {
    console.error("Missing DONORBOX_LOGIN_EMAIL; required for Donorbox Basic auth");
    throw new Error("Missing DONORBOX_LOGIN_EMAIL");
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${process.env.DONORBOX_LOGIN_EMAIL}:${process.env.DONORBOX_API_KEY}`,
    ).toString("base64")}`,
  };

  const [campaignRes, donationRes] = await Promise.all([
    fetch("https://donorbox.org/api/v1/campaigns", { headers }),
    fetch("https://donorbox.org/api/v1/donations", { headers }),
  ]);

  if (!campaignRes.ok) {
    const text = await campaignRes.text();
    console.error("Failed to reach Donorbox campaigns:", campaignRes.status, text);
    throw new Error(`Failed to reach Donorbox campaigns: ${text.slice(0, 200)}`);
  }
  if (!donationRes.ok) {
    const text = await donationRes.text();
    console.error("Failed to reach Donorbox donations:", donationRes.status, text);
    throw new Error(`Failed to reach Donorbox donations: ${text.slice(0, 200)}`);
  }

  const campaignsRaw = await campaignRes.json();
  const donationsRaw = await donationRes.json();

  if (!Array.isArray(campaignsRaw)) {
    throw new Error("Unexpected Donorbox response shape for /api/v1/campaigns");
  }
  if (!Array.isArray(donationsRaw)) {
    throw new Error("Unexpected Donorbox response shape for /api/v1/donations");
  }
  if (!CAMPAIGN_ID_LIST.length) {
    throw new Error("No CAMPAIGN_IDS configured");
  }

  const filteredCampaigns = campaignsRaw.filter((campaign) => CAMPAIGN_IDS.has(String(campaign.id)));
  const filteredDonations = donationsRaw.filter((donation) => CAMPAIGN_IDS.has(String(donation?.campaign?.id)));

  return { campaigns: filteredCampaigns, donations: filteredDonations };
}

function aggregateChapters(donations) {
  const byCampaign = new Map();

  for (const donation of donations) {
    const campaignId = donation?.campaign?.id;
    const chapterName = extractChapter(donation);

    //!somente usar converted_amount. "amount" pode ser em outra moeda. 
    // converted_amound é populado somente após transferência ser convertida pelo stripe (demora ~60s)
    const amount = toNumber(donation?.converted_amount); //em BRL
    if (!campaignId || !chapterName || !amount) continue;

    const key = String(campaignId);
    if (!byCampaign.has(key)) byCampaign.set(key, new Map());

    const chapterMap = byCampaign.get(key);
    const current = chapterMap.get(chapterName) || 0;
    chapterMap.set(chapterName, current + amount);
  }

  const result = new Map();
  for (const [campaignId, chapters] of byCampaign.entries()) {
    const entries = Array.from(chapters.entries())
      .map(([name, total]) => ({ name, totalRaised: total }))
      .sort((a, b) => b.totalRaised - a.totalRaised);
    result.set(campaignId, entries);
  }

  return result;
}

//busca pergunta em "aditional questions" do donorbox. como temos somente uma, essa é a de BL.
function extractChapter(donation) {
  if (!donation?.questions || !Array.isArray(donation.questions)) return null;
  const question = donation.questions[0];
  if (!question) return null;
  const answer = question.answer || question.value || "";
  return String(answer).trim() || null;
}
