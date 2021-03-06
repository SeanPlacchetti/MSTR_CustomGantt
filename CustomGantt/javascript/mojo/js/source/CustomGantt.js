/**
* Original source code by Aaron Lampros - https://github.com/alampros/Gantt-Chart 
* Modified by Adam Abbott with Northstrat, Inc. for use in MicroStrategy Visual Insight
*/

// get class name of root -- used to determine light or dark theme
var theme = document.getElementById("rootView").className;
// true if light theme - false if dark theme
var colorByTheme = (theme === "mstrmojo-RootView  mojo-theme-light") ? "black" : "#cccccc";

// set default props for custom props
this.setDefaultPropertyValues({
    showChangeDate: "false",
    showRowLabelHgt: "false",
    showDateLine: "true",
    showLabels: "true",
    showDateLabels: "true",
    showCYAxis: "true",
    showCYQtrAxis: "false",
    showFYAxis: "false",
    showFYQtrAxis: "false",
    dateLine: "",
    tooltipFontSize: "16px",
    showYAxisTitle: "true",
    catLabelHgt: "2",
    barMarginHeight: "10",
    rotateXAxisLabels: "false"
});

// checks if there are existing children on the domNode, if so deletes them
// this was needed to eliminate issues with multiple charts being added to the domNode on refresh/redraw of chart
if (this.domNode.childNodes.length >= 1) {
    while (this.domNode.childNodes.length > 0) {
        this.domNode.removeChild(this.domNode.childNodes[0]);
    }
}
// use visualization as a selector
this.addUseAsFilterMenuItem();
// for export as pdf
this.raiseEvent({
    name: "renderFinished",
    id: this.k
});
// allow for scroll bar in browser should graph height exceed client height
document.getElementById(this.domNode.id).style.overflow = "auto";

// getting values and setting booleans from defaultProps
var showDateLineBool = (this.getProperty("showDateLine") === "true"),
    hideLabelBool = (this.getProperty("showLabels") === "false"),
    hideDateLabelBool = (this.getProperty("showDateLabels") === "false"),
    hideCYAxisBool = (this.getProperty("showCYAxis") === "false"),
    hideCYQtrAxisBool = (this.getProperty("showCYQtrAxis") === "false"),
    hideFYAxisBool = (this.getProperty("showFYAxis") === "false"),
    hideFYQtrAxisBool = (this.getProperty("showFYQtrAxis") === "false"),
    tooltipSizeFromProps = this.getProperty("tooltipFontSize"),
    hideYAxisTitleBool = (this.getProperty("showYAxisTitle") === "false"),
    dateLineFromProp = this.getProperty("dateLine"),
    catLabelHgtInt = parseInt(this.getProperty("catLabelHgt"), 10),
    barMarginHeightInt = parseInt(this.getProperty("barMarginHeight"), 10),
    rotateXAxisLabelsBool = (this.getProperty("rotateXAxisLabels") === "true");

var validateDate = function(testdate) {
    return (/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/).test(testdate);
};
// check if dateLine property passes regex test, if not display alert message
if (dateLineFromProp !== "" && !validateDate(dateLineFromProp)) {
    alert("You entered an incorrect date format.  Please try again with MM/DD/YYYY");
}
// initialize variables
var xAxisCount = 0, cyQtrAxisCount = 0, fyQtrAxisCount = 0, fyAxisCount = 0;
// value to determine xaxis spacing
var axisSpacing = 0;
// value to determine bottom margin value
var bottomMarginValue = 140;
// if the toggle for rotating xaxis is checked then set larger axis spacing
// and increase bottom margin so axes do not get clipped else rotate axis toggle
// not checked, standard axis spacing and do not change bottom margin value from initial set value
if (rotateXAxisLabelsBool) {
    axisSpacing = 65;
    bottomMarginValue = 240;
} else {
    axisSpacing = 30;
}

// logic to adjust axis label heights based off show/hide scenarios
var tallyAxisBools = function() {
    // show month axis, cyqtr axis, fyqtr axis, and fy axis
    if (!hideCYAxisBool && !hideCYQtrAxisBool && !hideFYAxisBool && !hideFYQtrAxisBool)
        cyQtrAxisCount = axisSpacing,
        fyQtrAxisCount = axisSpacing*2,
        fyAxisCount = axisSpacing*3;
    // show month axis, cyqtr axis
    if (!hideCYAxisBool && !hideCYQtrAxisBool && hideFYAxisBool && hideFYQtrAxisBool)
        cyQtrAxisCount = axisSpacing;
    // show cyqtr axis, fyqtr axis, fy axis
    if (hideCYAxisBool && !hideCYQtrAxisBool && !hideFYAxisBool && !hideFYQtrAxisBool)
        fyQtrAxisCount = axisSpacing,
        fyAxisCount = axisSpacing*2;
    // show month axis, cyqtr axis, fy axis
    if (!hideCYAxisBool && hideFYQtrAxisBool && !hideCYQtrAxisBool && !hideFYAxisBool)
        cyQtrAxisCount = axisSpacing,
        fyAxisCount = axisSpacing*2;
    // show month axis, cyqtr axis, fyqtr axis
    if (!hideCYAxisBool && !hideCYQtrAxisBool && hideFYAxisBool && !hideFYQtrAxisBool)
        cyQtrAxisCount = axisSpacing,
        fyQtrAxisCount = axisSpacing*2;
    // show month axis, fy axis, fyqtr axis
    if (!hideCYAxisBool && !hideFYAxisBool && hideCYQtrAxisBool && !hideFYQtrAxisBool)
        fyQtrAxisCount = axisSpacing,
        fyAxisCount = axisSpacing*2;
    // show cyqtr axis, fyqtr axis
    if (hideCYAxisBool && hideFYAxisBool && !hideCYQtrAxisBool && !hideFYQtrAxisBool)
        fyQtrAxisCount = axisSpacing;
    // show fy axis, fyqtr axis
    if (hideCYAxisBool && hideCYQtrAxisBool && !hideFYAxisBool && !hideFYQtrAxisBool)
        fyAxisCount = axisSpacing;
    // show month axis, fy axis
    if (!hideCYAxisBool && hideCYQtrAxisBool && !hideFYAxisBool && hideFYQtrAxisBool)
        fyAxisCount = axisSpacing;
    // show month axis, fyqtr axis
    if (!hideCYAxisBool && hideCYQtrAxisBool && hideFYAxisBool && !hideFYQtrAxisBool)
        fyQtrAxisCount = axisSpacing;
    // show fy axis, cyqtr axis
    if (hideCYAxisBool && hideFYQtrAxisBool && !hideFYAxisBool && !hideCYQtrAxisBool)
        fyAxisCount = axisSpacing;
    return xAxisCount, cyQtrAxisCount, fyQtrAxisCount, fyAxisCount;
};
// execute the boolean checks and assign values for placement of the requisite axis
tallyAxisBools();

