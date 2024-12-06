// Set up responsive dimensions
const width = window.innerWidth;
const height = window.innerHeight;

// Create the SVG container
const svg = d3.select("#visualization")
  .attr("width", width)
  .attr("height", height);

const targetValues = [3838853523, 1749533868, 1515151515];

// Helper function for generating random positions within a range
const getRandomInRange = (min, max) => Math.random() * (max - min) + min;

// add
const popupContainer = d3.select("body")
    .append("div")
    .attr("id", "popup")
    .style("display", "none") 
    .style("position", "absolute")
    .style("left", "20%")
    .style("top", "45%")
    .style("transform", "translate(-50%, -50%)")
    .style("padding", "20px")
    .style("background-color", "white")
    .style("border", "1px solid","#e5e5e5")
    .style("box-shadow", "0px 4px 6px rgba(0,0,0,0.1)")
    .style("z-index", "1000")
    .style("box-sizing", "border-box")
    .style("width", "600px") 
    .style("height", "600px")
    .style("overflow", "auto")
    .style("opacity", "0.9");

const chartWidth = 800;
const chartHeight = 600;
const chartSvg = d3.select("body")
    .append("svg")
    .attr("class", "chart-container")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .style("display", "none") 
    .attr("id", "lineChart")
    .style("position", "absolute")
    .style("left", "50px")
    .style("top", "200px");

let clickedLabel = false;
let clickedLine = false;
// add

// Load the data
d3.csv("emoji_visualization_data.csv").then(data => {
  // Parse and clean data
  data.forEach(d => {
    d.Use = +d.Use; // Parse 'Use' as number
    d.Design = +d.Design; // Parse 'Design' as number
    d["User Age"] = +d["User Age"]; // Parse 'User Age' as number
    Object.keys(d).forEach(key => {
      if (key.match(/^\d{4}-\d{2}$/)) {
          d[key] = +d[key] || null; // Convert time-series data to numbers
      }
  });
  });

  // Set up scales
  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d["User Age"])) // Age range
    .range([height, 0]);

  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.Use)]) // Scale for radius
    .range([10, 80]); // Retain larger radius range

  // Define horizontal ranges for different design year groups
  const yearRanges = {
    "2008": [0, width / 3], // Random range for 2008
    "2012": [width / 3, (2 * width) / 3], // Random range for 2012
    "2014+": [(2 * width) / 3, width] // Random range for >2014
  };

  // Initialize random positions
  data.forEach(d => {
    if (d.Design === 2008) {
      d.x = getRandomInRange(yearRanges["2008"][0], yearRanges["2008"][1]);
    } else if (d.Design === 2012) {
      d.x = getRandomInRange(yearRanges["2012"][0], yearRanges["2012"][1]);
    } else {
      d.x = getRandomInRange(yearRanges["2014+"][0], yearRanges["2014+"][1]);
    }
    d.y = getRandomInRange(height / 4, (3 * height) / 4); // Random y position
  });

  // Create force simulation
  const simulation = d3.forceSimulation(data)
    .force("x", d3.forceX(d => d.x).strength(0.5)) // Center to target x positions
    .force("y", d3.forceY(d => d.y).strength(0.5)) // Center to target y positions
    .force("collision", d3.forceCollide(d => rScale(d.Use) + 5)) // Prevent overlap
    .on("tick", ticked);

  // Create circles
  const circles = svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", d => rScale(d.Use)) // Radius based on 'Use'
    .attr("fill", "steelblue")
    .attr("opacity", 0.7);

  // Add Emoji text in the center of each circle
  const labels = svg.selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em") // Center vertically
    .attr("font-size", d => `${rScale(d.Use) / 2}px`) // Font size proportional to circle radius
    .text(d => d.Emoji); // Use the Emoji from the data

  // Update circle positions on each tick
  function ticked() {
    circles
      .attr("cx", d => Math.max(rScale(d.Use), Math.min(width - rScale(d.Use), d.x))) // Constrain within width
      .attr("cy", d => Math.max(rScale(d.Use), Math.min(height - rScale(d.Use), d.y))); // Constrain within height

    labels
      .attr("x", d => Math.max(rScale(d.Use), Math.min(width - rScale(d.Use), d.x))) // Center text horizontally
      .attr("y", d => Math.max(rScale(d.Use), Math.min(height - rScale(d.Use), d.y))); // Center text vertically
  }

// add
circles.filter(d => targetValues.includes(d.Use))
    .attr("stroke", "black")
    .attr("stroke-width", 2);

circles.each(function (d) {
  d.isSelected = false;
});

