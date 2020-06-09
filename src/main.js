import "./grid.scss";
import "./style.less";
import { Grid, Data, Formatters, Plugins } from "slickgrid-es6";
import data from "./example-data";
import { relativeTimeRounding } from "moment";
import { range, schemeDark2, transition } from "d3";
import "./bullet";

let idGrid = "#myFirstGrid";
let grid, dataView;
let searchString = "";
let selectedDuration;
let selectedInFirstDropdown = "";
let arrayWithColumnValues, uniqs, secondDropdown;
let selectedInSecondDropdown = "";
let maxData = d3.max(data, function(d) { return d3.max([d.current, d.previous, d.baseline]) });
let bulletdata, erasewaitingvalue, bulletcontainer, bulletchart, bulletchartSvg, svgAxis, xscale;
let chartWidth = 300;
let rowHeight = 40;
var widthSvgCanvas;
var lastcolumnwidth

/**
 * Definitions of the columns in the grid
 * 
 * Title column:
 * 
 * The variables:
 * 
 * @var columnName  -   Gets the text (here title) out of the span tag of the parent container
 * @var originalColumns -   Returns the array of columns like they are defined in 'const columns'
 * @var activeColumns   -   Returns the 'active columns': the duration column is filtered out by the function 'columns.filter(d => d.id != "duration")'
 * @var currentColumn   -   Returns an array with the object from the originalColumns of which the name attribute equals the text from the span tag
 * @var currentColumnIndex  -   activeColumns.map: Returns an array with the id's of the active columns
 *                              currentColumn[0].id: Return the id of the only object in currentColumn
 *                              complete method: Returns the index of the id equal to currentColumn[0].id (will be 0 here)
 * @var activeCssClass  -   Returns the cssClass of the first column (title)
 * @var newCssClass -   If the activeCssClass is equal to icon-collapse, icon-expand is returned, otherwise icon-collapse will be returned
 * 
 * 
 * The handling part of the title button handler function:
 * (1)  -   The newCssClass attribute will be put as the cssClass of the first column header 
 * (2)  -   Equals the object at place 0 of the activeColumns to the object in currentColumns
 * (3)  -   If the activeCssClass equals icon-expand -> the missing column is added (will be the column after the current one in the originalColumns)
 *          IF the activeCssClass equals icon-collaps -> the column next to the current one will be deleted
 * (4)  -   Adapt the columns in the grid to the renewed activeColumns
 * 
 */
const columns = [{
        id: "title",
        name: "Title",
        field: "title",
        width: 80,
        cssClass: "cell-title",
        sortable: false,
        header: {
            buttons: [{
                cssClass: "icon-expand",
                tooltip: "This button only appears on hover.",
                handler: function(e) {

                    var columnName = $(e.target).parent().children('span').text();
                    var originalColumns = getOriginalColumns();
                    var activeColumns = grid.getColumns();
                    var currentColumn = originalColumns.filter(d => d.name === columnName);
                    var currentColumnIndex = activeColumns.map(d => d.id).indexOf(currentColumn[0].id);
                    var activeCssClass = currentColumn[0].header.buttons[0].cssClass;
                    var newCssClass = activeCssClass === "icon-collapse" ? "icon-expand" : "icon-collapse";

                    currentColumn[0].header.buttons[0].cssClass = newCssClass; //(1)
                    activeColumns[currentColumnIndex] = currentColumn[0]; //(2)

                    if (activeCssClass === "icon-expand") {
                        var columnToAdd = originalColumns[currentColumnIndex + 1];
                        activeColumns.splice(currentColumnIndex + 1, 0, columnToAdd);

                    } else {
                        activeColumns.splice(currentColumnIndex + 1, 1);
                    } //(3)

                    grid.setColumns(activeColumns); //(4)

                    function changeAxisPosition() {

                        widthSvgCanvas = $(".ui-widget-content").width();
                        $("#parentAxis").width(widthSvgCanvas);
                    }
                    changeAxisPosition();
                }
            }]
        }
    },
    { id: "duration", field: "duration", width: 120, name: "Duration" },
    { id: "%", name: "% Complete", field: "percentComplete", width: 110, resizable: false, formatter: Formatters.PercentCompleteBar },
    { id: "effort-driven", name: "Effort Driven", sortable: false, width: 50, resizable: false, cssClass: "cell-effort-driven", field: "effortDriven", formatter: Formatters.Checkmark },
    { id: "baseline", name: "Baseline", field: "baseline" },
    { id: "previous", name: "Previous", field: "previous" },
    { id: "current", name: "Current", field: "current" },
    { id: "chart", name: "", sortable: true, width: 350, cssClass: "bulletchart", formatter: waitingFormatter, rerenderOnResize: true, asyncPostRender: renderChart }
];

