const { removeChildren, createTH, createTR, createTD } = require("./DOMUtils.js");
const { getLetterRange, calculateSum } = require("./ArrayUtils.js");

class TableView {

  constructor(model) {
    this.model = model;
  }

  init() {
    this.initDOMReference();
    this.initCurrentCellLocation();
    this.renderTable();
    this.renderFormulaBar();
    this.attachEventHandlers();
    
  }

  initDOMReference() {
    this.tableHeader = document.querySelector("THEAD TR");
    this.tableBody = document.querySelector("TBODY");
    this.tableFooter = document.querySelector("TFOOT TR");
    this.formulaBar = document.querySelector("#formula");
    
  }

  initCurrentCellLocation() {
    this.currentCellLocation = { "col": 0, "row": 0 };
  }

  isCurrentCell(row, col) {
    return this.currentCellLocation.row === row && this.currentCellLocation.col === col;
  }

  renderFormulaBar() {
    const cellLocationToDisplayAsPlaceHolder = `row ${this.currentCellLocation.row} : col ${this.currentCellLocation.col} `;
    this.formulaBar.placeholder = cellLocationToDisplayAsPlaceHolder;
    this.formulaBar.value = this.model.getValue(this.currentCellLocation) || "";
  }

  renderTable() {
    this.renderTableHeader();
    this.renderTableBody();
    this.renderTableFooter();
  }

  renderTableHeader() {
    const fragment = document.createDocumentFragment();

    removeChildren(this.tableHeader);
    getLetterRange('A', this.model.cols)
      .map( letter => createTH(letter) )
      .forEach( TH => fragment.appendChild(TH) );

    this.tableHeader.appendChild(fragment);
  }

  renderTableFooter() {
    const fragment = document.createDocumentFragment();
    
    removeChildren(this.tableFooter);
    for (let col=0; col < this.model.cols; col++) {
      const tableCell = createTD(this.model.getColumnSum(col) || "");
      fragment.appendChild(tableCell);
    }

    this.tableFooter.appendChild(fragment);
  }

  renderTableBody() {
    removeChildren(this.tableBody);
    const fragment = document.createDocumentFragment();

    for (let row=0; row < this.model.rows; row++) {
      const tableRow = createTR();
      
      for (let col=0; col < this.model.cols; col++) {
        const location = {"col": col, "row": row};
        const tableCell = createTD(this.model.getValue(location));

        if(this.isCurrentCell(row, col))
          tableCell.className = "currentCell";
        tableRow.appendChild(tableCell);
      }
      fragment.appendChild(tableRow);
    }
    this.tableBody.appendChild(fragment);
  }

  handleCellClick(event) {
    const col = event.target.cellIndex;
    const row = event.target.parentElement.rowIndex -1;

    this.currentCellLocation = {"col": col, "row": row};
    this.renderTableBody();
    this.renderFormulaBar();
  }

  _isValidNumericalInput(userInput) {
    return !isNaN(userInput);
  }

  _setNewColumnSum(userInput) {
    if (this._isValidNumericalInput(userInput)) {
      let columnDataValues = this.model.getColumnValues(this.currentCellLocation.col);
      const sum = calculateSum(columnDataValues);

      if ( (sum !== undefined) && (sum > 0) ) {
        this.model.setColumnSum(this.currentCellLocation.col, sum);
      }
    }
  }

  handleFormulaBarUserInput() {
    this.formulaBar.placeholder = "";
    const userInput = this.formulaBar.value;

    this.model.setValue(this.currentCellLocation, userInput);
    this._setNewColumnSum(userInput);

    this.renderTableBody();
    this.renderTableFooter();
  }

  attachEventHandlers() {
    this.tableBody.addEventListener("click", this.handleCellClick.bind(this) );
    this.formulaBar.addEventListener("keyup", this.handleFormulaBarUserInput.bind(this) );
  }
}

module.exports = TableView;