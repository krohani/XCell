const { removeChildren, createTH, createTR, createTD } = require("./DOMUtils.js");
const { getLetterRange, calculateArraySum } = require("./ArrayUtils.js");

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
    this.addRowButton = document.querySelector("#addRow");
    this.addColButton = document.querySelector("#addCol");

    
  }

  initCurrentCellLocation() {
    this.currentCellLocation = { "col": 1, "row": 0 };
  }

  isCurrentCell(row, col) {
    if (this.currentCellLocation.row === -1) {
      return this.currentCellLocation.col === col;
    } else if (this.currentCellLocation.col === 0) {
      return this.currentCellLocation.row === row;
    } else {
      return this.currentCellLocation.row === row && this.currentCellLocation.col === col;
    }
  }

  _displayFormat(item) {
    return ( (item === undefined || item === null) ) ? "" : item.toString();
  }


  _shiftRowData(endRow) {
    let previousCell, newCell;
    console.log('end row passed to _shiftRowData', endRow);
    for (let row = this.model.rows-2; row >= endRow; row-- ) {
      for (let col = 1; col <= this.model.cols; col++) {
        previousCell = {"col": col, "row": row};
        newCell = {"col": col, "row": row+1};
        // console.log(`prevcell {col:${previousCell.col},row:${previousCell.row}} value: ${this.model.getValue(previousCell)}`);
        // console.log(`newcell {col:${newCell.col},row:${newCell.row}} value: ${this.model.getValue(newCell)}\n\n`);
        this.model.setValue(newCell, this.model.getValue(previousCell));
        if (row === endRow) {
          this.model.setValue(previousCell, undefined);
        }
      }
    }
  }

  insertNewRow(insertionPoint) {
    console.log('inserting new row at row ', insertionPoint);
    this.model.rows = this.model.rows + 1;
    if (insertionPoint < this.model.rows-1) {
      console.log('shifting row data');
      this._shiftRowData(insertionPoint+1);
    } 
    this.renderTable();
  }

  _calculateColumnSum(col) {
    return calculateArraySum(this.model.getColumnValues(col));  
  }

  _shiftColumnData(endColumn) {
    console.log('shifting column data endColumn is ', endColumn);
    let previousLocation, newLocation;

    for (let col=this.model.cols-1; col >= endColumn; col--) {
      for (let row=0; row < this.model.rows; row++) {
        previousLocation = {"col": col, "row": row};
        newLocation = {"col": col+1, "row": row};
        this.model.setValue(newLocation, this.model.getValue(previousLocation));

        if (col === endColumn) {
          this.model.setValue(previousLocation, undefined);
        }
      }
    }
  }

  _shiftColumnSums(startingColumn) {
    console.log(`shifting column sums startingColumn passed in ${startingColumn}`);
    this.model.setColumnSum(startingColumn, "");
    for (let col=startingColumn+1; col <= this.model.cols; col++) {
      this.model.setColumnSum(col, this._calculateColumnSum(col) );
    }
  }

  insertNewColumn(insertionPoint) {
    console.log('insertNewColumn at: ', insertionPoint);
     
    this.model.cols = this.model.cols + 1;

    if (insertionPoint < this.model.cols-1) {
      this._shiftColumnData(insertionPoint+1);
      this._shiftColumnSums(insertionPoint+1);
    }
    this.renderTable();
  }

  renderFormulaBar() {
    if (this.currentCellLocation.row !== -1) {
      const cellLocationToDisplayAsPlaceHolder = `row ${this.currentCellLocation.row+1} : col ${this.currentCellLocation.col} `;
      this.formulaBar.placeholder = cellLocationToDisplayAsPlaceHolder;
      this.formulaBar.value = this.model.getValue(this.currentCellLocation) || "";
    } else {
      this.formulaBar.value = "";
    }
  }

  renderTable() {
    
    this.renderTableHeader();
    this.renderTableBody();
    this.renderTableFooter();
    this.renderTableRowNumberColumn();
  }

  renderTableRowNumberColumn() {
    let tableCell, tableRow, insertionNode;

    //create new cell for number column of header row
    tableCell = createTH();
    tableCell.className = "numberColumn";
    this.tableHeader.insertBefore(tableCell, this.tableHeader.childNodes[0]);
    
    //create new cells for body of number column
    for (let row=0; row < this.model.rows; row++) {
      tableCell = createTH( (row+1) + '');
      if (this.currentCellLocation.row === row && this.currentCellLocation.col === 0) {
        tableCell.className = "selectedNumberColumn";
      } else {
        tableCell.className = "numberColumn";
      }
      tableRow = this.tableBody.childNodes[row];
      tableRow.insertBefore(tableCell, tableRow.childNodes[0]);
    }

    //create new footer cell
    tableCell = createTH();
    tableCell.className = "numberColumn";
    this.tableFooter.insertBefore(tableCell, this.tableFooter.childNodes[0]);

  }

  renderTableHeader() {
    const fragment = document.createDocumentFragment();

    removeChildren(this.tableHeader);
    getLetterRange('A', this.model.cols)
      .map( (letter, index) => {
        const tableHeader = createTH(letter);
        if (this.currentCellLocation.row === -1 && ( (index+1) === this.currentCellLocation.col)) {
          tableHeader.className = "selectedHeader";
        } 
        return tableHeader;
      })
      .forEach( TH => fragment.appendChild(TH) );

    this.tableHeader.appendChild(fragment);
  }

  renderTableFooter() {
    const fragment = document.createDocumentFragment();
    
    removeChildren(this.tableFooter);
    for (let col=1; col <= this.model.cols; col++) {
      const tableCell = createTD(this._displayFormat(this.model.getColumnSum(col)) || "");
      fragment.appendChild(tableCell);
    }

    this.tableFooter.appendChild(fragment);
  }



  renderTableBody() {
    removeChildren(this.tableBody);
    const fragment = document.createDocumentFragment();

    for (let row=0; row < this.model.rows; row++) {
      const tableRow = createTR();
      
      for (let col=1; col <= this.model.cols; col++) {
        const location = {"col": col, "row": row};
        const tableCell = createTD(this.model.getValue(location));

        if(this.isCurrentCell(row, col))
          tableCell.className = "selectedCell";
        tableRow.appendChild(tableCell);
      }
      fragment.appendChild(tableRow);
    }
    this.tableBody.appendChild(fragment);
  }

  _isValidNumericalInput(userInput) {
    //one-off wierd scenarion when user enters -5 and then simply deletes the 5 and leaves
    //the dash. In this scenario we need to re-calculate still.
    return (!isNaN(userInput) || userInput === '-');
  }


  handleFormulaBarUserInput() {
    this.formulaBar.placeholder = "";
    const userInput = this.formulaBar.value;

    this.model.setValue(this.currentCellLocation, userInput);
    //this._setColumnNewSum(userInput);
    if (this._isValidNumericalInput(userInput)) {
      const currentColumn = this.currentCellLocation.col;
      this.model.setColumnSum(currentColumn, this._calculateColumnSum(currentColumn) );
    }

    this.renderTable();
  }

  handleCellClick(event) {
    let col = event.target.cellIndex;
    let row = event.target.parentElement.rowIndex -1;

    console.log(`user clicked cell row:${row} col:${col}`);
    if (col === 0 && row === -1) {
      col = 1;
      row = 0;
    }
    this.currentCellLocation = {"col": col, "row": row};    
    this.renderTable();
    this.renderFormulaBar();
  }

  handleAddRowButtonClick() {
    const rowInsertionPoint = (this.currentCellLocation.col === 0) ? this.currentCellLocation.row : this.model.rows;
    this.insertNewRow(rowInsertionPoint);
  }

  handleAddColButtonClick() {
    const columnInsertionPoint = (this.currentCellLocation.row === -1) ? this.currentCellLocation.col : this.model.cols;
    this.insertNewColumn(columnInsertionPoint);

  }  

  attachEventHandlers() {
    this.tableHeader.addEventListener("click", this.handleCellClick.bind(this) );
    this.tableBody.addEventListener("click", this.handleCellClick.bind(this) );
    this.formulaBar.addEventListener("keyup", this.handleFormulaBarUserInput.bind(this) );
    this.addRowButton.addEventListener("click", this.handleAddRowButtonClick.bind(this) );
    this.addColButton.addEventListener("click", this.handleAddColButtonClick.bind(this) );

  }
}

module.exports = TableView;