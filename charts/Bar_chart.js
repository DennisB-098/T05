import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { csvDataReady } from "../load_data.js";

const chart = d3.select("#chart-three");
const datasetName = "Ex5_TV_energy_55inchtv_byScreenType";
const valueColumn = "Mean(Labelled energy consumption (kWh/year))";

function drawBarChart(rows) {
    // Convert the CSV rows to the two fields needed and discard invalid values.
    const values = rows
        .map((row) => ({
            technology: row.Screen_Tech,
            consumption: row[valueColumn],
        }))
        .filter(
            (row) => row.technology && Number.isFinite(row.consumption) && row.consumption >= 0,
        )
        .sort((first, second) => second.consumption - first.consumption);

    if (values.length === 0) {
        chart.append("p").attr("class", "scatter-message").text("No chartable rows found.");
        return;
    }

    const color = d3.scaleOrdinal(
        values.map((row) => row.technology),
        d3.schemeTableau10,
    );
    const svg = chart.append("svg").attr("class", "bar-svg");

    function render() {
        // Recalculate chart dimensions so the bars fit the available panel width.
        const width = Math.max(280, chart.node().clientWidth);
        const height = Math.max(250, Math.min(320, values.length * 54 + 90));
        const margin = { top: 12, right: 88, bottom: 48, left: 62 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        // These scales map category names and energy values to SVG coordinates.
        const x = d3
            .scaleLinear()
            .domain([0, d3.max(values, (row) => row.consumption)])
            .nice()
            .range([0, plotWidth]);
        const y = d3
            .scaleBand()
            .domain(values.map((row) => row.technology))
            .range([0, plotHeight])
            .padding(0.24);

        svg.attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
        svg.selectAll("*").remove();

        const plot = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // The bottom axis and grid show the energy-consumption scale.
        plot
            .append("g")
            .attr("class", "bar-grid")
            .call(d3.axisBottom(x).ticks(5).tickSize(plotHeight).tickFormat(""));
        plot
            .append("g")
            .attr("class", "bar-axis")
            .attr("transform", `translate(0,${plotHeight})`)
            .call(d3.axisBottom(x).ticks(5));
        plot.append("g").attr("class", "bar-axis").call(d3.axisLeft(y).tickSize(0));

        // Bind each technology to a bar and matching value label.
        plot
            .selectAll("rect")
            .data(values)
            .join("rect")
            .attr("class", "energy-bar")
            .attr("x", 0)
            .attr("y", (row) => y(row.technology))
            .attr("width", (row) => x(row.consumption))
            .attr("height", y.bandwidth())
            .attr("fill", (row) => color(row.technology))
            .append("title")
            .text((row) => `${row.technology}: ${d3.format(",.1f")(row.consumption)} kWh/year`);

        plot
            .selectAll(".bar-value")
            .data(values)
            .join("text")
            .attr("class", "bar-value")
            .attr("x", (row) => x(row.consumption) + 7)
            .attr("y", (row) => y(row.technology) + y.bandwidth() / 2)
            .attr("dominant-baseline", "middle")
            .text((row) => d3.format(",.1f")(row.consumption));

        plot
            .append("text")
            .attr("class", "bar-axis-label")
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight + 40)
            .attr("text-anchor", "middle")
            .text("Mean energy consumption (kWh/year)");
    }

    let resizeFrame = 0;
    // Debounce resize events to redraw once per animation frame.
    const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(render);
    });

    resizeObserver.observe(chart.node());
    render();
}

csvDataReady
    .then((data) => {
        const rows = data[datasetName];
        if (!rows) throw new Error(`Dataset ${datasetName} was not loaded.`);
        drawBarChart(rows);
    })
    .catch((error) => {
        console.error("Failed to draw 55-inch TV energy bar chart:", error);
        chart
            .append("p")
            .attr("class", "scatter-message")
            .text("Could not load chart data.");
    });
