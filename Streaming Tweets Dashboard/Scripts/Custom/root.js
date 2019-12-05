var baseURL = window.location.toString();
var locationPathName = window.location.pathname;

$(window).on('unload', function () {
    if (currentReviewWindow !== null && currentReviewWindow !== undefined) {
        currentReviewWindow.close();
        currentReviewWindow = null;
    }
});

$(document).ready(function () {
    $(".loader").show();
    $.when(PerformInitialLoad()).then(LoadUserProcesses()).then(openNav()).then(HideLoaderAndInitializeTooTip());
    AssignKeyBoardShortCuts();
});

function AssignKeyBoardShortCuts() {
    shortcut.add("ALT+S", function (e) {
        if (currentReviewWindow == null) {
            SubmitReview_Click();
        }
    });

    shortcut.add("ALT+K", function (e) {
        if (currentReviewWindow == null) {
            SkipReview_Click();
        }
    });
}

function PerformInitialLoad() {
    var defObj = $.Deferred();
    PopulateUserDetails(defObj);
    return defObj.promise();
}

function LoadUserProcesses() {
    var defObj = $.Deferred();
    _helper.get(locationPathName + "home/user/processes", function (data) {
        $("#dvUserProcessesSideNavContainer").html(data);
        UpdatePendingReviewCount();
        defObj.resolve();
    }, null);
    return defObj.promise();
}

function PopulateUserDetails(defObj) {
    _helper.get(locationPathName + "Home/user", function (data) {
        var currentUser = data;
        var spUserName = $("#spnUserName");
        var spUserDivison = $("#spnUserDivison");
        $(spUserName).html(currentUser.LoginName);
        $(spUserDivison).html(currentUser.GroupTypeCD);

        if (defObj !== null && defObj !== undefined) {
            defObj.resolve();
        }
    }, null);
}

function HideLoaderAndInitializeTooTip() {
    setTimeout(function () {
        $(".loader").hide();
    }, 750);
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
}

function UpdatePendingReviewCount() {
    if (typeof (Worker) !== "undefined") {
        if (typeof (refreshProcessQueueCountWorker) === "undefined") {
            refreshProcessQueueCountWorker = new Worker(window.location.origin + locationPathName + 'Scripts/Custom/RefreshProcQueueCountWorker.js');

            refreshProcessQueueCountWorker.onmessage = function (e) {
                var userProcesses = JSON.parse(e.data);
                var procCount = userProcesses.length;

                if (procCount !== undefined && procCount !== null) {
                    for (i = 0; i < procCount; i++) {
                        var pendingRequestCount = userProcesses[i].PendingQCRequests;

                        var badgeExpProc = $("#spnExp_" + userProcesses[i].ScriptKey.replace(/\s/g, ''));
                        var badgeColProc = $("#spnCol_" + userProcesses[i].ScriptKey.replace(/\s/g, ''));

                        var currValExpProcCount = $.trim($(badgeExpProc).html());
                        var currValColProcCount = $.trim($(badgeColProc).html());

                        var newValProcCount = $.trim(pendingRequestCount);

                        if (currValExpProcCount !== newValProcCount) {
                            $(badgeExpProc).html(newValProcCount);
                            $(badgeExpProc).fadeTo('slow', 0.5).fadeTo('slow', 1.0);

                            $(badgeColProc).html(newValProcCount);
                            $(badgeColProc).fadeTo('slow', 0.5).fadeTo('slow', 1.0)
                        }
                    }
                }
            };
        }

        refreshProcessQueueCountWorker.postMessage({ 'hostOrigin': window.location.origin + locationPathName });
    }

    refreshCount = setTimeout(UpdatePendingReviewCount, 30000);
}

function StopPendingQueueCountRefresh() {
    clearTimeout(refreshCount);
}
