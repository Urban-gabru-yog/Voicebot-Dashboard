const axios = require("axios");
require("dotenv").config();

const BRANDS = ["trimfinity", "urbanyog"];

module.exports = async function fetchRetellData() {
  const brandResults = [];

  for (const brand of BRANDS) {
    const apiUrl = process.env[`RETELL_API_${brand.toUpperCase()}`];
    const apiKeyRaw = process.env[`RETELL_API_KEY_${brand.toUpperCase()}`];

    if (!apiUrl || !apiKeyRaw) {
      console.warn(`Missing Retell config for brand: ${brand}`);
      continue;
    }

    const apiKey = apiKeyRaw.startsWith("Bearer ")
      ? apiKeyRaw
      : `Bearer ${apiKeyRaw}`;

    console.log(`➡️ Calling Retell API for ${brand}`);
    console.log("URL:", apiUrl);
    console.log("Headers:", { Authorization: apiKey });

    try {
      const { data } = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const calls = data.calls || data || [];
      calls.forEach((call) => {
        const dynamic = call.retell_llm_dynamic_variables || {};
        brandResults.push({
          ...call,
          brand,
          email: dynamic.email || null, // flatten email to top level
          name: dynamic.name || null,
          title: dynamic.title || null,
          price: dynamic.price || null,
        });
      });
    } catch (error) {
      console.error(`Retell fetch failed for ${brand}:`, error.message);

      // ✅ This must be INSIDE the catch block
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
    }
  }

  return brandResults;
};
