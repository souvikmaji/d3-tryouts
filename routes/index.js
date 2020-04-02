var express = require("express");
var router = express.Router();
const r2 = require("r2");

/* GET home page. */
router.get("/", function(req, res) {
	res.render("index");
});

/* GET timeseries data */
router.get("/timeseries", async function(req, res) {
	const data = await loadTimeSeriesData();
	res.json(data);
});

// TODO: move somewhere else
async function loadTimeSeriesData() {
	const url = "https://api.covid19india.org/data.json";
	return r2(url).json;
}


module.exports = router;
