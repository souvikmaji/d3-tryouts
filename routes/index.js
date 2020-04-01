var express = require("express");
var router = express.Router();
const r2 = require("r2");

/* GET home page. */
router.get("/", async function(req, res, next) {
	const data = await loadData();
	res.render("index", { title: "Express", data: JSON.stringify(data) });
});

async function loadData() {
	try {
		const timeSeriesData = await loadTimeSeriesData();
		return {timeSeriesData: timeSeriesData};
	} catch (error) {
		console.log(error);
	}
}

async function loadTimeSeriesData() {
	const url = "https://api.covid19india.org/data.json";
	return r2(url).json;
}


module.exports = router;
