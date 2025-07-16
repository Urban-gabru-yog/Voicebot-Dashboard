const db = require("../models");

const productsWithCOGS = [
  // UrbanYog + MakeMeeBold
  { product_name: "Urban Yog Callus Remover", COGS: 390 },
  { product_name: "Urban Yog Electric Facial Hair Remover For Women", COGS: 365 },
  { product_name: "MakeMeeBold Hot Air Brush 1.0 by Urban Yog", COGS: 795 },
  { product_name: "MakeMeeBold 3-in-1 Hot Air Brush by Urban Yog", COGS: 990 },
  { product_name: "MakeMeeBold Automatic Hair Curler by Urban Yog", COGS: 1050 },
  { product_name: "MakeMeeBold 7-IN-1 Multi Air Styler by Urban Yog", COGS: 4250 },
  { product_name: "MakeMeeBold Hair Straightening Brush", COGS: 915 },
  { product_name: "MakeMeeBold Frizz Free Straightening Brush", COGS: 750 },

  // Trimfinity additions
  { product_name: "Ultimate Duo Beard & Body Trimmer", COGS: 1020 },
  { product_name: "Trimfinity 1.0 Body & Ball Trimmer", COGS: 604 },
  { product_name: "Trimfinity 7000 Body and Ball Trimmer", COGS: 702 },
  { product_name: "Trimfinity 7000 Pro Max Body & Ball trimmer", COGS: 850 },
  { product_name: "Trimfinity 3 in 1 face trimmer", COGS: 915 },
  { product_name: "Drin-Finity Hair Dryer For Men", COGS: 700 },
  { product_name: "Trimfinity Groom & Style Duo", COGS: 1615 },
  { product_name: "Trimfinity Style & Trim Duo", COGS: 1402 },
  { product_name: "Trimfinity Edge Shave", COGS: 1275 },
  { product_name: "Trimfinity Smart Blade", COGS: 550 },
  { product_name: "Trimfinity GlidePro Body Trimmer", COGS: 765 },
];


const detectBrand = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("makemeebold") || lower.includes("urban yog")) return "urbanyog";
  if (lower.includes("trimfinity")) return "trimfinity";
  return "unknown";
};

async function populateCOGS() {
  for (const item of productsWithCOGS) {
    const orderMatch = await db.OrderItem.findOne({
      where: { title: item.product_name },
    });

    const product_id = orderMatch?.product_id || null;
    const brand = detectBrand(item.product_name);

    const existing = await db.ProductCogs.findOne({
      where: { product_name: item.product_name },
    });

    if (!existing) {
      await db.ProductCogs.create({
        product_name: item.product_name,
        COGS: item.COGS,
        product_id,
        brand,
      });
      console.log("✅ Inserted:", item.product_name);
    } else {
      console.log("⚠️ Already exists:", item.product_name);
    }
  }
}

populateCOGS()
  .then(() => {
    console.log("Done populating product_cogs.");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Failed to populate product_cogs:", err);
    process.exit(1);
  });