var me = this;
// assign domNode to a variable
var domNode = this.domNode;
var makeid = function () {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for ( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};
        
var absParent = "absParent" + makeid();
var tooltipID = "tooltip" + makeid();
// this sets the MSTR Data Interface object to a variable
var $DI = mstrmojo.models.template.DataInterface,
    // this variable will hold all the data from the MSTR dataset
    dataModel = (new $DI(this.model.data)).getRawData($DI.ENUM_RAW_DATA_FORMAT.ROWS_ADV, {hasSelection: true, hasTitleName: true});
var yAxisTitle = dataModel[0].headers[0].tname;

// set variables for data model that feeds data from the dataModel to the gantt chart object
var categories, tasks, 
    milestones = [], 
    datelines = [];

// Below function gets the categories (i.e. parent) from the dataModel
var getCategories = function getCategories(root) {
    categories = [];
    categories.push(root[0].headers[0].name);
    for (var i = 0; i < root.length; i++) {
        if (i > 0) {
            if (root[i].headers[0].name !== root[i-1].headers[0].name) {
                categories.push(root[i].headers[0].name);
            }
        }
    }
    return categories;
};
// get the categories from the dataModel
getCategories(dataModel);

// Checks the inputted date.  The year must be in the last place (i.e. dd/mm/yyyy or dd/mm/yy)
// If the date input has a year with two digits the function corrects it
var dateFmt = function(date) {
    var dateObj = new Date(date);
    var dateArr = date.split(/[/-]/);
    if (dateArr[2].length === 2) {
        var fullYr = dateObj.getFullYear();
        if (fullYr < 1950)
            dateObj.setFullYear(fullYr + 100);
        }
        return dateObj.getFullYear() + ", " + (dateObj.getMonth()+1) + ", " + dateObj.getDate();
};

// Below function gets the individual tasks and milestones from the dataModel
var getTasksAndMilestones = function getTasksAndMilestones(root) {
    tasks = [];
    var msCount = 0,
        tskCount = 0;
    for (var a = 0; a < root.length; a++) {
        // if startDate = endDate or no endDate then its a milestone
        if (root[a].headers[2].name === root[a].headers[3].name || root[a].headers[3].name === "") {
            var checkedDate = new Date(dateFmt(root[a].headers[2].name));
            milestones[msCount] = {
                id: "MS" + (msCount+1),
                category: root[a].headers[0].name,
                label: root[a].headers[1].name,
                date: checkedDate,
                selection: root[a].headers[1].attributeSelector
            };
            msCount++;
        } else {
            var checkStarteDt = new Date(dateFmt(root[a].headers[2].name));
            var checkedEndDt = new Date(dateFmt(root[a].headers[3].name));
            tasks[tskCount] = {
                id: a+1,
                category: root[a].headers[0].name,
                label: root[a].headers[1].name,
                progress: root[a].values[0].rv,
                startDate: checkStarteDt,
                endDate: checkedEndDt,
                selection: root[a].headers[1].attributeSelector
            };
            tskCount++;
        }
    }
    return tasks;
};
//get the tasks and milestones from the dataModel
getTasksAndMilestones(dataModel);

// This was needed to initialize the dateline for the chart---was getting null pointer errors without it.
// Initially sets dateline to endDate of the first task
var initializeDateLine = function initializeDateLine(dates) {
    if (datelines.length === 0) {
        datelines[0] = {
            date: new Date()
        };
    return datelines;
    }
};

var toggleDateLine = function(bool) {
    if (bool) {
        if (dateLineFromProp !== "") {
            newDateLine = new Date(dateLineFromProp);
            dateLineObj = {
                date: newDateLine
            };
            datelines.push(dateLineObj);
            initializeDateLine(datelines);
        }
        initializeDateLine(datelines);
    } else {
        datelines = [];
        return datelines;
    }
};

toggleDateLine(showDateLineBool);

d3.gantt = function() {
    // Chart rendering properties
    var id = Math.floor((Math.random()*1000000)+1),
        margin = {
            top : 20,
            right:  40,
            bottom : bottomMarginValue,
            left : 100
        },
        // if no height provided, chart height will be calculated with task bar height
        // if no width provided, the chart will expand to screen width
        height = null,
        width = domNode.clientWidth - margin.left - margin.right,
        mileStoneRadius = 2,
        timeDomainStart = null,
        timeDomainEnd = null,
        timeDomainMode = "fit", // fixed or fit
        tickFormat = "%b-%d-%y", // default tick format
        categories = [],
        tasks = [],
        mileStones = [],
        dateLines = [],
        overlappingResolver = d3.overlappingResolver(),
        categoryAxisRenderer = d3.categoryAxisRenderer(),
        timeAxisRenderer = d3.timeAxisRenderer(),
        quarterAxisRenderer = d3.quarterAxisRenderer(),
        FYAxisRenderer = d3.FYAxisRenderer(),
        FYQtrAxisRenderer = d3.FYQtrAxisRenderer(),
        taskRenderer = d3.taskRenderer(),
        msRenderer = d3.msRenderer(),
        datelineRenderer = d3.datelineRenderer(),
        eventHandlers = {
            "task": {},
            "milestone":{},
            "dateline":{}
        };

    var getChartHeight = function() {
        return (height !== null && height > 0) ? height : categoryAxisRenderer.calculatedLength();
    };

    var getChartWidth = function() {
        return (width !== null && width > 0) ? width : document.body.clientWidth - margin.right - margin.left-5;
    };

    var keyFunction = function(d) {
        return "t_" + d.id;
    };
    var mskeyFunction = function(d) {
        return "ms_" + d.id;
    };

    var taskBarTransform = function(d) {
        var xpos = timeAxisRenderer.position(d.startDate);
        var ypos = categoryAxisRenderer.position(d);
        return "translate(" + xpos + "," + ypos + ")";
    };

    var mileStoneTransform = function(d) {
        var xpos = timeAxisRenderer.position(d.date);
        var ypos = categoryAxisRenderer.position(d);
        return "translate(" + xpos + "," + ypos + ")";
    };

    var dateLineTransform = function(d) {
        var xpos = timeAxisRenderer.position(d.date);
        var ypos = 0;
        return "translate(" + xpos + "," + ypos + ")";
    };

    // Selects root chart "g" node for current gantt chart.
    var getChartnode = function() {
        var chartnode = d3.select(domNode).selectAll("svg").data([id], function(d) { return d;}).selectAll(".gantt-chart");
        return chartnode;
    };

    var assignEvent = function (selection, objectType) {
        var handlers = eventHandlers[objectType];
        for (handler in handlers) {
            selection.on(handler,function(d) { 
                // if there"s a handler for current eventHandlers
                if (eventHandlers[objectType].hasOwnProperty(handler)) {
                    eventHandlers[objectType][handler](d);
                }
            });
        }
    };

    var initTimeDomain = function(tasks) {
        if (timeDomainMode === "fit") {
            if (tasks === undefined || tasks.length < 1) {
                timeDomainStart = d3.time.day.offset(new Date(), -3);
                timeDomainEnd = d3.time.hour.offset(new Date(), +3);
                return;
            }
            timeDomainStart = tasks.reduce( function(a,b) { return a.startDate < b.startDate ? a : b } ).startDate;
            timeDomainEnd = tasks.reduce( function(a,b) { return a.endDate > b.endDate ? a : b } ).endDate;
            timeAxisRenderer.domain([timeDomainStart, timeDomainEnd]).init();
        }
    };

    var calculateCategories = function(tasks) {
        var mCategories = {};
        tasks.map(function(x) {
            if (!mCategories.hasOwnProperty(mCategories,x.category)) {
                mCategories[x.category] = true;
            }
        });
        // convert map to list
        lstCategories = [];
        for (var c in mCategories) {
            lstCategories.push( c );
        }
        return lstCategories;
    };

    var configureAxisDomain = function() {
        timeAxisRenderer.domain([ timeDomainStart, timeDomainEnd ])
                        .tickFormat(tickFormat)
                        .configValue("axisLength",(domNode.clientWidth - margin.left - margin.right))
                        .configValue("hideAxis", hideCYAxisBool)
                        .configValue("strokeColor", colorByTheme)
                        .configValue("rotateLabels", rotateXAxisLabelsBool);
        quarterAxisRenderer.domain([ timeDomainStart, timeDomainEnd ])
                           .configValue("axisLength",(domNode.clientWidth - margin.left - margin.right))
                           .configValue("hideAxis", hideCYQtrAxisBool)
                           .configValue("strokeColor", colorByTheme)
                           .configValue("rotateLabels", rotateXAxisLabelsBool);
        FYAxisRenderer.domain([ timeDomainStart, timeDomainEnd ])
                      .configValue("axisLength",(domNode.clientWidth - margin.left - margin.right))
                      .configValue("hideAxis", hideFYAxisBool)
                      .configValue("strokeColor", colorByTheme)
                      .configValue("rotateLabels", rotateXAxisLabelsBool);
        FYQtrAxisRenderer.domain([ timeDomainStart, timeDomainEnd ])
                         .configValue("axisLength",(domNode.clientWidth - margin.left - margin.right))
                         .configValue("hideAxis", hideFYQtrAxisBool)
                         .configValue("strokeColor", colorByTheme)
                         .configValue("rotateLabels", rotateXAxisLabelsBool);
        timeAxisRenderer.init();
        quarterAxisRenderer.init();
        FYAxisRenderer.init();
        FYQtrAxisRenderer.init();
        // if no categories provided, calculate them from task categories
        if (categories === null) {
            categories = calculateCategories(tasks);
        }
        categoryAxisRenderer.overlappingResolver(overlappingResolver)
                            .categories(categories)
                            .configValue("strokeColor", colorByTheme)
                            .configValue("yAxisTitle", yAxisTitle)
                            .configValue("catLabelHgtFactor", catLabelHgtInt)
                            .configValue("barMargin", barMarginHeightInt)
                            .configValue("hideTitle", hideYAxisTitleBool);
        if (height !== null) {
            categoryAxisRenderer.configValue("axisLength", height);
        }
        categoryAxisRenderer.init();
    };

    var renderAxis = function() {
        var chartnode = getChartnode();
        // create y axis node if it not exists
        var yAxisnode = chartnode.select("g.yaxis-group");
        categoryAxisRenderer.draw(yAxisnode);
        // build x axis
        var xAxisnode = chartnode.select("g.xaxis-group")
                                 .classed("hidden", hideCYAxisBool)
                                 .attr("transform", "translate(0, " + (getChartHeight() + xAxisCount) + ")");
        var xAxisnodeQtr = chartnode.select("g.qtr-group")
                                    .classed("hidden", hideCYQtrAxisBool)
                                    .attr("transform", "translate(0, " + (getChartHeight() + (xAxisCount + cyQtrAxisCount)) + ")");
        var xAxisnodeFY = chartnode.select("g.fy-group")
                                   .classed("hidden", hideFYAxisBool)
                                   .attr("transform", "translate(0, " + (getChartHeight() + (fyAxisCount)) + ")");
        var xAxisnodeFYQtr = chartnode.select("g.fy-qtr-group")
                                      .classed("hidden", hideFYQtrAxisBool)
                                      .attr("transform", "translate(0, " + (getChartHeight() + (fyQtrAxisCount)) + ")");
        timeAxisRenderer.draw(xAxisnode);
        quarterAxisRenderer.drawQtr(xAxisnodeQtr);
        FYAxisRenderer.drawFY(xAxisnodeFY);
        FYQtrAxisRenderer.drawFYQtr(xAxisnodeFYQtr);  
    };

    var drawGrid = function() {
        var gridnode = getChartnode().select("g.grid-group");
        // draw x axis grid lines
        gridnode.selectAll("line.gridX").remove();
        gridnode.selectAll("line.gridX")
                .data(timeAxisRenderer.ticks(),function(d) { return d;})
                .enter().append("line")
                .attr("class", "gridX")
                .attr("x1", function(d) { return d;})
                .attr("x2", function(d) { return d;})
                .attr("y1", 0)
                .attr("y2", getChartHeight() )
                .style("stroke", "#ccc");
        // draw y axis grid lines
        var gridWidth = getChartWidth();
        gridnode.selectAll("line.gridY").remove();
        gridnode.selectAll("line.gridY")
                .data(categoryAxisRenderer.ticks(), function(d) { return d;})
                .enter()
                .append("line")
                .attr("class", "gridY")
                .attr("x1", 0)
                .attr("x2", gridWidth)
                .attr("y1", function(d) { return d;})
                .attr("y2", function(d) { return d;})
                .style("stroke", "#ccc");
    };

    var initChartCanvas = function () {
        var chartnode = d3.select(domNode)
                          .selectAll("svg")
                          .data([id], function(d) { return d;})
                          .enter()
                          .append("div")
                          .attr("id", "chartContainer")
                          .style("position", "relative")
                          .append("div").attr("id", absParent).style("position", "absolute")
                          .attr("height", "100%")
                          .attr("width", "100%")
                          .append("svg")
                          .attr("class", "chart")
                          .style("overflow", "auto")
                          .attr("pointer-events", "all")
                          // this "deselects" and "clears" a selection when using viz as a selector
                          .on("mousedown", function () {
                              me.clearSelections();
                              me.endSelections();
                          })
                          .append("g")
                          .attr("class", "gantt-chart")
                          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

        d3.select("#" + absParent)
          .append("div")
          .attr("id", tooltipID)
          .attr("class", "hidden tooltip")
          .append("p")
          .append("strong")
          .append("p")
          .append("span")
          .attr("id", "value");
        d3.select("#" + absParent)
          .append("canvas")
          .attr("style", "height:100%")
          .attr("style", "width:100%")
          .attr("style", "visibility: hidden");
        d3.select("#" + tooltipID + " p")
          .style("font-size", tooltipSizeFromProps);

        // add nodeing elements for graph components
        var gridnode = chartnode.append("g").attr("class","grid-group")
                                 // this "deselects" and "clears" a selection when using viz as a selector
                                .on("mousedown", function () {
                                    me.clearSelections();
                                    me.endSelections();
                                });
        var yAxisnode = chartnode.append("g").attr("class", "yaxis-group");
        var xAxisnode = chartnode.append("g").attr("class", "xaxis-group");
        var xAxisnodeQtr = chartnode.append("g").attr("class", "qtr-group");
        var barnode = chartnode.append("g").attr("class", "gantt-bars");
        xAxisnodeQtr = d3.select(domNode)
                         .selectAll(".gantt-chart")
                         .append("g")
                         .attr("class", "qtr-group");
        var xAxisnodeFY = d3.select(domNode)
                            .selectAll(".gantt-chart")
                            .append("g")
                            .attr("class", "fy-group");
        var xAxisnodeFYQtr = d3.select(domNode)
                               .selectAll(".gantt-chart")
                               .append("g")
                               .attr("class", "fy-qtr-group");
    };

    var init = function () {
        // configure axis and canvas        
        initTimeDomain(tasks);
        initChartCanvas();
    };

    // Checks if chart components are already configured
    var isInitialized = function() {
        // check if svg element exists, if it exists, chart has been initialized
        var svgSelection = d3.select(domNode).selectAll("svg").data([id], function(d){return d;});
        return !svgSelection.empty();
    };

    // CHART RENDERING METHODS
    // draws datelines on svg canvas
    var drawDateLines = function (dateLines) {
        var visibleDL = dateLines.filter(isDLVisible);
        var barnode = getChartnode().select(".gantt-bars");

        // remove previous objects
        barnode.selectAll("g.g_dateline").remove();

        // create new graphic objects
        var taskGSelection = barnode.selectAll("g").data(visibleDL,function(d){return d.date; });

        var nodes = taskGSelection.enter()
                                  .append("g")
                                  .attr("class", "g_dateline")
                                  .attr("y", 0)
                                  .attr("transform", dateLineTransform)
                                  .call(assignEvent,"dateline");
        
        // draw datelines and labels
        datelineRenderer.configValue("chartHeight",getChartHeight())
                        .configValue("tooltipID", tooltipID)
                        .eventHandlers(eventHandlers.dateline)
                        .draw(nodes);
    };
    
    var drawMilestones = function (mileStones) {
        var visibleMs = mileStones.filter(isMsVisible);
        var chartnode = getChartnode();
        var barnode =  chartnode.select(".gantt-bars");

        // delete previous svg objects
        barnode.selectAll("g.g_mileStone").remove();

        // append new task groups
        var taskGSelection = barnode.selectAll("g.g_milestone").data(visibleMs,mskeyFunction);
        var nodes = taskGSelection.enter()
                                  .append("g")
                                  .attr("class", "g_milestone")
                                  .attr("y", 0)
                                  .attr("transform", mileStoneTransform);

        // draw milestone marks and labels
        msRenderer.eventHandlers(eventHandlers.milestone)
                  .getThisForSel(me)
                  .configValue("showLabels", hideLabelBool)
                  .configValue("tooltipID", tooltipID)
                  .draw(nodes);
    };

    // checks if a task is visible
    var isTaskVisible = function(d) {
        return  (d.endDate > timeDomainStart) && (d.startDate < timeDomainEnd);
    };

    var isMsVisible = function(d) {
        return (d.date >= timeDomainStart) && (d.date <= timeDomainEnd);
    };

    var isDLVisible = function(d) {
        return (d.date >= timeDomainStart) && (d.date <= timeDomainEnd);
    };

    var calculateBarWidth = function (d) {
        var startDate = Math.max(timeDomainStart, d.startDate);
        var endDate = Math.min(timeDomainEnd, d.endDate);
        var width =  (timeAxisRenderer.position(endDate) - timeAxisRenderer.position(startDate)); 
        return width;
    };
    
    var drawTasks = function (tasks) {
        var visibleTasks = tasks.filter(isTaskVisible);
        var chartnode = getChartnode();
        var barnode =  chartnode.select(".gantt-bars");

        // remove all previous svg objects
        barnode.selectAll("g").remove();

        // append new task groups
        var taskGSelection = barnode.selectAll("g.g_task").data(visibleTasks,keyFunction);
        var nodes = taskGSelection.enter()
                                  .append("g")
                                  .attr("class","g_task")
                                  .attr("y", 0)
                                  .attr("transform", taskBarTransform);
        // draw task bars
        taskRenderer.calculateBarWidth(calculateBarWidth)
                    .eventHandlers(eventHandlers.task)
                    .getThisForSel(me)
                    .configValue("showLabels", hideLabelBool)
                    .configValue("dateLabels", hideDateLabelBool)
                    .configValue("tooltipID", tooltipID)
                    .draw(nodes);
    };

    var getnodePosition = function(nodeNode) {
        var tfrm = nodeNode.attr("transform");
        var pos_init = tfrm.indexOf("(");
        var pos_comma = tfrm.indexOf(",");
        var pos_end = tfrm.indexOf(")");
        var posX = tfrm.substring(pos_init+1, pos_comma);
        var posY = tfrm.substring(pos_comma+1, pos_end);
        return {"x":parseInt(posX, 10), "y": parseInt(posY, 10)};
    };

    var resizeChart = function() {
        var svgElement = d3.select(domNode)
                           .select("svg")
                           .data([id], function(d){return d;});
        // uses MSTR domNode for width
        svgElement.style("height", (getChartHeight() + margin.top + margin.bottom))
                  .attr("viewBox", "0 0 "+ domNode.clientWidth + " "  + (getChartHeight() + margin.top + margin.bottom) )
                  .attr("preserveAspectRatio", "xMinYMin slice")
                  .attr("height", (getChartHeight() + margin.top + margin.bottom))
                  .attr("width", domNode.clientWidth)
                  .style("width", domNode.clientWidth);
    };

    gantt.draw = function() {
        if (!isInitialized()) {
            init();
        }
        var visibleTasks = tasks.filter(isTaskVisible);
        // calculate task overlapping
        overlappingResolver.tasks(visibleTasks).calculateOverlapping();
        // render axis
        configureAxisDomain();
        drawGrid();
        renderAxis();
        // render task model visualization
        drawTasks(tasks);
        drawDateLines(dateLines);
        drawMilestones(mileStones);
        // resize svg element
        resizeChart();
        return gantt;
    };

    gantt.margin = function(value) {
        if (!arguments.length) {
            return margin;
        }
        margin = value;
        return gantt;
    };

    gantt.timeDomain = function(value) {
        if (!arguments.length) {
            return [ timeDomainStart, timeDomainEnd ];
        }
        timeDomainStart = +value[0], timeDomainEnd = +value[1];
        return gantt;
    };

    gantt.timeDomainMode = function(value) {
        if (!arguments.length) {
            return timeDomainMode;
        }
        timeDomainMode = value;
        return gantt;
    };

    gantt.id = function(value) {
        if (!arguments.length) {
            return id;
        }
        id = value;
        return gantt;
    };
    
    gantt.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value;
        return gantt;
    };

    gantt.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return gantt;
    };

    gantt.tickFormat = function(value) {
        if (!arguments.length) {
            return tickFormat;
        }
        tickFormat = value;
        return gantt;
    };

    gantt.categories = function(value) {
        if (!arguments.length) {
            return categories;
        }
        categories = value;
        overlappingResolver.categories(categories);
        return gantt;
    };

    gantt.tasks = function(value) {
        if (!arguments.length) {
            return tasks;
        }
        tasks = value;
        return gantt;
    };

    gantt.mileStones = function(value) {
        if (!arguments.length) {
            return mileStones;
        }
        mileStones = value;
        return gantt;
    };

    gantt.dateLines = function(value) {
        if (!arguments.length) {
            return dateLines;
        }
        dateLines = value;
        return gantt;
    };

    gantt.overlappingResolver = function(value) {
        if (!arguments.length) {
            return overlappingResolver;
        }
        overlappingResolver = value;
        return gantt;
    };

    gantt.categoryAxisRenderer = function(value) {
        if (!arguments.length) {
            return categoryAxisRenderer;
        }
        categoryAxisRenderer = value;
        return gantt;
    };

    gantt.taskRenderer = function(value) {
        if (!arguments.length) {
            return taskRenderer;
        }
        taskRenderer = value;
        return gantt;
    };

    gantt.msRenderer = function(value) {
        if (!arguments.length) {
            return msRenderer;
        }
        msRenderer = value;
        return gantt;
    };

    gantt.datelineRenderer = function(value) {
        if (!arguments.length) {
            return datelineRenderer;
        }
        datelineRenderer = value;
        return gantt;
    };

    gantt.taskEventHandler = function(event, handler) {
        eventHandlers["task"][event] = handler;
        return gantt;
    };
    gantt.milestoneEventHandler = function(event, handler) {
        eventHandlers["milestone"][event] = handler;
        return gantt;
    };
    gantt.datelineEventHandler = function(event, handler) {
        eventHandlers["dateline"][event] = handler;
        return gantt;
    };

    function gantt() {
        return gantt;
    };

    return gantt;
};

