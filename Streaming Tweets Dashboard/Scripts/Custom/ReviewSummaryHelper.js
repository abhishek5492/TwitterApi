var currentStartIndex = 0;
var currentLength = 0;
var currentTotalRecords = 0;
var currentStartQCrequestID
var currentEndQCrequestID = 0;
var currentSortOrderCol = 0;
var currentSortOrderdir = 0;
var isCurrentPageEmpty = false;
var isCurrent = true;
var initStartID = null;
var isSort = false;

function LoadReviewSummary() {
    var tblReviewSummary = $("#tblReviewSummary").on('xhr.dt', function (e, settings, json, xhr) {
        currentTotalRecords = json.recordsTotal;
        currentLength = settings._iDisplayLength;
        if (json.data.length > 0) {
            currentStartQCrequestID = Math.min.apply(Math, json.data.map(function (o) { return o.QCRequestID; }));
            currentEndQCrequestID = Math.max.apply(Math, json.data.map(function (o) { return o.QCRequestID; }));
            isCurrentPageEmpty = false;
            currentSortOrderCol = settings.aaSorting[0][0];
            currentSortOrderdir = settings.aaSorting[0][1];

            if (settings.bSorted) {
                settings._iDisplayStart = currentStartIndex;
            }
            currentStartIndex = settings._iDisplayStart;
        }
        else {
            isCurrentPageEmpty = true;
        }
    }).DataTable({
        "bServerSide": true,
        "bProcessing": true,
        "ajax": {
            "url": "ReviewSummary/reviews",
            "type": "POST",
            "datatype": "json",
            "data": function (d) {

                if (d.draw > 1) {
                    var isSortAction = (currentSortOrderCol === d.order[0].column && currentSortOrderdir === d.order[0].dir) ? false : true;;
                    if (d.length != currentLength) {
                        d.RecordsPerPageChanged = true;
                        d.Next = true;
                    }
                    else {
                        d.RecordsPerPageChanged = false;
                    }

                    if (isCurrentPageEmpty && !isSortAction) {
                        d.Next = true;
                        d.startQCRequestID = currentStartQCrequestID;
                        d.isFromEmptyPage = true;
                    }
                    else {
                        if (d.start > currentStartIndex && !isSortAction) {
                            d.Next = true;
                            d.startQCRequestID = currentEndQCrequestID;
                        }
                        else if (d.start < currentStartIndex && !isSortAction) {
                            d.Next = false;
                            d.startQCRequestID = currentStartQCrequestID;
                        }
                        else if (d.start == currentStartIndex && isSortAction && !isCurrentPageEmpty) {
                            d.Next = true;
                            d.isFromSort = true;
                            isSort = true;
                            d.startQCRequestID = currentStartQCrequestID;
                        }
                        else if (d.start < currentStartIndex && isSortAction && !isCurrentPageEmpty) {
                            d.Next = true;
                            d.isFromSort = true;
                            isSort = true;
                            d.startQCRequestID = currentStartQCrequestID;
                        }
                    }

                    d.currentTotalRecords = currentTotalRecords;

                }
                d.isCurrent = isCurrent;
            }
        },
        "columnDefs":
                [//{
                    //    "targets": [0],
                    //    "visible": false,
                    //    "searchable": false
                    //},
                {
                    "targets": [1],
                    "visible": false,
                    "searchable": false
                },
                {
                    "targets": [4],
                    "data": "ReceivedAt",
                    "render": function (data, type, row) {

                        if (data == null || data.length <= 0) {
                            return "";
                        }
                        else {
                            var date = new Date(parseInt(data.substr(6)));
                            return (new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)).toLocaleString();
                        }
                    }
                },
                {
                    "targets": [5],
                    "data": "CompletedAt",
                    "render": function (data, type, row) {
                        if (data == null || data.length <= 0) {
                            return "";
                        }
                        else {
                            var date = new Date(parseInt(data.substr(6)));
                            return (new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)).toLocaleString();
                        }
                    }
                }],
        "columns": [
                      { "data": "QCRequestID", "name": "QCRequestID", "autoWidth": true },
                      { "data": "TransactionID", "name": "TransationID", "autoWidth": true },
                      { "data": "ProcessName", "title": "Process Name", "name": "Process", "autoWidth": true },
                      { "data": "FileName", "name": "File Name", "autoWidth": true },
                      { "data": "ReceivedAt", "name": "Received At", "autoWidth": true },
                      { "data": "CompletedAt", "name": "Completed At", "autoWidth": true },
                      { "data": "Status", "name": "Status", "autoWidth": true },
                      { "data": "ReviewedBy", "name": "Reviewer", "title": "Reviewer", "autoWidth": true }],
        "searching": false,
        "bPaginate": true,
        "pagingType": "simple",
        "bRetrieve": true,
        "info": false,
        scrollY: '55vh',
        scrollCollapse: true,
        "processing": true,
        "initComplete": function () { alert("dt draw complete") },
        dom: 'l<"toolbar">frtip',
        initComplete: function () {
            var reviewTypeOptionelem = '<div class="radioReview radio-info radio-inline" > <input type="radio" id="rdCurrent" value="Current" name="SummaryType" onclick = "SummaryTypeSelected(this);" checked="checked"><label for="rdCurrent"> Current </label></div><div class="radioReview radio-info radio-inline"><input type="radio" id="rdHistory" value="History" name="SummaryType" onclick = "SummaryTypeSelected(this);"><label for="rdHistory"> History </label></div>';
            if (!isCurrent) {
                reviewTypeOptionelem = '<div class="radioReview radio-info radio-inline" > <input type="radio" id="rdCurrent" value="Current" name="SummaryType" onclick = "SummaryTypeSelected(this);"><label for="rdCurrent"> Current </label></div><div class="radioReview radio-info radio-inline"><input type="radio" id="rdHistory" value="History" name="SummaryType" checked="checked" onclick = "SummaryTypeSelected(this);"><label for="rdHistory"> History </label></div>';
            }

            $("div.toolbar")
               .html(reviewTypeOptionelem);

            $("#dvReviewSummary").addClass("reviewsummarycustomtoolbar");
        }
    });

    tblReviewSummary.on('draw', function (settings) {
        if (isCurrentPageEmpty) {
            $("#tblReviewSummary_next").addClass("disabled");
        }
    });
}

function SummaryTypeSelected(rdElem) {
    isCurrent = $(rdElem).val() === "History" ? false : true;
    $("#tblReviewSummary").DataTable().clear().destroy();
    ResetSummaryGlobalVariables();
    LoadReviewSummary();
}

function ResetSummaryGlobalVariables() {
    currentStartIndex = 0;
    currentLength = 0;
    currentTotalRecords = 0;
    currentStartQCrequestID
    currentEndQCrequestID = 0;
    currentSortOrderCol = 0;
    currentSortOrderdir = 0;
    isCurrentPageEmpty = false;
    initStartID = null;
    isSort = false;
}