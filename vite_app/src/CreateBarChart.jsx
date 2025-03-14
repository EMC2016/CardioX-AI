import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

function CreateBarChart({ data, category, normalRange }) {
  const chartRef = useRef(null); // ✅ Create a reference to the div

  useEffect(() => {
    if (!data || data.length === 0) return;
    if (!normalRange || !normalRange[category]) return;

    console.log("Rendering Chart for:", category);

    // ✅ Select the correct container dynamically using `useRef`
    const chartContainer = d3.select(chartRef.current);
    chartContainer.selectAll("*").remove(); // ✅ Clear previous charts

    const width = 280,
      height = 200,
      margin = { top: 30, right: 20, bottom: 50, left: 50 };

    const svg = chartContainer
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.timestamp))
      .range([0, width])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => +d.value) * 1.1])
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(3));
    svg.append("g").call(d3.axisLeft(yScale).ticks(4));

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.timestamp))
      .attr("y", (d) => yScale(+d.value))
      .attr("width", xScale.bandwidth() * 0.7)
      .attr("height", (d) => height - yScale(+d.value))
      .attr("fill", (d) => {
        const currange = normalRange[category] || { min: 0, max: 100 };
        return +d.value < currange.min || +d.value > currange.max
          ? "orange"
          : "green";
      });
  }, [data, category, normalRange]);

  return <div ref={chartRef} className="chart-container"></div>; // ✅ Return a div for D3 to use
}

export default CreateBarChart;