d3.timeAxisRenderer = function() {
    var scale = 1,
        timeDomain = [],
        config = {
            "axisLength": 600,
            "hideAxis": false,
            "strokeColor": "black",
            "rotateLabels": false
        },
        x = null,
        xAxis = null,
        formatPattern = "%b-%d-%y";

    /* Calculates categories ranges */
    timeAxisRenderer.init  = function() {
        x = d3.time
              .scale()
              .domain([ timeDomain[0], timeDomain[1] ])
              .range([ 0, config.axisLength ])
              .clamp(true);
        var formatter = d3.time.format(new String(formatPattern));
        xAxis = d3.svg
                  .axis()
                  .scale(x)
                  .orient("bottom")
                  .tickSubdivide(true)
                  .tickSize(8,0)
                  .tickPadding(8)
                  .tickFormat(formatter);
    };

    timeAxisRenderer.ticks = function() {
        domainValues = x.ticks(10);
        var tickPositions = domainValues.map(function(d) { return x(d);});
        return tickPositions;
    };

    // Calculates object rendering position in axis
    timeAxisRenderer.position = function(d) {
        return x(d);
    };

    // Draws axis hanging on the svg node passed as parameter
    timeAxisRenderer.draw  = function(node) {
        node.transition().call(xAxis);
        node.selectAll(".tick minor").attr("style", "stroke:" + config.strokeColor);
        node.selectAll("text").style("fill", config.strokeColor);
        if (config.rotateLabels) {
            node.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)");
        }
        node.selectAll("line").attr("style", "stroke:" + config.strokeColor);
        node.selectAll(".domain").attr("style", "stroke:" + config.strokeColor);
    };

    timeAxisRenderer.domain = function(value) {
        if (!arguments.length)
            return timeDomain;
        timeDomain = value;
        return timeAxisRenderer;
    };

    timeAxisRenderer.config = function(value) {
        if (!arguments.length)
            return config;
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return timeAxisRenderer;
    };

    timeAxisRenderer.configValue = function(property, value) {
        config[property]=value;
        return timeAxisRenderer;
    };

    timeAxisRenderer.tickFormat = function(value) {
        if (!arguments.length)
            return formatPattern;
        formatPattern = value;
        return timeAxisRenderer;
    };

    function timeAxisRenderer() {
    }

    return timeAxisRenderer;
};

