import "./grid.scss";
import "./style.less";
import { Grid, Formatters } from "slickgrid-es6";
import data from "./example-data";

// variables
let idGrid = "#myFirstGrid";
let grid;

const columns = [
  {
    id: "title",
    name: "Title",
    field: "title",
    width: 120,
    cssClass: "cell-title",
  },
  { id: "duration", name: "Duration", field: "duration" },
  {
    id: "%",
    name: "% Complete",
    field: "percentComplete",
    width: 80,
    resizable: false,
    formatter: Formatters.PercentCompleteBar,
  },
  { id: "start", name: "Start", field: "start", minWidth: 60 },
  { id: "finish", name: "Finish", field: "finish", minWidth: 60 },
  {
    id: "effort-driven",
    name: "Effort Driven",
    sortable: false,
    width: 80,
    minWidth: 20,
    maxWidth: 80,
    cssClass: "cell-effort-driven",
    field: "effortDriven",
    formatter: Formatters.Checkmark,
  },
];

const options = {
  editable: false,
  enableAddRow: false,
  enableCellNavigation: true,
  enableColumnReorder: false,
};

// draw the grid
grid = new Grid(idGrid, data, columns, options);
