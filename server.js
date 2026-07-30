require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Simple in-memory cache: key = "origin-destination-date", value = { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey({ origin, destination, date }) {
  return `${origin}-${destination}-${date}`.toUpperCase();
}

// Normalize a raw Duffel offer into a clean shape for the frontend
function normalizeOffer(offer) {
  const firstSlice = offer.slices[0];
  const segments = firstSlice.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return {
    id: offer.id,
    price: offer.total_amount,
    currency: offer.total_currency,
    airline: firstSegment?.marketing_carrier?.name || "Unknown",
    airlineLogo: firstSegment?.marketing_carrier?.logo_symbol_url || null,
    departureTime: firstSegment?.departing_at,
    arrivalTime: lastSegment?.arriving_at,
    origin: firstSegment?.origin?.iata_code,
    destination: lastSegment?.destination?.iata_code,
    stops: segments.length - 1,
    durationISO: firstSlice.duration,
  };
}

app.get("/api/search", async (req, res) => {
  const { origin, destination, date } = req.query;

  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: "Missing required query params: origin, destination, date",
    });
  }

  if (!DUFFEL_TOKEN) {
    return res.status(500).json({
      error: "Server misconfigured: DUFFEL_TOKEN not set in .env",
    });
  }

  const cacheKey = getCacheKey({ origin, destination, date });
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ offers: cached.data, cached: true });
  }

  try {
    const duffelResponse = await fetch(
      "https://api.duffel.com/air/offer_requests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DUFFEL_TOKEN}`,
          "Duffel-Version": "v2",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            slices: [
              {
                origin: origin.toUpperCase(),
                destination: destination.toUpperCase(),
                departure_date: date,
              },
            ],
            passengers: [{ type: "adult" }],
            cabin_class: "economy",
          },
        }),
      }
    );

    const result = await duffelResponse.json();

    if (!duffelResponse.ok) {
      console.error("Duffel error:", JSON.stringify(result, null, 2));
      return res.status(duffelResponse.status).json({
        error: result.errors?.[0]?.message || "Duffel API request failed",
      });
    }

    const offers = (result.data?.offers || [])
      .map(normalizeOffer)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    cache.set(cacheKey, { data: offers, expiresAt: Date.now() + CACHE_TTL_MS });

    res.json({ offers, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Tour agency server running at http://localhost:${PORT}`);
});