d3.quarterAxisRenderer = function() {
    var scale = 1,
        timeDomain = [],
        config = {
            "axisLength": 600,
            "hideAxis": true,
            "strokeColor": "black",
            "rotateLabels": false
        },
        x2 = null,
        xAxisQtr = null;

    var getHideAxisConfig = function(g) {
        g.selectAll(".xaxis-qtr-group").classed("hidden", config.hideAxis);
    };

    quarterAxisRenderer.init  = function() {
        x2 = d3.time
               .scale()
               .domain([ d3.time.day.offset(timeDomain[0], -45), d3.time.day.offset(timeDomain[1], -45) ])
               .nice()
               .range([ 0, config.axisLength ]);
        xAxisQtr = d3.svg
                     .axis()
                     .scale(x2)
                     .orient("bottom")
                     .ticks(d3.time.months, 3)
                     .tickSize(0,8,0)
                     .tickSubdivide(1)
                     .tickFormat(function(x2){
                         // calculate new date 10 seconds earlier
                         var earlyDate = new Date(d3.time.day.offset(x2, 45).getTime() - 10000);
                         // calculate the month (0-11) based on the new date
                         var mon = earlyDate.getMonth(),
                             yr = earlyDate.getFullYear().toString().substr(2,2);
                         // return appropriate quarter for that month
                         if ( mon <= 2 ) {
                             return  "Q1 CY" + yr;
                         } else if ( mon <= 5 ) {
                             return  "Q2 CY" + yr;
                         } else if ( mon <= 8 ) {
                             return  "Q3 CY" + yr;
                         } else {
                             return "Q4 CY" + yr;
                         }
                     });
    };

    /* Draws Qtr axis hanging on the svg node passed as parameter */
    quarterAxisRenderer.drawQtr  = function(node) {
        node.transition().call(xAxisQtr);
        node.selectAll(".tick minor").attr("style", "stroke:" + config.strokeColor);
        node.selectAll("text").attr("style", "fill:" + config.strokeColor + "; text-anchor: middle;");
        if (config.rotateLabels)
            node.selectAll("text").style("text-anchor", "end").attr("dx", "-.8em").attr("dy", ".15em").attr("transform", "rotate(-45)" );
        node.selectAll("line").attr("style", "stroke:" + config.strokeColor);
        node.selectAll(".domain").attr("style", "stroke:" + config.strokeColor);
    };

    quarterAxisRenderer.domain = function(value) {
        if (!arguments.length)
            return timeDomain;
        timeDomain = value;
        return quarterAxisRenderer;
    };

    quarterAxisRenderer.config = function(value) {
        if (!arguments.length)
            return config;
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return quarterAxisRenderer;
    };

    quarterAxisRenderer.configValue = function(property, value) {
        config[property]=value;
        return quarterAxisRenderer;
    };

    function quarterAxisRenderer() {
    }

    return quarterAxisRenderer;
};

