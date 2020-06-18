/**
 * Set the dimensions and margins for the graph
 */

var margin = { top: 30, right: 30, bottom: 80, left: 80 },
    width = 1000 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom,
    padding = 0.3;

/**
 * Append the svg to the body of the container
 */

var svg = d3.select("#svgcontainer")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

/**
 * create the graph
 */

d3.csv("stackedWaterfall.csv").then(function(data) {
    var cumulative = 0;

    for (var i = 0; i < data.length - 1; i++) {
        data[i].start = cumulative;
        cumulative += parseInt(data[i].amount);
        data[i].end = cumulative;
        data[i].class = (data[i].amount >= 0) ? 'positive' : 'negative'

    }
    data.splice(data.length - 1, 0, {
        name: 'Total',
        end: cumulative,
        start: 0,
        class: "total"
    })

    data.splice(data.length - 1, 0, { //dit is een gepushed kopie van AOP
        name: "AOP",
        end: data[data.length - 1].amount,
        start: 0,
        class: "AOPBar"
    })

    var x = d3.scaleBand()
        .domain(d3.range(data.length - 1)) //de initiële aop wordt niet meegenomen, maar wordt vervangen door een gepushed kopie
        .range([0, width])
        .padding(0.2);

    svg.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(i => data[i].name));

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) {
            return d.end;
        })])
        .range([height, 0]);
    svg
        .append('g')
        .attr("class", "yaxis")
        .attr("tranform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y));



    var bar = svg.append("g")

    .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("class", (d) => d.class)
        .attr("x", (d, i) => x(i))
        .attr("y", function(d) { return y(Math.max(d.start, d.end)); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) {
            return Math.abs(y(d.start) - y(d.end));
        });

    var line = svg.append("g")
        .selectAll("line")
        .data(data)
        .join("line")
        .attr("class", (d) => d.name)
        .attr("x1", (d, i) => x(i + 1) - 50)
        .attr("y1", function(d) { return y(d.end) })
        .attr("x2", (d, i) => x(i + 1))
        .attr("y2", function(d) { return y(d.end) });

    /**
     * color coding AOP
     */
    var amountTotal = data[4].end;
    var amountAOP = data[data.length - 1].amount

    if (amountAOP > amountTotal) {
        d3.selectAll(".AOPBar")
            .attr("id", "negativeEvolution");
    } else if (amountAOP < amountTotal) {
        d3.selectAll(".AOPBar")
            .attr("id", "positiveEvolution");
    }

    /**
     * target line and text
     */

    var targetline = d3.select(".Total")
        .attr("x2", width)
        .style("stroke", "black")
        .style("stroke-width", 1);

    var targetLabelAmount = "";
    if (moneyFormatter(amountTotal - amountAOP) >= 0) {
        targetLabelAmount = "-" + moneyFormatter(amountTotal - amountAOP);
    } else {
        targetLabelAmount = "+" + moneyFormatter(amountTotal - amountAOP)
    };

    var targetText = svg.append("g")
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("class", "targetLabelText")
        .attr("x", width - 100)
        .attr("y", (function(d) { return Math.max(d.end) }))
        .attr("dy", -10)
        .text(targetLabelAmount);

    /**
     * labels on the bars 
     */
    var text = svg.append("g")
        .selectAll(".AOP")
        .data(data)
        .join("text")
        .attr("class", (d) => d.name + " Text")
        .attr("x", (d, i) => x(i) + 45)
        .attr("y", function(d) { return y(d.end) - 5 })
        .text(function(d) { return moneyFormatter(d.end); })
        .style("font-size", "smaller");


    var lastBarText = d3.selectAll(".AOP")
        .attr("y", function(d) { return y(d.end) + 15 });

})

function moneyFormatter(n) {
    return n / 1000000 + "M";
}