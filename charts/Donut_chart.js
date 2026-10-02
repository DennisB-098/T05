import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { csvDataReady } from "../load_data.js";

// Select the second dashboard panel where this chart will be drawn.
const chart = d3.select("#chart-two");
const datasetName = "Ex5_TV_energy_Allsizes_byScreenType";
const valueColumn = "Mean(Labelled energy consumption (kWh/year))";

function drawDonutChart(rows) {
	// Keep only screen technologies with valid numeric mean-consumption values.
	const values = rows
		.map((row) => ({
			technology: row.Screen_Tech,
			consumption: row[valueColumn],
		}))
		.filter(
			(row) => row.technology && Number.isFinite(row.consumption) && row.consumption > 0,
		);

	if (values.length === 0) {
		chart.append("p").attr("class", "scatter-message").text("No chartable rows found.");
		return;
	}

	const technologies = values.map((row) => row.technology);
	const color = d3.scaleOrdinal(technologies, d3.schemeTableau10);
	const svg = chart.append("svg").attr("class", "donut-svg");
	const legend = chart.append("div").attr("class", "donut-legend");

	// A pie layout converts each mean value into an angular slice for the donut.
	const pie = d3
		.pie()
		.value((row) => row.consumption)
		.sort(null);
	const arcs = d3
		.arc()
		.padAngle(0.025)
		.cornerRadius(3);

	// Build one legend entry per technology and show its actual annual mean.
	legend
		.selectAll("div")
		.data(values)
		.join("div")
		.attr("class", "donut-legend-item")
		.each(function (row) {
			const item = d3.select(this);
			item
				.append("span")
				.attr("class", "donut-legend-swatch")
				.style("background-color", color(row.technology));
			item
				.append("span")
				.attr("class", "donut-legend-label")
				.text(row.technology);
			item
				.append("span")
				.attr("class", "donut-legend-value")
				.text(`${d3.format(",.1f")(row.consumption)} kWh/yr`);
		});

	function render() {
		// Recompute the SVG dimensions when the chart panel changes width.
		const width = Math.max(280, chart.node().clientWidth);
		const height = Math.max(260, Math.min(340, width * 0.72));
		const radius = Math.min(width, height) / 2 - 14;

		svg.attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
		svg.selectAll("*").remove();

		const plot = svg
			.append("g")
			.attr("transform", `translate(${width / 2},${height / 2})`);

		// The data join creates one SVG path for each technology's donut slice.
		plot
			.selectAll("path")
			.data(pie(values))
			.join("path")
			.attr("class", "donut-slice")
			.attr("fill", (slice) => color(slice.data.technology))
			.attr("d", arcs.innerRadius(radius * 0.58).outerRadius(radius))
			.append("title")
			.text(
				(slice) =>
					`${slice.data.technology}: ${d3.format(",.1f")(slice.data.consumption)} kWh/year mean`,
			);

		// Center text clarifies that the slices show annual means, not total usage.
		plot
			.append("text")
			.attr("class", "donut-center-title")
			.attr("text-anchor", "middle")
			.attr("y", -3)
			.text("Annual mean");
		plot
			.append("text")
			.attr("class", "donut-center-unit")
			.attr("text-anchor", "middle")
			.attr("y", 20)
			.text("kWh / year");
	}

	let resizeFrame = 0;
	// Redraw on the next animation frame to keep the donut responsive.
	const resizeObserver = new ResizeObserver(() => {
		cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(render);
	});

	resizeObserver.observe(chart.node());
	render();
}

// Wait until the shared loader finishes, then draw with the all-sizes dataset.
csvDataReady
	.then((data) => {
		const rows = data[datasetName];
		if (!rows) throw new Error(`Dataset ${datasetName} was not loaded.`);
		drawDonutChart(rows);
	})
	.catch((error) => {
		console.error("Failed to draw TV energy donut chart:", error);
		chart
			.append("p")
			.attr("class", "scatter-message")
			.text("Could not load chart data.");
	});