d3.FYQtrAxisRenderer = function() {
    var scale = 1;
    var timeDomain = [];
    var config = {
        "axisLength": 600,
        "hideAxis": true,
        "strokeColor": "black",
        "rotateLabels": false
    };
    var x = null;
    var xAxisFYQtr = null;

    var getHideAxisConfig = function(g) {
        g.selectAll(".xaxis-group").classed("hidden", config.hideAxis);
    };

    FYQtrAxisRenderer.init  = function() {
        x = d3.time
              .scale()
              .domain([d3.time.day.offset(timeDomain[0],-45),d3.time.day.offset(timeDomain[1],-45)])
              .nice()
              .range([0,config.axisLength]);
        xAxisFYQtr = d3.svg
                       .axis()
                       .scale(x)
                       .orient("bottom")
                       .ticks(d3.time.months, 3)
                       .tickSize(0,8,0)
                       .tickSubdivide(1)
                       .tickFormat(function(x) {
                           // calculate new date 10 seconds earlier
                           var earlyDate = new Date(d3.time.day.offset(x, 105).getTime() - 10000);
                           // calculate the month (0-11) based on the new date
                           var mon = earlyDate.getMonth(),
                               yr = earlyDate.getFullYear().toString().substr(2,2);
                           // return appropriate quarter for that month
                           if ( mon <= 2 ) {
                               return  "Q1 FY" + yr;
                           } else if ( mon <= 5 ) {
                               return  "Q2 FY" + yr;
                           } else if ( mon <= 8 ) {
                               return  "Q3 FY" + yr;
                           } else {
                               return "Q4 FY" + yr;
                           }
                       });
    };

    // Draws Qtr axis hanging on the svg node passed as parameter
    FYQtrAxisRenderer.drawFYQtr  = function(node) {
        node.transition().call(xAxisFYQtr);
        node.selectAll(".tick minor").attr("style", "stroke:" + config.strokeColor);
        node.selectAll("text").attr("style", "fill:" + config.strokeColor + "; text-anchor: middle;");
        if (config.rotateLabels) {
            node.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)" );
        }
        node.selectAll("line").attr("style", "stroke:" + config.strokeColor);
        node.selectAll(".domain").attr("style", "stroke:" + config.strokeColor);
    };

    FYQtrAxisRenderer.domain = function(value) {
        if (!arguments.length) {
            return timeDomain;
        }
        timeDomain = value;
        return FYQtrAxisRenderer;
    };

    FYQtrAxisRenderer.config = function(value) {
        if (!arguments.length) {
            return config;
        }
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return FYQtrAxisRenderer;
    };

    FYQtrAxisRenderer.configValue = function(property, value) {
        config[property]=value;
        return FYQtrAxisRenderer;
    };

    function FYQtrAxisRenderer() {
    }

    return FYQtrAxisRenderer;
};

