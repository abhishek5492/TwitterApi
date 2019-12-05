var CurrentReviewStatus = [];
var selectedProcesses = null;
var refreshProcessQueueCountWorker;
var refreshCount;
var selectFirstField = false;
var currentProcessInReviewName = "";

function openNav() {
    document.getElementById("ReviewSidenav").style.width = "355px";
    document.getElementById("main").style.marginLeft = "11%";
    document.getElementById("main").style.paddingLeft = "2%";
    document.body.style.backgroundColor = "rgba(0,0,0,0.5)";

    $("#dvReviewSideNavCollapsed").hide();
    $("#ReviewSidenav").show();
    ShowHideQCorrectMasterImage(true);
}

function ShowHideQCorrectMasterImage(isExpand) {
    var divQCorrectMaster = $("#dvQCorrectMaster");

    if (!$("#dvNoRequestsAvailable").is(':visible') && !$("#dvReviewStopRequested").is(':visible') && !$("#dvPDFViewer").is(':visible') && !$("#dvReviewSummary").is(':visible')) {
        if (isExpand) {
            $(divQCorrectMaster).removeClass("dvQCorrectMasterCol");
            $(divQCorrectMaster).addClass("dvQCorrectMasterExp");
        }
        else {
            $(divQCorrectMaster).removeClass("dvQCorrectMasterExp");
            $(divQCorrectMaster).addClass("dvQCorrectMasterCol");
        }

        $("#dvQCorrectMaster").show();
    }
    else {
        $("#dvQCorrectMaster").hide();
    }
}

function closeNav() {

    document.getElementById("main").style.marginLeft = "-5%";
    document.body.style.backgroundColor = "whitesmoke";

    $("#ReviewSidenav").hide();
    $("#dvReviewSideNavCollapsed").show();
    ShowHideQCorrectMasterImage(false);
}

function StartReview_Click() {
    $(".loader").show();
    StartReview();
}

function StartReview() {
    //Introduce code to take action on the selected processes
    selectedProcesses = GetSelectedProcesses();
    if (selectedProcesses.length > 0) {
        $("#dvReviewSummary").hide();
        GetNextQCRequestForReview();
        $("#dvPDFViewer").show();
        $("#dvReview").show();
        $("#dvDocInfoReviewPanel").show();
        closeNav();
    }
    else {
        BootstrapDialog.show({
            title: 'Alert !',
            message: '<p class="text-danger">Please select atleast one process to start review.</p>',
            type: BootstrapDialog.TYPE_DANGER,
            buttons: [{
                label: 'Ok',
                cssClass: 'btn-danger',
                action: function (dialog) {
                    dialog.close();
                    $(".loader").hide();
                }
            }]
        });
    }
}

function GetSelectedProcesses() {
    var selectedProcesses = [];
    $('#ReviewSidenav input:checked').each(function () {
        selectedProcesses.push($(this).val());
    });

    return selectedProcesses;
}

function LoadPDFViewerPage(reviewRequest, canvasWidth, loadReview) {
    var inputData = { reviewRequest: reviewRequest };
    var defaultCanvasWidth = "900";
    _helper.post(locationPathName + "pdfview", inputData, function (data) {
        var filePath = baseURL + reviewRequest.PDFTempDirLocation + "//" + reviewRequest.FileName;

        $("#dvPDFViewer").html(data);

        if (canvasWidth !== undefined && canvasWidth !== null) {
            $("#pdf-canvas").attr("width", canvasWidth);
        }

        InitiatePDFView();
        BindPDFViewEvents();

        showPDF(reviewRequest);

        $("#dvReviewBody").css('padding-top', '0.4%');
        $(".reviewPartition").css('border-left-style', 'ridge');
        $(".reviewPartition").css('border-left-color', 'rgb(226, 222, 222)');

        if (loadReview !== false) {
            _helper.post(locationPathName + "review", inputData, function (data) {
                $("#dvReview").html(data);
                $("#dvDocInfoReviewPanel").show();
                $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
                $(".dateTimePicker").datepicker();
            });
        }
    }, null);
}

