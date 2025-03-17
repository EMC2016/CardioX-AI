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
      .domain(data.map((d) => new Date(d.timestamp)))
      .range([0, width])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => +d.value) * 1.1])
      .range([height, 0]);

    // Set up the X axis labels
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m")).ticks(3))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .style("font-size", "12px");

    // Set up the X axis labels
    svg.append("g").call(d3.axisLeft(yScale).ticks(4));

    // Set up bars
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
      })
      .attr("opacity", 0.9)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "yellow").attr("opacity", 1); // Change color on hover
        svg
          .append("text")
          .attr("class", "tooltip-text")
          .attr("x", xScale(d.timestamp) + xScale.bandwidth() / 2) // Center above bar
          .attr("y", yScale(+d.value) - 5) // Position slightly above bar
          .attr("text-anchor", "middle") // Center text
          .attr("font-size", "12px")
          .attr("fill", "black")
          .text(d.value); // ✅ Show value
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .attr("fill", (d) => {
            const currange = normalRange[category] || { min: 0, max: 100 };
            return +d.value < currange.min || +d.value > currange.max
              ? "orange"
              : "green";
          })
          .attr("opacity", 0.9);

        svg.selectAll(".tooltip-text").remove();
      });
    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(normalRange[category].max))
      .attr("y2", yScale(normalRange[category].max))
      .attr("stroke", "blue")
      .attr("stroke-dasharray", "5,5");

    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(normalRange[category].min))
      .attr("y2", yScale(normalRange[category].min))
      .attr("stroke", "blue")
      .attr("stroke-dasharray", "5,5");
  }, [data, category, normalRange]);

  return <div ref={chartRef} className="chart-container"></div>; // ✅ Return a div for D3 to use
}

function CreateLegend() {
  console.log("Create legends"); // ✅ Debug log

  const legendRef = useRef(null); // ✅ Create a ref

  useEffect(() => {
    if (!legendRef.current) return; // ✅ Prevent running if ref is not ready

    const legendContainer = d3.select(legendRef.current);
    legendContainer.selectAll("*").remove(); // ✅ Clear previous elements

    // ✅ Create legend inside the correct container
    legendContainer
      .append("div")
      .attr("id", "legend")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")
      .style("gap", "15px")
      .style("margin-bottom", "10px");

    // Normal (Square)
    legendContainer
      .append("span")
      .style("display", "inline-block")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", "green")
      .style("margin-right", "5px");

    legendContainer.append("span").text("Normal");

    // Abnormal (Square)
    legendContainer
      .append("span")
      .style("display", "inline-block")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", "orange")
      .style("margin-left", "10px")
      .style("margin-right", "5px");

    legendContainer.append("span").text("Abnormal");

    // Normal Range (Blue Line)
    legendContainer
      .append("span")
      .style("display", "inline-block")
      .style("width", "20px")
      .style("height", "2px")
      .style("background-color", "blue")
      .style("margin-left", "10px")
      .style("margin-right", "5px");

    legendContainer.append("span").text("Normal Range");
  }, []);

  return <div ref={legendRef}></div>; // ✅ Return JSX for React to render
}

export { CreateBarChart, CreateLegend };