d3.FYAxisRenderer = function() {
    var scale = 1;
    var timeDomain = [];
    var config = {
        "axisLength": 600,
        "hideAxis": true,
        "strokeColor": "black",
        "rotateLabels": false
    };
    var x = null;
    var xAxisFY = null;

    FYAxisRenderer.init  = function() {
        x = d3.time
              .scale()
              .domain([ d3.time.month.offset(timeDomain[0], -3), d3.time.month.offset(timeDomain[1], -3) ])
              .nice()
              .range([ 0, config.axisLength ]);
        xAxisFY = d3.svg
                    .axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(d3.time.months, 12)
                    .tickSize(0,8,0)
                    .tickSubdivide(1)
                    .tickFormat(function(x){return "FY" + x.getFullYear();});
    };

    // Draws Qtr axis hanging on the svg node passed as parameter
    FYAxisRenderer.drawFY  = function(node) {
        node.transition().call(xAxisFY);
        node.selectAll(".tick minor").attr("style", "stroke:" + config.strokeColor);
        node.selectAll("text").attr("style", "fill:" + config.strokeColor + "; text-anchor: middle;");
        if (config.rotateLabels) {
            node.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)" );
        }
        node.selectAll("line").attr("style", "stroke:" + config.strokeColor);
        node.selectAll(".domain").attr("style", "stroke:" + config.strokeColor);
    };

    FYAxisRenderer.domain = function(value) {
        if (!arguments.length) {
            return timeDomain;
        }
        timeDomain = value;
        return FYAxisRenderer;
    };

    FYAxisRenderer.config = function(value) {
        if (!arguments.length) {
            return config;
        }
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return FYAxisRenderer;
    };

    FYAxisRenderer.configValue = function(property, value) {
        config[property]=value;
        return FYAxisRenderer;
    };

    function FYAxisRenderer() {
    }

    return FYAxisRenderer;
};

d3.categoryAxisRenderer = function() {
    // Each position stores an array with two items, tasksBand_height and milestonesBand_height
    var overlappingResolver,
        scale = 1,
        categories = [],
        categoriesRanges = {},
        calculatedLength = 0,
        config = {
            "axisLength": null,
            "barHeight" : 15,
            "progressBarPorcHeight" : 100,
            "barPadding" : 10,
            "barMargin" : 10,
            "minTaskBandHeight": 30,
            "mileStoneHeight" : 15,
            "strokeColor" : "black",
            "yAxisTitle": "",
            "hideTitle": false,
            "catLabelHgtFactor": 2
        };

    // Calculates categories ranges
    categoryAxisRenderer.init  = function() {
        var ini = 0,
            end = 0,
            category;
        for (var c=0; c < categories.length; c++) {
            category = categories[c];
            var taskBandH = calculateTaskBandHeight(category);
            var msBandH = calculateMilestoneBandHeight(category);
            end = ini + taskBandH + msBandH + 10;
            categoriesRanges[category] = { "taskIni": ini, "taskEnd": (ini +taskBandH), "mStoneIni": (ini + taskBandH),  "mStoneEnd": end } ;
            ini = end;
        }
        calculatedLength = end;
        return categoryAxisRenderer;
    };

    categoryAxisRenderer.ticks = function() {
        var category, range, ticks = [];
        for (var c= 0; c < categories.length; c++) {
            category = categories[c];
            range = getCategoryRange(category);
            ticks.push(scaleValue(range[0]));
        }
        if (range !== null) {
            // last tick
            ticks.push(scaleValue(range[1]));
        }
        return ticks;
    };

    // Calculates object rendering position in category axis
    categoryAxisRenderer.position = function(d) {
        var ypos;
        // check if object is a task or a milestone
        if (hasOwnProperty(d, "startDate")) {
            // task
            var numOverlappingTasks = overlappingResolver.taskTotalOverlaps(d);
            var categoryTaskRange = getCategoryTasksRange(d.category);
            ypos = categoryTaskRange[0] + config.barMargin + numOverlappingTasks*(config.barHeight + config.barPadding);
        } else {
            if (hasOwnProperty(d, "date")) {
                // milestone
                var categoryMsRange = getCategoryMileStonesRange(d.category);
                ypos = categoryMsRange[0] + config.mileStoneHeight - 6;
            } else{
                // invalid object type
                return null;
            }
        }
        return scaleValue(ypos);
    };

    // Draws axis hanging on the svg node passed as parameter
    categoryAxisRenderer.draw  = function(node) {
        var colors = d3.scale.category10().domain(d3.range(0,10));
        function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1,
                    y = -10,
                    dy = 0.05;
                tspan = text.text(null)
                            .append("tspan")
                            .attr("x", -5)
                            .attr("y", y)
                            .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                                    .attr("x", -5)
                                    .attr("y", y)
                                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                    .text(word);
                    }
                }
            });
        }

        // draw axis line
        node.selectAll("line.axisY").remove();
        node.append("line")
            .attr("x1","0")
            .attr("y1","-1")
            .attr("x2","0")
            .attr("y2",scaleValue(calculatedLength))
            .attr("class", "axisY")
            .attr("style", "stroke:" + config.strokeColor);

        // draw category labels
        node.selectAll("g").remove();
        node.selectAll("g").data(categories, function(d) {return d;}).enter()
            .append("g")
            .attr("transform", catnodeTranslation)
            .append("text")
            .attr("x", "-5")
            .style("fill", config.strokeColor)
            .style("dominant-baseline", "auto")
            .style("text-anchor", "end")
            .text(function(d) { return d;})
            .call(wrap, 100)
            .style("alignment-middle", "text-before-edge");

        // remove previous tips and draw a line for each tip
        node.selectAll("line.tickY").remove();
        node.selectAll("line.tickY")
            .data(categoryAxisRenderer.ticks())
            .enter()
            .append("line")
            .attr("class", "tickY")
            .attr("x1","0")
            .attr("y1",function(d) { return d;})
            .attr("x2","-100")
            .attr("y2",function(d) { return d;})
            .attr("style", "stroke:" + config.strokeColor);

        // add yaxis title which is pulled from source Parent Column header
        node.append("text")
            .attr("id", "yAxisTitle")
            .attr("x","-50")
            .attr("y","-5")
            .attr("style", "fill:" + config.strokeColor)
            .style("text-anchor", "middle")
            .text(config.yAxisTitle)
            .classed("hidden", config.hideTitle);

        return categoryAxisRenderer;
    };

    var calculateTaskBandHeight = function(category) {
        var numPararellTasks = overlappingResolver.categoryMaxOverlaps(category);
        var height = config["minTaskBandHeight"];
        if (numPararellTasks > 0) {
            height = config.barMargin + (numPararellTasks-1)*(config.barHeight + config.barPadding) + config.barHeight + config.barMargin;
        }
        return height;
    };

    var calculateMilestoneBandHeight = function(category) {
        return config.mileStoneHeight;
    };

    var catnodeTranslation = function(d) {
        var range = getCategoryRange(d);
        var ypos = range[0] + (range[1]-range[0])/config.catLabelHgtFactor;
        return "translate(0," + scaleValue(ypos)+ ")";
    };

    var scaleValue = function(value) {
        var proportion = 1;
        if (config.axisLength != null && calculatedLength >0) {
            proportion = config.axisLength/calculatedLength;
        }
        return value * proportion;
    };

    var getCategoryRange  = function(category) {
        return [categoriesRanges[category].taskIni,categoriesRanges[category].mStoneEnd];
    };

    var getCategoryTasksRange  = function(category) {
        return [categoriesRanges[category].taskIni,categoriesRanges[category].taskEnd];
    };

    var getCategoryMileStonesRange  = function(category) {
        return [categoriesRanges[category].mStoneIni,categoriesRanges[category].mStoneEnd];
    };

    categoryAxisRenderer.overlappingResolver = function(value) {
        if (!arguments.length) {
            return overlappingResolver;
        }
        overlappingResolver = value;
        return categoryAxisRenderer;
    };

    categoryAxisRenderer.categories = function(value) {
        if (!arguments.length) {
            return categories;
        }
        categories = value;
        return categoryAxisRenderer;
    };

    categoryAxisRenderer.scale = function(value) {
        if (!arguments.length) {
            return scale;
        }
        scale = value;
        return categoryAxisRenderer;
    };

    categoryAxisRenderer.config = function(value) {
        if (!arguments.length) {
            return config;
        }
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return categoryAxisRenderer;
    };

    categoryAxisRenderer.configValue = function(property, value) {
        config[property]=value;
        return categoryAxisRenderer;
    };

    categoryAxisRenderer.calculatedLength = function() {
        return calculatedLength;
    };

    function categoryAxisRenderer() {
    }

    return categoryAxisRenderer;
};