function GetNextQCRequestForReview() {
    //Introduce code later to fetch requestes for the selected processes only
    CurrentReviewStatus = [];
    var inputData = { selectedProcesses: selectedProcesses };
    _helper.post(locationPathName + "/review/request", inputData, function (data) {
        if (data != false) {
            selectFirstField = true;
            $("#dvNoRequestsAvailable").css('display', 'none');
            $("#dvReviewStopRequested").css('display', 'none');
            $(".reviewPartition").css('display', 'block');
            GenerateCurrentReviewStatus(data);
            LoadPDFViewerPage(data);
            $(".pProcessName").html(GetProcessName(data.ProcessKey));
        }
        else {
            ShowNoReviewsAvailableMsg();
            $(".loader").hide();
        }
    }, function () {
        var title = 'Error !';
        var message = '<p class = "text-danger">OOPS! Something went wrong while fetching review request! Please try again later or contact application support.</p>';

        ShowReviewErrorBox(title, message, null);
    });
}

function GenerateCurrentReviewStatus(reviewRequest) {
    UpdatePendingReviewCount();
    var fieldsCount = reviewRequest.FieldsToQC.length;
    if (fieldsCount > 0) {
        for (i = 0; i < fieldsCount; i++) {
            var statusItem = new Object();
            statusItem.FieldName = reviewRequest.FieldsToQC[i].Name;
            statusItem.IsModified = false;
            statusItem.IsDeleted = false;
            statusItem.Value = reviewRequest.FieldsToQC[i].Value;
            statusItem.LatestValue = "";
            CurrentReviewStatus.push(statusItem);
            duplicateFields = [];
        }
    }
}

function ShowReviewStopRequestedMsg() {
    $(".reviewPartition").css('display', 'none');
    $("#dvNoRequestsAvailable").css('display', 'none');
    $("#dvPDFViewer").html("");
    $("#dvReview").html("");
    $("#dvDocInfoReviewPanel").hide();
    $("#dvReviewStopRequested").css('display', 'block');
}

function ShowNoReviewsAvailableMsg() {
    $(".reviewPartition").css('display', 'none');
    $("#dvReviewStopRequested").css('display', 'none');
    $("#dvPDFViewer").html("");
    $("#dvReview").html("");
    $("#dvDocInfoReviewPanel").hide();
    $("#dvNoRequestsAvailable").css('display', 'block');
}

function spnGlyphSummary_Click() {
    $(".loader").show();
    _helper.get(locationPathName + "ReviewSummary", function (data) {
        var divReviewSummary = $("#dvReviewSummary");
        $("#dvPDFViewer").hide();
        $("#dvReview").hide();
        $("#dvDocInfoReviewPanel").hide();
        $(divReviewSummary).html(data);
        $(divReviewSummary).show();
        $(".loader").hide();
        closeNav();
        LoadReviewSummary();
    });

}

function GetProcessName(processKey) {
    var processName = "";
    var currentProcess = $(".clsProcesses").find("input[name = '" + processKey + "']:first");

    if (currentProcess !== null && currentProcess !== undefined) {
        processName = $(currentProcess).closest('.checkBoxcontainer').text();
    }
    currentProcessInReviewName = processName;
    return processName;
}

function ShowHideProcessInfoAboveRenderedPDF(show) {
    $("#dvDocInfoReviewPanelOnPopout .pProcessName").html(currentProcessInReviewName);
    if (show) {
        $("#dvDocInfoReviewPanelOnPopout").show();
        $("#dvPDFViewer").addClass("pdfViepageInfoOnPopout");
        $(".rwDocandProcInfo").addClass("rowPdfFullPage");
        $(".docInfo").removeClass("col-md-10").addClass("col-md-5");
    }
    else {
        $("#dvDocInfoReviewPanelOnPopout").hide();
        $("#dvPDFViewer").removeClass("pdfViepageInfoOnPopout");
        $(".rwDocandProcInfo").removeClass("rowPdfFullPage");
        $(".docInfo").removeClass("col-md-5").addClass("col-md-10");
    }
}