function startFlashing(selection) {
  selection.transition()
      .duration(1000)
      .attr("opacity", 0.3) // Dim to 50%
      .transition()
      .duration(1000)
      .attr("opacity", 1) // Brighten to 100%
      .on("end", function () {
          d3.select(this).call(startFlashing); // Loop the effect
      });
}

function startFlashing(selection) {
  selection.transition()
      .duration(1000)
      .attr("opacity", 1) // Increase to 100%
      .transition()
      .duration(1000)
      .attr("opacity", 0.3) // Dim back to 30%
      .on("end", function () {
          d3.select(this).call(startFlashing); // Loop the effect
      });
}

const interactiveLabels = labels.filter(d => targetValues.includes(d.Use))
    .call(startFlashing)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
        if (clickedLabel || clickedLine) return;
        const nonInteractiveLabels = labels.filter(d => !targetValues.includes(d.Use));
        const nonInteractiveCircles = circles.filter(d => !targetValues.includes(d.Use));
        const noncorrespondingCircles = circles.filter(c => c !== d);
        const correspondingCircle = circles.filter(c => c === d); 

        interactiveLabels.transition()
            .duration(500)
            .attr("opacity", 0.2);

        nonInteractiveLabels.transition()
            .duration(500)
            .attr("opacity", 0.2);

        nonInteractiveCircles.transition()
            .duration(500)
            .attr("opacity", 0.2);

        d3.select(this).transition()
            .duration(500)
            .attr("opacity", 1);

        correspondingCircle.transition()
            .duration(500)
            .attr("opacity", 0.95);

        noncorrespondingCircles.transition()
            .duration(500)
            .attr("opacity", 0.2);
    })
    .on("mouseout", function () {
        if (clickedLabel || clickedLine) return;
        interactiveLabels.call(startFlashing);

        labels.filter(d => !targetValues.includes(d.Use))
            .transition()
            .duration(500)
            .attr("opacity", 1);

        circles.transition()
            .duration(500)
            .attr("opacity", 0.8);
    })
    .on("click", function (event, d) {
      let clickedCircle = circles.filter(c => c === d);
      let otherCircles = circles.filter(c => c !== d);
      let otherLabels = labels.filter(l => l !== d);
      
        clickedLabel = true;
        labels.transition()
            .duration(500)
            .attr("opacity", 0.05);

        circles.transition()
            .duration(500)
            .attr("opacity", 0.05);

        // Show the clicked label and circle fully
        d3.select(this).transition()
            .duration(500)
            .attr("opacity", 0.65);

        clickedCircle.transition()
            .duration(500)
            .attr("opacity", 0.5);

        otherLabels.transition()
            .duration(500)
            .attr("opacity", 0.05);

        otherCircles.transition()
            .duration(500)
            .attr("opacity", 0.05);

        // Show the chart and draw the line chart
        drawLineChart(d);
    });

    function drawLineChart(d) {
        const timeKeys = Object.keys(d).filter(key => key.match(/^\d{4}-\d{2}$/));
        const timeSeriesData = timeKeys.map(key => ({ time: key, value: d[key] }));
    
        const validData = timeSeriesData.filter(d => d.value !== null && !isNaN(d.value));
    
        if (validData.length === 0) {
            console.error("No valid data points for the selected circle");
            return;
        }
    
        // Show the chart container
        chartSvg.style("display", "block");
    
        // Clear the previous chart
        chartSvg.selectAll("*").remove();
    
        // Set up scales
        const xScale = d3.scalePoint()
            .domain(validData.map(d => d.time))
            .range([50, chartWidth - 50]);
    
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(validData, d => d.value)])
            .range([chartHeight - 50, 50]);
    
        const tickValues = validData.map(d => d.time).filter((_, i) => i % 10 === 0);
    
        // Add x-axis
        const xAxis = chartSvg.append("g")
            .attr("transform", `translate(0,${chartHeight - 50})`)
            .call(
                d3.axisBottom(xScale)
                    .tickValues(validData.map(d => d.time))
                    .tickFormat(d => (tickValues.includes(d) ? d : ""))
            );
    
        xAxis.selectAll(".tick")
            .filter(d => tickValues.includes(d))
            .select("line")
            .style("stroke-width", "1.5px")
            .attr("y2", "9");
    
        // Add y-axis
        chartSvg.append("g")
            .attr("transform", `translate(50,0)`)
            .call(d3.axisLeft(yScale));

        chartSvg.append("text")
            .attr("class", "axis-label")
            .attr("x", chartWidth / 2) // Center the label horizontally
            .attr("y", chartHeight - 10) // Below the x-axis
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "black")
            .text("Time");
    
        // Y-axis label
        chartSvg.append("text")
        .attr("class", "axis-label")
            .attr("transform", "rotate(-90)") // Rotate the text
            .attr("x", -chartHeight / 2) // Center vertically (after rotation)
            .attr("y", 20) // Left of the y-axis
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "black")
            .text("Usage per 10000 historic tweets");
    
        // Add line
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.value));
    
        const path = chartSvg.append("path")
            .datum(validData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 4)
            .attr("d", line)
            .style("cursor", "pointer")
            .attr("stroke-dasharray", function () {
                const totalLength = this.getTotalLength();
                return `${totalLength} ${totalLength}`;
            })
            .attr("stroke-dashoffset", function () {
                return this.getTotalLength();
            })
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", function () {
                console.log("Line animation completed");
    
                // Bind click event after animation completes
                d3.select(this).on("click", function (event) {
                    event.stopPropagation();
                    clickedLine = true;
                    clickedLabel = true;
    
                    // Reduce opacity of all graphics
                    circles.transition()
                        .duration(500)
                        .attr("opacity", 0.15);

                    labels.transition()
                    .duration(500)
                    .attr("opacity", 0.2);

    
                    chartSvg.selectAll("path").transition()
                        .duration(500)
                        .attr("opacity", 0.15);
    
                    xAxis.transition()
                        .duration(500)
                        .attr("opacity", 0.15);

                    chartSvg.selectAll("g").transition()
                        .duration(500)
                        .attr("opacity", 0.15);

                    chartSvg.selectAll(".axis-label").transition()
                        .duration(500)
                        .attr("opacity", 0.15);
                    // Show popup with description
                    popupContainer.style("display", "block")
                        .html(`
                            <div style="position: relative; padding: 20px;">
                                <button id="closePopup" style="
                                    position: absolute;
                                    top: 0px;
                                    right: 0px;
                                    font-size: 12px;
                                    cursor: pointer;
                                "> × </button>
                                <div style="margin-top: 3px;">
                ${
                    d.story
                        ? d.story
                              .split(/\r?\n/) 
                              .map(paragraph => `<p>${paragraph}</p>`)
                              .join("") 
                        : "No story available"
                }
                                </div>
                            </div>
                        `);
    
                    // Close popup functionality
                    d3.select("#closePopup").on("click", () => {

                        popupContainer.style("display", "none");

                        const interactiveCircles = circles.filter(d => targetValues.includes(d.Use));
                        const nonInteractiveCircles = circles.filter(d => !targetValues.includes(d.Use));
                        const nonInteractiveLabels = labels.filter(d => !targetValues.includes(d.Use));
                        const interactiveLabels = labels.filter(d => targetValues.includes(d.Use))

                        interactiveCircles.transition().duration(500).attr("opacity", 0.5);
                        nonInteractiveCircles.transition().duration(500).attr("opacity", 0.1);
                        labels.transition().duration(500).attr("opacity", 0.3);
                        d3.select(this).call(startFlashing);
                        xAxis.transition()
                            .duration(500)
                            .attr("opacity", 1);
                        chartSvg.selectAll("g").transition()
                            .duration(500)
                            .attr("opacity", 1);
                        chartSvg.selectAll(".axis-label").transition()
                            .duration(500)
                            .attr("opacity", 1);
                        nonInteractiveLabels.transition()
                            .duration(500)
                            .attr("opacity", 1);
                        chartSvg.selectAll("path").transition().duration(500).attr("opacity", 1);
                        interactiveLabels.call(startFlashing);
                        clickedLabel = false;
                        clickedLine = false;
                    });
                });
            });
    
        // Add close button for the chart
        chartSvg.append("rect")
            .attr("x", chartWidth - 60)
            .attr("y", 20)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "white")
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("rx", 5)
            .attr("ry", 5)
            .style("cursor", "pointer")
            .on("click", function () {
                chartSvg.style("display", "none");
                clickedCircle = false;
                clickedLine = false;
    
                // Reset opacity of circles
                circles.transition().duration(500).attr("opacity", 0.8);
            });
    
        chartSvg.append("text")
            .attr("x", chartWidth - 50)
            .attr("y", 32)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "black")
            .style("font-size", "20px")
            .style("z-index", "1000")
            .style("cursor", "pointer")
            .text("×")
            .on("click", function () {
                const nonInteractiveLabels = labels.filter(d => !targetValues.includes(d.Use));
                const interactiveLabels = labels.filter(d => targetValues.includes(d.Use))
                chartSvg.style("display", "none");
                clickedLabel = false;
                clickedLine = false;
    
                // Reset opacity of circles
                circles.transition().duration(500).attr("opacity", 0.8);
                nonInteractiveLabels.transition()
                      .duration(500)
                      .attr("opacity", 1);
                interactiveLabels.call(startFlashing);
            });
    }

circles.filter(d => d.Use <= 4000)
    .style("cursor", "default");
// add
});