import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { csvDataReady } from "../load_data.js";

// A D3 selection connects the chart code to its HTML mount point.
const chart = d3.select("#chart-one");
const datasetName = "Ex5_TV_energy";

function drawScatterPlot(rows) {
	// Ignore rows missing either measurement so they cannot break the scales.
	const points = rows.filter(
		(row) => Number.isFinite(row.energy_consumpt) && Number.isFinite(row.star2),
	);

	if (points.length === 0) {
		chart.append("p").attr("class", "scatter-message").text("No chartable rows found.");
		return;
	}

	const screenTypes = Array.from(new Set(points.map((row) => row.screen_tech))).sort();
	const color = d3.scaleOrdinal(screenTypes, d3.schemeTableau10);
	const svg = chart.append("svg").attr("class", "scatter-svg");
	const legend = chart.append("div").attr("class", "scatter-legend");

	// Bind each screen type to one legend entry; join creates the matching elements.
	legend
		.selectAll("span")
		.data(screenTypes)
		.join("span")
		.attr("class", "scatter-legend-item")
		.each(function (screenType) {
			d3.select(this)
				.append("span")
				.attr("class", "scatter-legend-swatch")
				.style("background-color", color(screenType));
			d3.select(this).append("span").text(screenType);
		});

	function render() {
		// Recalculate the drawing area from the panel's current width.
		const width = Math.max(280, chart.node().clientWidth);
		const height = Math.max(260, Math.min(380, width * 0.68));
		const margin = { top: 18, right: 16, bottom: 54, left: 62 };
		const plotWidth = width - margin.left - margin.right;
		const plotHeight = height - margin.top - margin.bottom;

		// Scales translate data values into SVG pixel coordinates.
		const x = d3
			.scaleLinear()
			.domain(d3.extent(points, (row) => row.energy_consumpt))
			.nice()
			.range([0, plotWidth]);
		const y = d3
			.scaleLinear()
			.domain(d3.extent(points, (row) => row.star2))
			.nice()
			.range([plotHeight, 0]);

		svg.attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
		// Rebuild the SVG for the new size when the panel changes dimensions.
		svg.selectAll("*").remove();

		const plot = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// D3 axes draw the grid, tick marks, and labels from the scales.
		plot
			.append("g")
			.attr("class", "scatter-grid")
			.call(d3.axisLeft(y).ticks(5).tickSize(-plotWidth).tickFormat(""));

		plot
			.append("g")
			.attr("class", "scatter-axis")
			.attr("transform", `translate(0,${plotHeight})`)
			.call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(plotWidth / 75))));

		plot
			.append("g")
			.attr("class", "scatter-axis")
			.call(d3.axisLeft(y).ticks(5));

		plot
			.append("text")
			.attr("class", "scatter-axis-label")
			.attr("x", plotWidth / 2)
			.attr("y", plotHeight + 43)
			.attr("text-anchor", "middle")
			.text("Energy consumption (kWh/year)");

		plot
			.append("text")
			.attr("class", "scatter-axis-label")
			.attr("transform", "rotate(-90)")
			.attr("x", -plotHeight / 2)
			.attr("y", -46)
			.attr("text-anchor", "middle")
			.text("Star rating");

		// Bind each CSV row to a circle; each circle's position comes from its x/y values.
		plot
			.selectAll("circle")
			.data(points)
			.join("circle")
			.attr("class", "scatter-dot")
			.attr("cx", (row) => x(row.energy_consumpt))
			.attr("cy", (row) => y(row.star2))
			.attr("r", 4)
			.attr("fill", (row) => color(row.screen_tech))
			.append("title")
			.text(
				(row) =>
					`${row.brand} | ${row.screen_tech} | ${row.screensize} in | ${row.energy_consumpt} kWh/year | ${row.star2} stars`,
			);
	}

	let resizeFrame = 0;
	// Observe the panel and schedule redraws on the next frame during resizing.
	const resizeObserver = new ResizeObserver(() => {
		cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(render);
	});

	resizeObserver.observe(chart.node());
	render();
}

// Wait for the shared CSV loader before drawing; report loading or rendering errors.
csvDataReady
	.then((data) => {
		const rows = data[datasetName];
		if (!rows) throw new Error(`Dataset ${datasetName} was not loaded.`);
		drawScatterPlot(rows);
	})
	.catch((error) => {
		console.error("Failed to draw TV energy scatter plot:", error);
		chart
			.append("p")
			.attr("class", "scatter-message")
			.text("Could not load chart data.");
	});