d3.overlappingResolver = function() {
    /* registers overlaps between tasks. Each item relates task"s
        id with an array containing overlapped tasks id*/
    var categories = [],
        tasks = [],
        range = [0,200],
        overlaps = {};

    overlappingResolver.categories = function(value) {
        if (!arguments.length) {
            return categories;
        }
        categories = value;
        return overlappingResolver;
    };

    overlappingResolver.tasks = function(value) {
        if (!arguments.length) {
            return tasks;
        }
        tasks = value;
        overlaps = {};
        return overlappingResolver;
    };

    // Calculates de max num of parallel task in a category
    overlappingResolver.categoryMaxOverlaps = function (category) {
        var maxParallel = 0;
        // get category tasks
        var searchFunctor = function(d) {return (d.category == category);};
        var taskList = tasks.filter(searchFunctor);
        var numParallel = 0;
        for (var t=0; t< taskList.length; t++) {
            numParallel = overlappingResolver.taskTotalOverlaps(taskList[t]) + 1;
            if (numParallel > maxParallel) {
                maxParallel = numParallel;
            }
        }
        return maxParallel;
    };

    // get num of overlaps of current tasks
    overlappingResolver.taskOverlaps = function (task) {
        return overlaps[task.id];
    };

    // get num of overlaps of current tasks joined with overlaps of overlapped tasks
    overlappingResolver.taskTotalOverlapsOld = function (task) {
        var olp = [];
        deepSearch(task.id, olp);
        var uniqueValues = olp.filter(function(elem, pos) {
            return olp.indexOf(elem) == pos;
        });
        return uniqueValues;
    };


    overlappingResolver.taskTotalOverlaps = function (task) {
        var currentTaskId = task.id;
        var hasNext = (overlaps[currentTaskId] != null && overlaps[currentTaskId].length > 0);
        var numOverlaps = 0;
        while (hasNext) {
            currentTaskId = overlaps[currentTaskId][0];
            numOverlaps++;
            hasNext = (overlaps[currentTaskId] != null && overlaps[currentTaskId].length > 0);
        }
        return numOverlaps;
    };

    function deepSearch(element, stack) {
        if (!hasOwnProperty(overlaps, element)) {
            return;
        } else {
            for (var i=0; i < overlaps[element].length; i++) {
                deepSearch(overlaps[element][i], stack);
                stack.push(overlaps[element][i]);
            }
        }

    }

    var addOverlap = function (overlappingTask, overlappedTask) {
        if (!hasOwnProperty(overlaps, overlappingTask.id)) {
            overlaps[overlappingTask.id] = [];
        }
        overlaps[overlappingTask.id].push(overlappedTask.id);
    };


    overlappingResolver.calculateOverlapping = function () {
        // for each category go trought tasks and populate overlaps array
        for (var i = 0; i < categories.length; i++) {
            calculateCategoryOverlapping(categories[i]);
        }
        return overlappingResolver;
    };

    /* Go through category task and check which ones are overlapped and
    populate overlaps hash with this info */
    var calculateCategoryOverlapping = function(category) {
        var searchFunctor = function(d) {return (d.category == category);};
        var taskList = tasks.filter(searchFunctor);
        if (taskList != null && taskList.length > 0) {
            for (var t = 0; t < taskList.length; t++) {
                checkOverlapping(taskList[t],t, taskList);
            }
        }
    };

    // Checks overlapping between current task and all preceding ones
    var checkOverlapping = function(element, index, array) {
        if (index == 0) {
            return;
        }
        for (i=index-1; i>=0; i--) {
            if (element.startDate < array[i].endDate) {
                // current task overlaps in array[i] task
                addOverlap(element, array[i])
            }
        }
    };

    function overlappingResolver() {
        return overlappingResolver;
    };

    return overlappingResolver;
};

function hasOwnProperty (obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

d3.taskRenderer = function() {
    var config = {
        "axisLength": 600,
        "barHeight" : 15,
        "progressBarHeight" : 5,
        "showLabels": false,
        "dateLabels": true,
        "tooltipID": ""
    };
    var eventAssigner = null,
        calculateBarWidth = null,
        eventHandlers = null,
        getThisForSel = null;

    var assignEvent = function (selection) {
        for (h in eventHandlers) {
            selection.on(h,eventHandlers[h]);
        }
    };

    // Draws taks bars hanging on the svg node passed as parameter
    taskRenderer.draw  = function( node ) {
        var colors = d3.scale.category10().domain(d3.range(0,10));
        node.append("rect")
            .attr("y", 0)
            .attr("height", config.barHeight)
            .attr("width", calculateBarWidth)
            .attr("class", function(d) {if (hasOwnProperty(d,"class")) return d.class + "-bar"; else return "task-bar";})
            .attr("fill", function(d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d.category == categories[i]) {
                        return d3.rgb(colors(i));
                    }
                }
            })
            .on("mouseover", function(d) {
                // Get this bar"s x/y values, then augment for the tooltip
                var translate = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var xPosition = translate[0];
                var yPosition = translate[1];
                var precisionPercent = d3.format(".1f")(d.progress*100);

                // Update the tooltip position and value
                d3.select("#" + config.tooltipID)
                    .style("left",xPosition + "px")
                    .style("top", yPosition + "px")
                    .select("#value")
                    .html(d.label+"<br>"+"Start Date: "+d.startDate.toLocaleDateString("en-US")+"<br>" + "End Date: "+d.endDate.toLocaleDateString("en-US")+"<br>" + "Progress: "+ precisionPercent +"%");

                // Show the tooltip
                d3.select("#" + config.tooltipID).classed("hidden", false);
            })
            .on("mouseout", function() {
                // Hide the tooltip
                d3.select("#" + config.tooltipID).classed("hidden", true);
            })
            .on("mousedown", function (d) {
                // use the selector API when clicking on a bar
                getThisForSel.applySelection(d.selection);
                var event = event || window.event;
                event.stopPropagation();
            });

        // add progress bar"s rect
        node.append("rect")
            .attr("y", (config.barHeight-config.progressBarHeight)/2)
            .attr("height", config.progressBarHeight )
            .attr("width", function (d) {
                    if (hasOwnProperty(d,"progress")) {
                        return d.progress * calculateBarWidth(d);
                    } else {
                        return 0;
                    }
                })
            .attr("class", function(d) {if (hasOwnProperty(d,"class")) return d.class + "-progress-bar"; else return "task-progress-bar";})
            .attr("fill", function(d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d.category == categories[i]) {
                        return d3.rgb(colors(i)).brighter();
                    }
                }
            })
            .call(assignEvent);

        // add task labels
        node.append("text")
            .attr("y", function(d) { return 3 + config.barHeight /2; })
            .attr("x", 35)
            .attr("class", function(d) {if (hasOwnProperty(d,"class")) return d.class + "-label"; else return "task-label";})
            .text(function(d) { return d.label;})
            .attr("fill", function(d) {
                for (var i = 0; i < categories.length; i++) {
                  if (d.category == categories[i]) {
                    return d3.rgb(colors(i)).darker(3);
                  }
                }
              })
            .classed("hidden", config.showLabels);

        // add start date label
        node.append("text")
            .attr("y", function(d) { return 3 + config.barHeight /2; })
            .attr("x", 0)
            .attr("class", "task-date-label")
            .text(function(d) { return d.startDate.getMonth()+1 + "/" + d.startDate.getDate();})
            .classed("hidden", config.dateLabels);

        // add end date label
        node.append("text")
            .attr("y", function(d) { return 3 + config.barHeight /2; })
            .attr("x", function(d) {
                var taskWidth = calculateBarWidth(d);
                var endLabelLoc = taskWidth - 30;
                return endLabelLoc;
            })
            .attr("class", "task-date-label")
            .text(function(d) { return d.endDate.getMonth()+1 + "/" + d.endDate.getDate();})
            .classed("hidden", config.dateLabels);
    };

    taskRenderer.eventHandlers = function(value) {
        if (!arguments.length) {
            return eventHandlers;
        }
        eventHandlers = value;
        return taskRenderer;
    };

    taskRenderer.calculateBarWidth = function(value) {
        if (!arguments.length) {
            return calculateBarWidth;
        }
        calculateBarWidth = value;
        return taskRenderer;
    };

    taskRenderer.getThisForSel = function(value) {
        if (!arguments.length) {
            return getThisForSel;
        }
        getThisForSel = value;
        return taskRenderer;
    };

    taskRenderer.config = function(value) {
        if (!arguments.length) {
            return config;
        }
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return taskRenderer;
    };

    taskRenderer.configValue = function(property, value) {
        config[property]=value;
        return taskRenderer;
    };

    function taskRenderer() {
    }

    return taskRenderer;
};

