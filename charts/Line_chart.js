import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { csvDataReady } from "../load_data.js";

const chart = d3.select("#chart-four");
const datasetName = "Ex5_ARE_Spot_Prices";
const averageColumn = "Average Price (notTas-Snowy)";

function drawLineChart(rows) {
    // Keep valid year/average pairs and order them before drawing the line.
    const values = rows
        .map((row) => ({ year: row.Year, price: row[averageColumn] }))
        .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.price))
        .sort((first, second) => first.year - second.year);

    if (values.length === 0) {
        chart.append("p").attr("class", "scatter-message").text("No chartable rows found.");
        return;
    }

    const svg = chart.append("svg").attr("class", "price-line-svg");

    function render() {
        // Resize the SVG and its scales to fit the chart panel.
        const width = Math.max(240, chart.node().clientWidth);
        const height = Math.max(250, Math.min(330, width * 0.72));
        const margin = { top: 16, right: 18, bottom: 46, left: 58 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        // Scales convert year and price values into positions in the SVG plot.
        const x = d3
            .scaleLinear()
            .domain(d3.extent(values, (row) => row.year))
            .range([0, plotWidth]);
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(values, (row) => row.price)])
            .nice()
            .range([plotHeight, 0]);

        const xAxis = d3
            .axisBottom(x)
            .ticks(Math.max(3, Math.floor(plotWidth / 55)))
            .tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(y).ticks(5).tickFormat((price) => `$${price}`);

        svg.attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
        svg.selectAll("*").remove();

        const plot = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Draw horizontal grid lines behind the data for easier value comparison.
        plot
            .append("g")
            .attr("class", "line-grid")
            .call(d3.axisLeft(y).ticks(5).tickSize(-plotWidth).tickFormat(""));

        plot
            .append("g")
            .attr("class", "line-axis")
            .attr("transform", `translate(0,${plotHeight})`)
            .call(xAxis);
        plot.append("g").attr("class", "line-axis").call(yAxis);

        // D3's line generator maps the ordered yearly averages to one SVG path.
        const line = d3
            .line()
            .x((row) => x(row.year))
            .y((row) => y(row.price));
        plot.append("path").datum(values).attr("class", "price-line").attr("d", line);

        // Small points provide precise hover values for individual years.
        plot
            .selectAll("circle")
            .data(values)
            .join("circle")
            .attr("class", "price-point")
            .attr("cx", (row) => x(row.year))
            .attr("cy", (row) => y(row.price))
            .attr("r", 3.5)
            .append("title")
            .text((row) => `${row.year}: $${d3.format(",.2f")(row.price)} per MWh`);

        plot
            .append("text")
            .attr("class", "line-axis-label")
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight + 40)
            .attr("text-anchor", "middle")
            .text("Year");
    }

    let resizeFrame = 0;
    // Redraw after panel size changes, batching rapid resize events per frame.
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
        drawLineChart(rows);
    })
    .catch((error) => {
        console.error("Failed to draw spot-price line chart:", error);
        chart
            .append("p")
            .attr("class", "scatter-message")
            .text("Could not load chart data.");
    });
