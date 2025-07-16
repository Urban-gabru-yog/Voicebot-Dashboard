const express = require("express");
const app = express();
require("dotenv").config();

const dataRoutes = require("./routes/dataRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

require("./sync/cronJob");

app.use(express.json());

// ⚠️ Give them distinct base paths
app.use("/api/data", dataRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Optional: prevent favicon error
app.get('/favicon.ico', (req, res) => res.status(204));

// Serve static files if needed
app.use(express.static("public"));

module.exports = app;


// const express = require("express");
// const app = express();
// require("dotenv").config();

// const dataRoutes = require("./routes/dataRoutes");
// require("./sync/cronJob");

// app.use(express.json());
// app.use("/api", dataRoutes);

// module.exports = app;

// app.get('/favicon.ico', (req, res) => res.status(204));

// const dashboardRoutes = require("./routes/dashboardRoutes");
// app.use("/api", dashboardRoutes);

// app.use(express.static("public"));

