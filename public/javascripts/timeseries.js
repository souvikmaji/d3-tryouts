var margin = {
		top: 30,
		right: 0,
		bottom: 30,
		left: 40
	},
	width = 1000 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

d3.json("/timeseries").then((data) => {
	data.map(function (d) {
		d.dailyconfirmed = +d.dailyconfirmed;
		return d;
	});
	return Object.assign(data,  {format: "%", y: "↑ Confirmed Cases"});
}).then((data) => {

	// set the ranges
	var x = d3.scaleBand()
		.domain(data.map(d => d.date))
		.range([margin.left, width - margin.right])
		.padding(0.1);

	var y = d3.scaleLinear()
		.domain([0, d3.max(data, d => d.dailyconfirmed)]).nice()
		.range([height - margin.bottom, margin.top]);

	y.domain([0, d3.max(data, function (d) {
		return d.dailyconfirmed;
	})]);

	// define the axis TODO: comeback to tickFOrmat
	var xAxis = g => g
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(x).tickFormat(i => i).tickSizeOuter(0));

	var yAxis = g => g
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(y))
		.call(g => g.select(".domain").remove())
		.call(g => g.append("text")
			.attr("x", -margin.left)
			.attr("y", 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.text(data.y));

	// add the SVG element TODO: come back
	var svg = d3.select("#timeseries").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")")
		.call(zoom);

	svg.append("g")
		.attr("class", "bars")
		.attr("fill", "steelblue")
		.selectAll("rect")
		.data(data)
		.join("rect")
		.attr("x", d => x(d.date))
		.attr("y", d => y(d.dailyconfirmed))
		.attr("height", d => y(0) - y(d.dailyconfirmed))
		.attr("width", x.bandwidth());

	// add axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height*2 + ")")
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", "-.55em")
		.attr("transform", "rotate(-90)");

	svg.append("g")
		.call(yAxis);

	function zoom(svg) {
		const extent = [[margin.left, margin.top], [width - margin.right, height - margin.top]];

		svg.call(d3.zoom()
			.scaleExtent([1, 8])
			.translateExtent(extent)
			.extent(extent)
			.on("zoom", zoomed));

		function zoomed() {
			x.range([margin.left, width - margin.right].map(d => d3.event.transform.applyX(d)));
			svg.selectAll(".bars rect").attr("x", d => x(d.date)).attr("width", x.bandwidth());
			svg.selectAll(".x-axis").call(xAxis);
		}
	}


}).catch(function (error) {
	console.log(error);
});
