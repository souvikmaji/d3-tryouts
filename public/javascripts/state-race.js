var margin = {
	top: 30,
	right: 10,
	bottom: 30,
	left: 65
};

var	width = 1000 - margin.left - margin.right;
var barSize = 25;
var n = 386;
var k = 10;
var	height = 390;// margin.top + barSize * n/2 + margin.bottom;

var duration = 200;

var stateCodes = d3.map({"AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam", "BR": "Bihar", "CT": "Chhattisgarh", "GA": "Goa", "GJ": "Gujarat", "ML": "Meghalaya",
	"MZ": "Mizoram", "HR": "Haryana", "HP": "Himachal Pradesh", "JH": "Jharkhand", "KA": "Karnataka", "KL": "Kerala", "MP": "Madhya Pradesh", "MH": "Maharashtra", "MN": "Manipur",
	"NL": "Nagaland", "OR": "Odisha", "PB": "Punjab", "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu", "TG": "Telangana", "TR": "Tripura", "UT": "Uttarakhand", "UP": "Uttar Pradesh",
	"WB": "West Bengal", "AN": "Andaman and Nicobar", "CH": "Chandigarh", "DN": "Dadra and Nagar Haveli", "DD": "Daman and Diu", "DL": "Delhi", "JK": "Jammu and Kashmir", "LA": "Ladakh",
	"LD": "Lakshadweep", "PY": "Puducherry"});

function getStateName(code) {
	const name = stateCodes.get(code);
	if(name !== undefined){
		return name;
	}
	return code;
}

var formatDate = d3.utcFormat("%d %B");
var formatNumber = d3.format(",d");

function textTween(a, b) {
	const i = d3.interpolateNumber(a, b);
	return function(t) {
		this.textContent = formatNumber(i(t));
	};
}

d3.csv("/statewise-daily-confirmed").then((data) => {
	console.log("csv data: ",data);

	var datevalues = d3.groups(data, d => d.date)
		.map(d => {
			d[0] = moment(d[0], "DD-MMM-YY").toDate();
			d[1] = d3.map(d[1][0]);
			d[1].remove("date");
			d[1].remove("TT");
			d[1].remove("");
			d[1].each((v,k) => d[1].set(k, +v));
			return d;
		});

	var names = new Set(datevalues[1][1].keys());

	const svg = d3.select("#state-race").append("svg")
		.attr("viewBox", [0, 0, width, height]);

	// set the ranges
	var x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);

	var	y = d3.scaleBand()
		.domain(d3.range(n + 1))
		.rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
		.padding(0.1);

	const keyframes = [];
	let ka, a, kb, b;
	for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
		for (let i = 0; i < k; ++i) {
			const t = i / k;
			keyframes.push([
				new Date(ka * (1 - t) + kb * t),
				rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
			]);
		}
	}
	keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);

	var nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.name);

	var next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));
	var prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));

	render();

	async function render(){
		const updateBars = bars(svg);
		const updateAxis = axis(svg);
		const updateLabels = labels(svg);
		const updateTicker = ticker(svg);

		for (const keyframe of keyframes) {
			const transition = svg.transition()
				.duration(duration)
				.ease(d3.easeLinear);

			// Extract the top bar’s value.
			x.domain([0, keyframe[1][0].value]);

			updateAxis(keyframe, transition);
			updateBars(keyframe, transition);
			updateLabels(keyframe, transition);
			updateTicker(keyframe, transition);

			// TODO: on error-> svg.interrupt());
			await transition.end();
		}
	}

	function rank(value) {
		const data = Array.from(names, name => ({name, value: value(name)}));
		data.sort((a, b) => d3.descending(a.value, b.value));
		for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
		return data.filter(d => d.value !== 0);
	}

	function bars(svg) {
		let bar = svg.append("g")
			.attr("fill-opacity", 0.6)
			.selectAll("rect");

		return ([date, data], transition) => bar = bar
			.data(data.slice(0, n), d => d.name)
			.join(
				enter => enter.append("rect")
					.attr("fill", "steelblue")
					.attr("height", y.bandwidth())
					.attr("x", x(0))
					.attr("y", d => y((prev.get(d) || d).rank))
					.attr("width", d => x((prev.get(d) || d).value) - x(0)),
				update => update,
				exit => exit.transition(transition).remove()
					.attr("y", d => y((next.get(d) || d).rank))
					.attr("width", d => x((next.get(d) || d).value) - x(0))
			)
			.call(bar => bar.transition(transition)
				.attr("y", d => y(d.rank))
				.attr("width", d => x(d.value) - x(0)));
	}

	function labels(svg) {
		let label = svg.append("g")
			.style("font", "bold 8px var(--sans-serif)")
			.style("font-variant-numeric", "tabular-nums")
			.attr("text-anchor", "end")
			.selectAll("text");

		return ([date, data], transition) => label = label
			.data(data.slice(0, n), d => d.name)
			.join(
				enter => enter.append("text")
					.attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
					.attr("y", y.bandwidth() / 2)
					.attr("x", -6)
					.attr("dy", "-0.25em")
					.attr("font-size", `${barSize/2 - 5}px`)
					.text(d => getStateName(d.name)) //TODO: if overflow show code only
					.call(text => text.append("tspan")
						.attr("fill-opacity", 0.7)
						.attr("font-weight", "normal")
						.attr("x", -6)
						.attr("dy", "1em")),
				update => update,
				exit => exit.transition(transition).remove()
					.attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
					.call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
			)
			.call(bar => bar.transition(transition)
				.attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
				.call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))));
	}

	function axis(svg) {
		const g = svg.append("g")
			.attr("transform", `translate(0,${margin.top})`);

		const axis = d3.axisTop(x)
			.ticks(width / 160)
			.tickSizeOuter(0)
			.tickSizeInner(-height);

		return (_, transition) => {
			g.transition(transition).call(axis);
			g.select(".tick:first-of-type text").remove();
			g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
			g.select(".domain").remove();
		};
	}

	// show frame date
	function ticker(svg) {
		const now = svg.append("text")
			.style("font", `${barSize}px var(--sans-serif)`)
			.style("font-variant-numeric", "tabular-nums")
			.attr("text-anchor", "end")
			.attr("x", width - 6)
			.attr("y", height - 10)
			.attr("dy", "0.32em")
			.text(formatDate(keyframes[0][0]));

		return ([date], transition) => {
			transition.end().then(() => now.text(formatDate(date)));
		};
	}


}).catch(function (error) {
	console.log(error);
});
