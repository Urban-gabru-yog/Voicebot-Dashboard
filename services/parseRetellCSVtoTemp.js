const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../models"); // make sure index.js is properly configured
const { Op } = require("sequelize");

const filePath = path.join(__dirname, "D:/UrbanGabru/All-In-One-Dashboard/tempdata/call_export_303aa16e27c528ca0628.csv");

function parseDuration(durationStr) {
  if (!durationStr || typeof durationStr !== "string") return 0;
  const [min, sec] = durationStr.split(":").map(Number);
  return (min || 0) * 60 + (sec || 0);
}

function parseDateTime(dateTimeStr) {
  const [date, time] = dateTimeStr.split(" ");
  const [day, month, year] = date.split("-").map(Number);
  return new Date(`${year}-${month}-${day}T${time || "00:00:00"}`);
}

async function run() {
  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      console.log(`📄 Loaded ${rows.length} rows from CSV`);

      for (const r of rows) {
        const call_id = r["Call ID"];
        const start_timestamp = parseDateTime(r["Time"]);
        const durationSec = parseDuration(r["Call Duration"]);
        const end_timestamp = new Date(start_timestamp.getTime() + durationSec * 1000);
        const combined_cost = parseFloat((r["Cost"] || "").replace("$", "")) || 0;
        const from_number = String(r["From"] || "").trim();
        const to_number = String(r["To"] || "").trim();
        const agent_id = String(r["Agent Id"] || "").trim();

        // Infer brand by number pattern (if known), or leave null
        let brand = "unknown";
        if (agent_id.includes("trim")) brand = "trimfinity";
        if (agent_id.includes("urban")) brand = "urbanyog";

        const exists = await db.sequelize.query(
          `SELECT 1 FROM temp_call_logs WHERE call_id = ? LIMIT 1`,
          { replacements: [call_id], type: db.Sequelize.QueryTypes.SELECT }
        );

        if (!exists.length) {
          await db.sequelize.query(
            `INSERT INTO temp_call_logs 
            (call_id, start_timestamp, end_timestamp, combined_cost, from_number, to_number, brand) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                call_id,
                start_timestamp,
                end_timestamp,
                combined_cost,
                from_number,
                to_number,
                brand,
              ],
            }
          );
          console.log(`✅ Inserted call: ${call_id}`);
        } else {
          console.log(`⏩ Already exists: ${call_id}`);
        }
      }

      console.log("🎉 Finished inserting into temp_call_logs");
      process.exit();
    });
}

run().catch((err) => {
  console.error("❌ Error parsing Retell CSV:", err);
  process.exit(1);
});
clea