d3.msRenderer = function() {
    var config = {
        "mileStoneRadius":4,
        "showLabels": false,
        "tooltipID": ""
    };

    var getThisForSel = null;

    var assignEvent = function (selection) {
        for (h in eventHandlers) {
            selection.on(h,eventHandlers[h]);
        }
    };

    // Draws taks bars hanging on the svg node passed as parameter
    msRenderer.draw  = function( node ) {
        var colors = d3.scale.category10().domain(d3.range(0,10));
         // add milestone mark
        node.append("circle")
            .attr("cx",0)
            .attr("cy","0")
            .attr("class", function(d) {if (hasOwnProperty(d,"class")) return d.class+ "-mark"; else return "milestone-mark";})
            .attr("style",function (d) { return d.style;})
            .attr("fill", function(d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d.category == categories[i]) {
                        return d3.rgb(colors(i));
                    }
                }
            })
            .attr("r",config.mileStoneRadius)
            .on("mousedown", function (d) {
                // use the selector API when clicking on a bar
                getThisForSel.applySelection(d.selection);
                event.stopPropagation();
            })
            .on("mouseover", function(d) {
                // Get this bar"s x/y values, then augment for the tooltip
                var translate = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var xPosition = translate[0];
                var yPosition = translate[1] - 40;
                // Update the tooltip position and value
                d3.select("#" + config.tooltipID)
                  .style("left", xPosition + "px")
                  .style("top", yPosition + "px")
                  .select("#value")
                  .html(d.label + "<br>" + "Date: " + d.date.toLocaleDateString("en-US"));
                // Show the tooltip
                d3.select("#" + config.tooltipID).classed("hidden", false);
            })
            .on("mouseout", function() {
                // Hide the tooltip
                d3.select("#" + config.tooltipID).classed("hidden", true);
            });

        // add labels
        node.append("text")
            .attr("x",  config.mileStoneRadius*2)
            .attr("y",  config.mileStoneRadius)
            .attr("class", function(d) {if (hasOwnProperty(d,"class")) return d.class+ "-label"; else return "milestone-label";})
            .attr("fill", function(d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d.category == categories[i]) {
                        return d3.rgb(colors(i)).brighter();
                    }
                }
            })
            .text(function(d) { return d.id;})
            .classed("hidden", config.showLabels);
    };

    msRenderer.eventHandlers = function(value) {
        if (!arguments.length) {
            return eventHandlers;
        }
        eventHandlers = value;
        return msRenderer;
    };

    msRenderer.getThisForSel = function(value) {
        if (!arguments.length) {
            return getThisForSel;
        }
        getThisForSel = value;
        return msRenderer;
    };

    msRenderer.config = function(value) {
        if (!arguments.length) {
            return config;
        }
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return msRenderer;
    };

    msRenderer.configValue = function(property, value) {
        config[property]=value;
        return msRenderer;
    };

    function msRenderer() {
    }

    return msRenderer;
};

d3.datelineRenderer = function() {
    var config = {
        "chartHeight":100,
        "tooltipID": ""
    };

    var assignEvent = function (selection) {
        for (h in eventHandlers) {
            selection.on(h,eventHandlers[h]);
        }
    };

    // Draws task bars hanging on the svg node passed as parameter
    datelineRenderer.draw  = function( node ) {
        node.append("line")
            .attr("x1","0")
            .attr("y1","0")
            .attr("x2","0")
            .attr("y2",config.chartHeight)
            .attr("class", function(d) {if (hasOwnProperty(d,"class")) return d.class + "-line"; else return "dateline-line";})
            .attr("style",function (d) { return d.style;})
            .on("mouseover", function(d) {
                //Get this bar"s x/y values, then augment for the tooltip
                var translate = d3.transform(d3.select(this.parentNode)
                                  .attr("transform"))
                                  .translate;
                var xPosition = translate[0];
                var yPosition = translate[1] + (config.chartHeight/2);

                // Update the tooltip position and value
                d3.select("#" + config.tooltipID)
                  .style("left", xPosition + "px")
                  .style("top", yPosition + "px")
                  .select("#value")
                  .html("Dateline: " + d.date.toLocaleDateString("en-US"));

                // Show the tooltip
                d3.select("#" + config.tooltipID)
                  .classed("hidden", false);
            })
            .on("mouseout", function() {
                // Hide the tooltip
                d3.select("#" + config.tooltipID)
                  .classed("hidden", true);
            });
    };

    datelineRenderer.eventHandlers = function(value) {
        if (!arguments.length) {
            return eventHandlers;
        }
        eventHandlers = value;
        return datelineRenderer;
    };

    datelineRenderer.config = function(value) {
        if (!arguments.length) {
            return config;
        }
        // copy values in config object
        for (var k in config) config[k]=value[k];
        return datelineRenderer;
    };

    datelineRenderer.configValue = function(property, value) {
        config[property]=value;
        return datelineRenderer;
    };

    function datelineRenderer() {
    }

    return datelineRenderer;
};

var gantt = d3.gantt()
              .categories(categories)
              .tasks(tasks)
              .mileStones(milestones)
              .dateLines(datelines)
              .draw();