const options = {
    editable: true,
    enableAddRow: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableAsyncPostRender: true,
    asyncEditorLoading: false,
    rowHeight: 35,
    multiColumnSort: true,
    explicitInitialization: true
};

/**
 * Initial grid definitions
 */

dataView = new Data.DataView();
grid = new Grid(idGrid, dataView, columns.filter(d => d.id != "duration"), options);

grid.init();

dataView.onRowCountChanged.subscribe(function(e, args) {
    grid.updateRowCount();
    grid.render();
});

dataView.onRowsChanged.subscribe(function(e, args) {
    grid.invalidateRows(args.rows);
    grid.render();
});

function getOriginalColumns() {
    return columns;
}

/**
 * Filter panel title search
 */

$("#titlesearch").keyup(function(e) {

    if (e.which == 27) {
        this.value = "";
    }
    searchString = this.value;
    dataView.refresh();
});


/**
 * Filter panel duration search
 */

const btnDuration = document.querySelector("#btn");

btnDuration.onclick = function() {
    const days = document.querySelectorAll('input[name="Choice"]');

    for (const day of days) {
        if (day.checked) {
            selectedDuration = day.value;
            dataView.refresh();
        }
    }
}


/**
 * Quick Search section
 */

d3.select("#dropdown")
    .on("change", function(d) {

        selectedInFirstDropdown = d3.select("#dropdown").node().value;

        arrayWithColumnValues = _.pluck(data, selectedInFirstDropdown);

        uniqs = _.uniq(arrayWithColumnValues);

        secondDropdown = d3.select("#select")

        secondDropdown
            .selectAll("*")
            .remove();

        secondDropdown
            .selectAll("option")
            .data(uniqs)
            .enter().append("option")
            .text(function(d) { return d; });

        secondDropdown.on("change", function(d) {
            selectedInSecondDropdown = d3.select("#select").node().value;
            dataView.refresh();
        })

        selectedInSecondDropdown = d3.select("#select").node().value;

        dataView.refresh();
    })


/**
 * Filtering en data binding
 */

dataView.setItems(data);
dataView.setFilter(item => {
    let result = true;

    if (searchString !== null) {
        result = result && item.title.includes(searchString);
    }

    if (selectedDuration > 0) {
        result = result && item.duration == selectedDuration;
    }

    if (selectedInFirstDropdown === "title") {
        if (selectedInSecondDropdown !== null) {
            result = result && item.title == selectedInSecondDropdown;
        }
    } else if (selectedInFirstDropdown === "duration") {
        if (selectedInSecondDropdown > 0) {
            result = result && item.duration == selectedInSecondDropdown;
        }
    }
    return result;
});


/**
 * Bullet Chart
 */

function waitingFormatter() {
    return "wait...";
}

function renderChart(cellNode, row, dataContext, colDef) {

    bulletdata = [{
        "ranges": [maxData],
        "measures": [dataContext["current"]],
        "markers": [dataContext["baseline"], dataContext["previous"]]
    }];

    erasewaitingvalue = $(cellNode).empty();

    bulletcontainer = d3.select(cellNode).node();

    bulletchart = d3.bullet()
        .width(chartWidth)
        .height(rowHeight);

    bulletchartSvg = d3.select(cellNode).selectAll("svg")
        .data(bulletdata)
        .enter().append("svg")
        .attr("class", "bullet")
        .attr("width", chartWidth)
        .attr("height", rowHeight)
        .append("g")
        .call(bulletchart)
        .style("fill", function() { return changeColor(bulletdata[0].measures[0], bulletdata[0].markers[1]) });


    function changeColor(a, b) {
        if (a >= b) {
            return "#378f6f";
        } else {
            return "salmon";
        }
    }
}


/**
 * x-Axis 
 */


function renderXAxis() {
    widthSvgCanvas = $(".ui-widget-content").width();
    $("#parentAxis").width(widthSvgCanvas);

    lastcolumnwidth = $(".bulletchart").width();

    svgAxis = d3.select("#axiscontainer")
        .append("svg")
        .attr("width", lastcolumnwidth)
        .attr("transform", "translate(0,0)");

    xscale = d3.scaleLinear()
        .domain([0, maxData])
        .range([10, lastcolumnwidth]);

    svgAxis.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "xaxis")
        .call(d3.axisBottom(xscale).ticks(5))
        .select(".domain").remove();

    svgAxis.append("text")
        .attr("class", "axistitle")
        .attr("x", 10)
        .attr("y", 40)
        .text("Current (bar) Vs Previous (black) Vs Baseline(grey)");


}
renderXAxis();

/**
 * headerbuttons: registration functions
 */

let headerButtonsPlugin = new Plugins.HeaderButtons();
grid.registerPlugin(headerButtonsPlugin);