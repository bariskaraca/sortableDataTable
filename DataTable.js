function DataTable(container, headerValues, rowValues, options) {
    this.offsetX = 5;
    this.offsetY = 5;
    this.container = container instanceof HTMLElement ? container : get(container);
    this.headerValues = headerValues;
    this.rowValues = rowValues;
    this.options = {
        columnDragHandle: null,
        rowDragHandle: null,
        columnOnDragClass: "columnOnDrag",
        rowOnDragClass: "rowOnDrag",
        onIndexChange: null
    };
    Object.assign(this.options, options);
    this.elCount = options.elCount ? options.elCount : 10;
    this.sortable = options.sortable ? options.sortable : true;
    this.sortableUpIcon = options.sortableUpIcon;
    this.sortableDownIcon = options.sortableDownIcon;
    this.totalPage = Math.ceil(rowValues.length / this.elCount);
    this.data = [];
    this.currentPage = 1;
    this.pageData = [];
    this.searchableCols = [];
    this.rowDatas = [];
    this.table = null;
}
function get(el) {
    return document.querySelector(el);
}
function getIndex(element){
    if (!element) {
        return -1;
    }
    var currentElement = element,
        index = 0;

    while(currentElement.previousElementSibling) {
        if(currentElement.previousElementSibling.style.display !== "none")
            index++;
        currentElement = currentElement.previousElementSibling;
    }
    return index
}
DataTable.prototype = {
    constructor: DataTable,
    create: function (init=true) {
        const that = this;
        if(init){
            var container = that.container;
            this.table = document.createElement("table");
            var colgroup = document.createElement("colgroup");

            var tr = document.createElement("tr");
            tr.setAttribute("class","header");
            container.appendChild(this.table);
            this.table.appendChild(colgroup);
            this.table.appendChild(tr);
            that.headerValues.map(function (value, index){
                var th = document.createElement("th");
                var width = value.width || 100/that.headerValues.length ;
                var col = document.createElement("col");
                col.setAttribute("width", width+"%");
                colgroup.appendChild(col);
                th.textContent = value.value;

                if(that.sortable) {
                    let sort_down = document.createElement("img");
                    sort_down.setAttribute("src",that.sortableDownIcon);
                    sort_down.setAttribute("class","sort_icon");
                    sort_down.style.display = "none";
                    th.appendChild(sort_down);
                    let sort_up = document.createElement("img");
                    sort_up.setAttribute("src",that.sortableUpIcon);
                    sort_up.setAttribute("class","sort_icon");
                    sort_up.style.display = "none";
                    th.appendChild(sort_up);
                    th.addEventListener("click",function (e) {
                        let sort_by = function(field, reverse, primer){

                            var key = primer ?
                                function(x) {return primer(x[field])} :
                                function(x) {return x[field]};

                            reverse = !reverse ? 1 : -1;

                            return function (a, b) {
                                return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
                            }
                        };
                        let sort={};
                        for(let item of that.table.querySelectorAll(".sort_icon"))
                            item.style.display = "none";
                        if(that.sort && that.sort[value.key]){
                            if(that.sort[value.key] === "asc") {
                                sort_down.style.display = "none";
                                sort_up.style.display = "";
                                that.rowValues=that.rowValues.sort(sort_by(value.key, true));
                            }
                            else{
                                sort_up.style.display = "none";
                                sort_down.style.display = "";
                                that.rowValues=that.rowValues.sort(sort_by(value.key, false));
                            }
                            sort[value.key]= that.sort[value.key] === "asc" ? "desc" : "asc";
                        }
                        else{
                            sort[value.key]= "asc";
                            sort_up.style.display = "none";
                            sort_down.style.display = "";
                            that.rowValues=that.rowValues.sort(sort_by(value.key, false));
                        }
                        that.update(that.rowValues);
                        that.sort= sort;
                    })
                }
                if(value.searchable)
                    that.searchableCols.push(index);
                tr.appendChild(th);
            });
        }
        that.rowDatas = [];
        this.rowValues.map(function (value, index_) {
            var tr_data = document.createElement("tr");
            var pageNumber = that.table.getElementsByClassName("round")[0];
            that.headerValues.map(function (value2, index) {
                var td = document.createElement("td");
                td.innerHTML = value[value2.key];
                tr_data.append(td);
                if(pageNumber)
                    that.table.insertBefore(tr_data, pageNumber);
                else
                    that.table.appendChild(tr_data);
            });
            tr_data.setAttribute("filtered",true);
            tr_data.setAttribute("row-index",index_);
            that.rowDatas.push(tr_data);
        });
        that.pageData = that.rowDatas;

        this.show(1,that.pageData);

        var itemCount = document.createElement("select");
        itemCount.setAttribute("class","itemCount");
        var o1 = document.createElement("option");
        var val1 = document.createTextNode("5");
        o1.appendChild(val1);
        itemCount.appendChild(o1);
        var o2 = document.createElement("option");
        var val2 = document.createTextNode("10");
        o2.appendChild(val2);
        itemCount.appendChild(o2);
        var o3 = document.createElement("option");
        var val3 = document.createTextNode("15");
        o3.appendChild(val3);
        itemCount.appendChild(o3);
        itemCount.onchange = function (ev) {
           that.elCount = parseInt(this.value);
           that.totalPage = Math.ceil(that.rowValues.length / that.elCount);
           that.update(that.rowValues)
        };
        var previousButton = document.createElement("a");
        previousButton.setAttribute("class","previous round");
        previousButton.textContent = "<";
        previousButton.onclick = function (ev) {
            if(that.currentPage > 1) {
                that.show(--that.currentPage,that.pageData);
            }
        };
        var nextButton = document.createElement("a");
        nextButton.setAttribute("class","next round");
        nextButton.textContent = ">";
        nextButton.onclick = function (ev) {
            if(that.currentPage < that.totalPage) {
                that.show(++that.currentPage,that.pageData);
            }
        };
        var br = document.createElement("br");
        this.table.appendChild(br);
        this.table.appendChild(previousButton);
        this.table.appendChild(nextButton);
        this.table.appendChild(itemCount);
        if(this.totalPage <= 1){
            nextButton.style.display="none";
            previousButton.style.display="none";
        }
        if(this.elCount === 5){
            o1.setAttribute("selected","selected");
        }
        else if(this.elCount === 10){
            o2.setAttribute("selected","selected");
        }
        else{
            this.elCount = 15;
            o3.setAttribute("selected","selected");
        }
        if(this.rowValues.length < that.elCount ){
            itemCount.style.display="none";
        }
        else if(this.rowValues.length <= 10 ){
            o3.style.display="none";
        }
        if(that.options.dragColumnSortable)
            that.createColumnSort();
        if(that.options.dragRowSortable)
            that.createRowSort();
        return that
    },
    update: function (data) {
        const that = this;
        for(var a of that.table.querySelectorAll("a"))
            a.remove();
        for(var br of that.table.querySelectorAll("br"))
            br.remove();
        for(var select of that.table.querySelectorAll("select"))
            select.remove();
        var rows = that.table.querySelectorAll("tr");
        for(var i = 1; i<rows.length; i++)
            rows[i].remove();
        this.rowValues = data;
        that.create(false);
    },
    addRow: function(value){
        const that = this;
        var index_ = that.rowValues.length;
        var tr_data = document.createElement("tr");
        var pageNumber = that.table.getElementsByClassName("round")[0];
        var br = that.table.getElementsByTagName("br")[0];
        that.headerValues.map(function (value2, index) {
            var td = document.createElement("td");
            td.innerHTML = value[value2.key];
            tr_data.appendChild(td);
            if(br)
                that.table.insertBefore(tr_data, br);
            else if(pageNumber)
                that.table.insertBefore(tr_data, pageNumber);
            else
                that.table.appendChild(tr_data);
        });
        tr_data.setAttribute("filtered",true);
        that.rowDatas.push(tr_data);
        that.rowValues.push(value);
        return tr_data
    },
    show: function (pageNumber,rowData) {
        var pageIndex = {
            finish: pageNumber*this.elCount-1 > rowData.length ? rowData.length : pageNumber*this.elCount-1,
            start: (pageNumber-1)*this.elCount
        };
        for(var i = 0; i < rowData.length; i++){
            if(i >= pageIndex.start && i <= pageIndex.finish && rowData[i].getAttribute("filtered") === "true"){
                rowData[i].style.display = "";
            }
            else{
                rowData[i].style.display = "none";
            }
        }
    },
    search: function (text) {
        const that = this; var filteredValues = [];
        that.rowDatas.forEach(function (value) {
            var data = value.querySelectorAll("td"), added = false;
            that.headerValues.map(function (value2, index2){
                if(value2.searchable){
                    var cellValue = data[index2].innerHTML.toString().toLowerCase();
                    if(cellValue.indexOf(text.toString().toLowerCase()) > -1 && !added) {
                        value.setAttribute("filtered",true);
                        value.setAttribute("visible",true);
                        value.style.display = "";
                        added = true;
                        filteredValues.push(value);
                    }
                    else if(!added){
                        value.setAttribute("filtered",false);
                        value.setAttribute("visible",false);
                        value.style.display = "none";
                    }
                }
            });
        });
        that.rowDatas.forEach(function (value) {
            var visible = value.getAttribute("visible");
            var index = value.getAttribute("data-index");
            that.rowValues.map(function () {
                if(this.index == index){
                    this.visibility = visible;
                }
            })
        });
        this.currentPage = 1;
        that.pageData = filteredValues;
        this.totalPage = Math.ceil(filteredValues.length/that.elCount);
        this.show(1,that.pageData)
    },
    createColumnSort: function () {
        const that=this;
        this.container.querySelectorAll("th").forEach(function(header){
            header.setAttribute("mdown",false);
            if(that.options.columnDragHandle) {
                header.querySelector(that.options.columnDragHandle).addEventListener("mousedown", function (event) {
                    header.setAttribute("mdown",true);
                });
                header.querySelector(that.options.columnDragHandle).addEventListener("mousemove", function (event) {
                    if(!header.classList.contains("moving") && header.getAttribute("mdown") == "true")
                        that.selectColumn(header, event);

                });
                header.querySelector(that.options.columnDragHandle).addEventListener("mouseup", function (event) {
                    header.setAttribute("mdown",false);
                    if(header.classList.contains("moving"))
                        header.classList.remove("moving");
                });
            }
            else{
                header.addEventListener("mousedown", function (event) {
                    header.setAttribute("mdown",true);
                });
                header.addEventListener("mousemove", function (event) {
                    if(!header.classList.contains("moving") && header.getAttribute("mdown") == "true") {
                        that.selectColumn(header, event);
                        header.classList.add("moving");
                    }
                });
                header.addEventListener("mouseup", function (event) {
                    header.setAttribute("mdown",false);
                    if(header.classList.contains("moving"))
                        header.classList.remove("moving");
                });
            }
        });

        function mouseup(event) {
            event.preventDefault();
            if(that.selectedHeader){
                for(var col of document.querySelectorAll("."+that.options.columnOnDragClass))
                    col.classList.remove(that.options.columnOnDragClass);
                that.draggableContainer = null;
                that.selectedHeader = null;
                for(var el of document.querySelectorAll(".tesodev_draggable_column"))
                    el.remove();
            }
        }
        document.removeEventListener("mouseup", mouseup);
        document.addEventListener("mouseup", mouseup);
    },
    selectColumn: function(header, event) {
        event.preventDefault();
        if(event.which===1) {
            const that = this;
            this.selectedHeader = header;
            header.classList.add(that.options.columnOnDragClass);
            let sourceIndex = getIndex(this.selectedHeader), cells = [];
            this.container.querySelectorAll("tr").forEach(function (row, rowIndex) {
                for(var cell of row.querySelectorAll("td")){
                    let cellIndex = getIndex(cell);
                    if (cellIndex === sourceIndex) {
                        cells[cells.length] = cell;
                        cell.classList.add(that.options.columnOnDragClass);
                    }
                }
            });

            this.draggableContainer = document.createElement("div");
            this.draggableContainer.classList.add("tesodev_draggable_column");
            function createDraggableTable(header, event) {
                let table = document.createElement("table");
                table.style.width = header.getBoundingClientRect().width + "px";
                table.className = that.container.className;
                let thead = document.createElement("thead");
                let tbody = document.createElement("tbody");
                let tr = document.createElement("tr");
                let th = document.createElement("th");
                th.innerHTML = header.innerHTML;
                tr.appendChild(th);
                thead.appendChild(tr);
                table.appendChild(thead);
                table.appendChild(tbody);
                return table;
            }
            let dragtable = createDraggableTable(header);
            cells.map(function (cell, cellIndex) {
                let tr = document.createElement("tr");
                let td = document.createElement("td");
                td.innerHTML = cells[cellIndex].innerHTML;
                tr.appendChild(td);
                dragtable.querySelector("tbody").appendChild(tr);
            });
            this.draggableContainer.append(dragtable);
            this.draggableContainer.style.position = "absolute";
            this.draggableContainer.style.left = event.pageX + this.offsetX + "px";
            this.draggableContainer.style.top = event.pageY + this.offsetY + "px";
            document.body.appendChild(this.draggableContainer);
            function mousemove(event) {
                if (that.selectedHeader) {
                    if (that.selectedHeader !== null) {
                        that.draggableContainer.style.left = event.pageX + that.offsetX + "px";
                        that.draggableContainer.style.top = event.pageY + that.offsetY + "px";
                        that.moveColumn(event)
                    }
                }
            }
            document.removeEventListener("mousemove",mousemove);
            document.addEventListener("mousemove",mousemove);
        }
    },
    moveColumn: function(event) {
        event.preventDefault();
        const that =this;
        let target = document.elementFromPoint(event.pageX,event.pageY);
        if(target && target.tagName.toLowerCase() === "th") {
            let sourceIndex = getIndex(this.selectedHeader),
                targetIndex = getIndex(target);
            if (sourceIndex !== targetIndex && typeof targetIndex === "number") {
                typeof that.options.onIndexChange === "function" ?
                    that.options.onIndexChange(sourceIndex,targetIndex, "column") : "";
                that.container.querySelectorAll("tr").forEach(function(row){
                    if(row) {
                        let v = row.querySelectorAll("th")[targetIndex];
                        let source = row.querySelectorAll("th")[sourceIndex];
                        if(source && v){
                            if (sourceIndex < targetIndex) {
                                row.insertBefore(v, source);
                            }
                            if (sourceIndex > targetIndex){
                                row.insertBefore(source, v);
                            }
                        }
                        let v2 = row.querySelectorAll("td")[targetIndex];
                        let source2 = row.querySelectorAll("td")[sourceIndex];
                        if(source2 && v2){
                            if (sourceIndex < targetIndex) {
                                row.insertBefore(v2, source2);
                            }
                            if (sourceIndex > targetIndex)
                                row.insertBefore(source2, v2);
                        }
                    }
                });
                let colGroup = that.container.querySelector("colgroup");
                let v = colGroup.querySelectorAll("col")[targetIndex];
                let source = colGroup.querySelectorAll("col")[sourceIndex];
                if(source && v){
                    if (sourceIndex < targetIndex) {
                        colGroup.insertBefore(v, source);
                    }
                    if (sourceIndex > targetIndex){
                        colGroup.insertBefore(source, v);
                    }
                }
            }
        }
    },
    createRowSort: function () {
        const that=this;
        this.container.querySelectorAll("tr").forEach(function(row, index){
            if(index>0) {
                row.setAttribute("mdown", false);
                if (that.options.rowDragHandle) {
                    row.querySelector(that.options.rowDragHandle).addEventListener("mousedown", function (event) {
                        row.setAttribute("mdown", true);
                    });
                    row.querySelector(that.options.rowDragHandle).addEventListener("mousemove", function (event) {
                        if (!row.classList.contains("moving") && row.getAttribute("mdown") == "true")
                            that.selectRow(row, event);

                    });
                    row.querySelector(that.options.rowDragHandle).addEventListener("mouseup", function (event) {
                        row.setAttribute("mdown", false);
                        if (row.classList.contains("moving"))
                            row.classList.remove("moving");
                    });
                } else {
                    row.addEventListener("mousedown", function (event) {
                        row.setAttribute("mdown", true);
                    });
                    row.addEventListener("mousemove", function (event) {
                        if (!row.classList.contains("moving") && row.getAttribute("mdown") == "true") {
                            that.selectRow(row, event);
                            row.classList.add("moving");
                        }
                    });
                    row.addEventListener("mouseup", function (event) {
                        row.setAttribute("mdown", false);
                        if (row.classList.contains("moving"))
                            row.classList.remove("moving");
                    });
                }
            }
        });

        function mouseup(event) {
            event.preventDefault();
            if(that.selectedRow){
                for(var col of document.querySelectorAll("."+that.options.columnOnDragClass))
                    col.classList.remove(that.options.rowOnDragClass);
                that.draggableContainer = null;
                that.selectedRow = null;
                for(var el of document.querySelectorAll(".tesodev_draggable_row"))
                    el.remove();
            }
        }
        document.removeEventListener("mouseup", mouseup);
        document.addEventListener("mouseup", mouseup);
    },
    selectRow: function(row, event) {
        event.preventDefault();
        if(event.which===1) {
            const that = this;
            this.selectedRow = row;
            row.classList.add(that.options.rowOnDragClass);
            this.draggableContainer = document.createElement("div");
            this.draggableContainer.classList.add("tesodev_draggable_row");
            function createDraggableTable(row) {
                let table = document.createElement("table");
                table.className = that.container.className;
                let tbody = document.createElement("tbody");
                tbody.style.width = row.getBoundingClientRect().width + "px";
                table.appendChild(tbody);
                return table
            }
            let dragtable = createDraggableTable(row);
            this.draggableContainer.append(dragtable);
            this.draggableContainer.style.position = "absolute";
            this.draggableContainer.style.left = event.pageX + this.offsetX + "px";
            this.draggableContainer.style.top = event.pageY + this.offsetY + "px";
            document.body.appendChild(this.draggableContainer);
            dragtable.querySelector("tbody").appendChild(row.cloneNode(true));
            function mousemove(event) {
                if (that.selectedRow) {
                    if (that.selectedRow !== null) {
                        that.draggableContainer.style.left = event.pageX + that.offsetX + "px";
                        that.draggableContainer.style.top = event.pageY + that.offsetY + "px";
                        that.moveRow(event)
                    }
                }
            }
            document.removeEventListener("mousemove",mousemove);
            document.addEventListener("mousemove",mousemove);
        }
    },
    moveRow: function(event) {
        event.preventDefault();
        const that =this;
        let target = document.elementFromPoint(event.pageX,event.pageY);
        if(target && target.tagName.toLowerCase() === "td" && target.parentNode) {
            target=target.parentNode;
            let sourceIndex = getIndex(this.selectedRow),
                targetIndex = getIndex(target);
            if (sourceIndex !== targetIndex && typeof targetIndex === "number") {
                typeof that.options.onIndexChange === "function" ?
                    that.options.onIndexChange(sourceIndex,targetIndex, "row", that.selectedRow) : "";
                let source = that.container.querySelectorAll("tr")[sourceIndex];
                let row = that.container.querySelectorAll("tr")[targetIndex];
                if(sourceIndex<targetIndex) {
                    row.parentNode.insertBefore(row, source);
                }
                if(sourceIndex>targetIndex) {
                    row.parentNode.insertBefore(source, row);
                }
            }
        }
    }
};