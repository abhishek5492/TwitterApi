var currentSelectedField = null;
var currentReviewWindow = null;
var isReviewPopWindowSubmit = false;
var doNothingOnReviewWindowClose = false;
var currentHighlightedFieldIndex = null;
var CurrentDuplicateFieldHTML = null;
var CurrentDuplicateFieldHTMLSingle = null;
var duplicateFields = [];

function HighLightSelectedFieldForReview(objField) {

    var isFromLi = $(objField).is('li');

    if (!isFromLi) {
        var fieldLi = $(objField).closest('li');
        if ($(fieldLi).data('hasduplicates') == "True") {
            if (!isAnyDuplicateFieldSelected(fieldLi)) {
                $(objField).closest('.dvDuplicateFieldRow').click();
                return false;
            }
            else {
                $(objField).closest('.dvDuplicateFieldRow').find('input[type = radio]').rcSwitcher().prop('checked', 'true').change();
            }
        }

        objField = fieldLi;
    }

    var fieldIndex = $(objField).data("fieldindex");

    if (currentHighlightedFieldIndex !== fieldIndex || selectFirstField == true) {
        if (currentSelectedField != null) {

            if ($(currentSelectedField).hasClass("expandField")) {

                if ($(currentSelectedField).data('hasduplicates')) {
                    if (!SwitchToSingleFieldViewForDuplicates(currentSelectedField, $(currentSelectedField).data('fieldindex'), $(currentSelectedField).find('.clsFieldInputContainer'))) {
                        return false;
                    }
                }
                $(currentSelectedField).removeClass("expandField");
            }

            $(currentSelectedField).removeClass("highLightField");
        }

        $(objField).addClass("highLightField");
        currentSelectedField = objField;

        if ($(objField).data('hasduplicates') == "True") {
            HighLightSelectedFieldInPDFView($(objField).data('selectedfieldindex'));
        }
        else {
            HighLightSelectedFieldInPDFView(fieldIndex);
        }

        currentHighlightedFieldIndex = fieldIndex;
    }
}

function HighLightSelectedFieldForReviewFromChild(fieldIndex) {
    var objField = $(".dvFieldsULContainer").find('li')[0];
    if (currentSelectedField != null) {
        $(currentSelectedField).removeClass("highLightField");
    }

    $(objField).addClass("highLightField");
    currentSelectedField = objField;

    HighLightSelectedFieldInPDFView(fieldIndex);
}

function HighLightSelectedFieldInPDFView(fieldIndex) {
    RemoveOverlayDivs();

    var pdfHighLightCoordinates = [];
    var pageNumber;

    if (currentReviewRequest != null) {
        objSelectedFieldJSON = currentReviewRequest.FieldsToQC[fieldIndex];

        if (objSelectedFieldJSON != null) {

            var lines = objSelectedFieldJSON.Lines;
            var linescount = $(lines).length;

            if (linescount > 0) {
                pageNumber = $(lines)[0].Page.PageNo + 1;

                for (i = 0; i < linescount; i++) {

                    var pdfWidth = "";
                    var pdfHeight = "";
                    var pdfLeft = "";
                    var pdfTop = "";
                    var pdfRight = "";
                    var pdfBottom = "";

                    HighLightCoordinates = {
                        pdfWidth: lines[i].Page.Width,
                        pdfHeight: lines[i].Page.Height,

                        pdfLeft: lines[i].Position.Left,
                        pdfTop: lines[i].Position.Top,
                        pdfRight: lines[i].Position.Right,
                        pdfBottom: lines[i].Position.Bottom
                    };

                    pdfHighLightCoordinates.push(HighLightCoordinates);
                }

                showPage(pageNumber, pdfHighLightCoordinates);
            }
        }
    }
}

//Functions for Handeling duplicateFields
function LoadDuplicateFields(dpSpanElem) {
    var fieldLi = $(dpSpanElem).closest('li');
    var fieldIndex = $(fieldLi).data("fieldindex");
    var inputFieldContainer = $(fieldLi).find('.clsFieldInputContainer');

    if ($(inputFieldContainer).find('textarea').length > 0 && $(fieldLi).find('span.glyphicon-resize-full:first').length !== 1)
    {
        return false;
    }

    $(fieldLi).addClass("highLightField");
    AddToDuplicateFieldsArray(fieldLi);

    if ($(inputFieldContainer).hasClass("clsFirstFieldSingle")) {
        CurrentDuplicateFieldHTMLSingle = $(inputFieldContainer)[0].innerHTML;
        SwitchToMultiFieldViewForDuplicates(fieldLi, fieldIndex, inputFieldContainer);
        $(inputFieldContainer).removeClass("clsFirstFieldSingle");
    }
    else {
        if (SwitchToSingleFieldViewForDuplicates(fieldLi, fieldIndex, inputFieldContainer)) {
            $(inputFieldContainer).addClass("clsFirstFieldSingle");
        }
    }
}

function SwitchToSingleFieldViewForDuplicates(fieldLi, fieldIndex, inputFieldContainer) {
    if ($(inputFieldContainer).hasClass("clsFirstFieldSingle")) {
        return false;
    }
    var divFieldRows = $(inputFieldContainer).find(".dvDuplicateFieldRow");
    var isAnyRadioButtonSelected = false;
    var selectedOptionValue;
    $.each(divFieldRows, function (index, obj) {
        if ($(obj).find(".stoggler").hasClass("on")) {
            isAnyRadioButtonSelected = true;
            selectedOptionValue = $(obj).find(".input-sm").val();
        }
    });

    if (isAnyRadioButtonSelected) {
        $(inputFieldContainer)[0].innerHTML = CurrentDuplicateFieldHTMLSingle;
        var inputTxtArea = $(inputFieldContainer).find(".input-sm:first");
        $(inputTxtArea).val(selectedOptionValue);
        $(fieldLi).removeClass("expandField");
        $(inputFieldContainer).addClass("clsFirstFieldSingle");

        if($(inputFieldContainer).closest('li').find('span.editedField').is(':visible'))
        {
            $(inputTxtArea).css('background-color', '#e6f3f7');
        }
    }
    else {
        ShowReviewErrorBox("!Error", "Please select atleast one value amongst duplicate fields.", null);
        return false;
    }

    return true;
}

function SwitchToMultiFieldViewForDuplicates(fieldLi, fieldIndex, inputFieldContainer) {

    $(fieldLi).addClass("expandField");
    $(fieldLi).scrollintoview({ direction: "both" });

    var inputData = { fieldsToQC: currentReviewRequest.FieldsToQC, fieldName: currentReviewRequest.FieldsToQC[fieldIndex].Name };
    _helper.post(locationPathName + "review/field/duplicates", inputData, function (data) {
        var inputField = $(fieldLi).find('.input-sm');

        CurrentDuplicateFieldHTML = $(data)[0].innerHTML;

        $(inputFieldContainer)[0].innerHTML = data;

        UpdateSelectionsInDuplicateFields(inputFieldContainer, currentReviewRequest.FieldsToQC[fieldIndex].Name);
        InitalizeRCSwitcher(fieldLi);
    });

    $(".dvDuplicateFieldRow").click(function () {
        var sourceElemClassName = event.target.className;
        var fieldIndex = $(this).data("fieldindex");
        var fieldIndexInSource = $(this).data("fieldindexinsource");
        var fieldLi = $(this).closest('li');
        var fieldName = $(fieldLi).find(".lblFieldName:first").text();
        var spnDuplicateWarning = $(fieldLi).find('.spnDuplicateWarn');

        if ((sourceElemClassName === "sblob" || sourceElemClassName === "slabel-off" || sourceElemClassName === "form-control input-sm") && !isAnyDuplicateFieldSelected(fieldLi)) {
            $(fieldLi).find(".dvDuplicateFieldContainer")[0].innerHTML = CurrentDuplicateFieldHTML;
            var radioElements = $(fieldLi).find(".dvDuplicateFieldContainer").find('input:radio');
            $(radioElements[fieldIndex]).prop('checked', true);

            $.each(radioElements, function (index, elem) {
                if ($(elem).is(':checked')) {
                    MarkUnmarkDuplicateFieldsForDelete($(elem).data('fieldindex'), false);
                }
                else {
                    MarkUnmarkDuplicateFieldsForDelete($(elem).data('fieldindex'), true);
                }
            });

            $(fieldLi).data('selectedfieldindex', fieldIndexInSource);
            HighLightSelectedFieldInPDFView(fieldIndexInSource);
            if (!$(spnDuplicateWarning).hasClass("glyphDuplicateGreen")) {
                $(spnDuplicateWarning).addClass("glyphDuplicateGreen").removeClass("glyphDuplicate");
            }

            InitalizeRCSwitcher(fieldLi);
        }

        UpdateDuplicateFieldsArray(fieldName, fieldIndexInSource);
    });
}

function UpdateSelectionsInDuplicateFields(inputFieldContainer, fieldName) {
    var objField = GetDupliCateFieldObject(fieldName);

    if (objField !== null && objField !== undefined) {
        var fieldIndex = objField.SelectedValueSourceIndex;
        var fieldLi = $(inputFieldContainer).closest('li');

        if (fieldIndex >= 0) {

            var spnDuplicateWarn = $(fieldLi).find('.spnDuplicateWarn');
            $(fieldLi).data("selectedfieldindex", objField.SelectedValueSourceIndex);

            if (!($(fieldLi).find(".clsFieldInputContainer:first").find(".dvDuplicateFieldRow").length > 1)) {
                var inputTxtArea = $(fieldLi).find(".input-sm:first");

                if (CurrentReviewStatus[objField.SelectedValueSourceIndex].IsModified == true) {
                    $(inputTxtArea).css('background-color', '#e6f3f7');
                    $(inputTxtArea).val(CurrentReviewStatus[objField.SelectedValueSourceIndex].LatestValue);
                }
                else {
                    $(inputTxtArea).val(CurrentReviewStatus[objField.SelectedValueSourceIndex].Value);
                }
            }
            else {
                var inputSM = $(inputFieldContainer).find("input[data-fieldIndex = '" + fieldIndex + "']:first");
                $(inputSM).prop('checked', true);

                $(fieldLi).find(".input-sm").each(function () {
                    var index = $(this).closest(".dvDuplicateFieldRow").data("fieldindexinsource");
                    if (index !== null && index !== undefined)
                    {
                        if (CurrentReviewStatus[index].IsModified == true) {
                            $(this).css('background-color', '#e6f3f7');
                            $(this).val(CurrentReviewStatus[index].LatestValue);
                        }
                        else {
                            $(this).val(CurrentReviewStatus[index].Value);
                        }
                    }
                });
            }

            if (CurrentReviewStatus[fieldIndex].IsModified == true) {
                $(fieldLi).find('.editedField').css('display', 'inline-block');
            }

            if (!$(spnDuplicateWarn).hasClass("glyphDuplicateGreen")) {

                $(spnDuplicateWarn).addClass("glyphDuplicateGreen").removeClass("glyphDuplicate");
            }
        }
    }
}

function isAnyDuplicateFieldSelected(fieldLi) {
    var divFieldRows = $(fieldLi).find(".dvDuplicateFieldRow");
    var isSelected = false;

    $.each(divFieldRows, function (index, obj) {
        if ($(obj).find(".stoggler").hasClass("on")) {
            isSelected = true;
        }
    });

    return isSelected;
}

function InitalizeRCSwitcher(fieldLi) {
    $(fieldLi).find('.dvDuplicateFieldContainer').find('input:radio').rcSwitcher({
        theme: 'flat',
        blobOffset: 1,
        onText: 'Yes',
        offText: 'No'
    }).on({
        'turnon.rcSwitcher': function (e, dataObj) {
            var objField = $(this).closest('li');
            var fieldName = $(this).attr("name");
            var InputSourceIndex = $(this).data("fieldindex");
            var spnDuplicateWarn = $(objField).find(".spnDuplicateWarn");

            UpdateDuplicateFieldsArray(fieldName, InputSourceIndex);
            $(objField).data('selectedfieldindex', InputSourceIndex);
            HighLightSelectedFieldInPDFView(InputSourceIndex);

            if (!$(spnDuplicateWarn).hasClass("glyphDuplicateGreen")) {

                $(spnDuplicateWarn).addClass("glyphDuplicateGreen").removeClass("glyphDuplicate");
            }
        },
        'turnoff.rcSwitcher': function (e, dataObj) {
            MarkUnmarkDuplicateFieldsForDelete($(this).data("fieldindex"), true);
        }
    });
}

function AddToDuplicateFieldsArray(fieldLi) {
    var isFieldExist = false;
    $.each(duplicateFields, function (index, obj) {
        if (obj.FieldName === $(fieldLi).find(".lblFieldName:first").text()) {
            isFieldExist = true;
        }
    });

    if (!isFieldExist) {
        var inputFieldContainer = $(fieldLi).find('.clsFieldInputContainer');
        var objfield = new Object();

        objfield.FieldName = $(fieldLi).find(".lblFieldName:first").text();
        objfield.LiIndex = $(fieldLi).data("fieldindex");
        objfield.IsExpanded = $(inputFieldContainer).hasClass("clsFirstFieldSingle") ? false : true;
        objfield.SelectedValueSourceIndex = -1;

        duplicateFields.push(objfield);
    }
}

function AddToDuplicateFieldsArrayFromChild(liIndex) {
    var isFieldExist = false;
    var fieldObj = currentReviewRequest.FieldsToQC[liIndex];
    var fieldLi = null;
    $.each(duplicateFields, function (index, obj) {
        if (obj.FieldName === fieldObj.Name) {
            isFieldExist = true;
        }
    });

    $.each($(".dvFieldsULContainer").find('li'), function (index, elem) {
        if ($(elem).find(".lblFieldName:first").text() === fieldObj.Name) {
            fieldLi = elem;
        }
    });

    if (!isFieldExist && fieldLi != null) {
        var inputFieldContainer = $(fieldLi).find('.clsFieldInputContainer');
        var objfield = new Object();

        objfield.FieldName = $(fieldLi).find(".lblFieldName:first").text();
        objfield.LiIndex = $(fieldLi).data("fieldindex");
        objfield.IsExpanded = $(inputFieldContainer).hasClass("clsFirstFieldSingle") ? false : true;
        objfield.SelectedValueSourceIndex = -1;

        duplicateFields.push(objfield);
    }
}

function UpdateDuplicateFieldsArray(fieldName, fieldIndexInSource) {
    var isFieldExist = false;
    var objField = GetDupliCateFieldObject(fieldName);

    objField.SelectedValueSourceIndex = fieldIndexInSource;
}

function MarkUnmarkDuplicateFieldsForDelete(fieldIndex, isDelete) {
    if (isDelete) {
        currentReviewRequest.FieldsToQC[fieldIndex].IsDelete = true;
    }
    else {
        currentReviewRequest.FieldsToQC[fieldIndex].IsDelete = false;
    }
}

function GetDupliCateFieldObject(fieldName) {
    var fieldObject = null;
    $.each(duplicateFields, function (index, obj) {
        if (obj.FieldName === fieldName) {
            fieldObject = obj;
        }
    });

    return fieldObject;
}
//End of Functions for Handeling duplicateFields

function RemoveOverlayDivs() {
    $(".overlayHighlightDiv").remove();
}

function GoToPageandHighlight(pageNumber, pdfHighLightCoordinates) {

    if (__CURRENT_PAGE == pageNumber) {
        CreateHighlightDivsandSetPosition(pdfHighLightCoordinates);
    }
    else {
        showPage(pageNumber, pdfHighLightCoordinates);
    }
}

function SubmitReview_Click() {
    UpdateReviewResults();
}

function SkipReview_Click() {
    SkipReview();
}

function UpdateReviewResults() {
    var reviewedFields = $("#dvReview").find('li');
    var isModified = false;
    var reviewResult = new Object();

    if (reviewedFields.length > 0) {
        if (ValidateAtleastOneOptionInDuplicateIsSelected()) {
            $.each(reviewedFields, function () {
                var fieldIndex = $(this).data("fieldindex");
                var inputField = $(this).find(".input-sm")[0];
                reviewResult = currentReviewRequest;
                reviewResult.FieldsAfterQC = currentReviewRequest.FieldsToQC;
                var currentValue = $(inputField).hasClass("dateTimePicker") ? formatDate(currentReviewRequest.FieldsToQC[fieldIndex].Value) : $.trim(currentReviewRequest.FieldsToQC[fieldIndex].Value);
                var updatedValue = $(inputField).hasClass("dateTimePicker") ? formatDate($(inputField).val()) : $.trim($(inputField).val());

                if (currentValue !== updatedValue || reviewResult.FieldsAfterQC[fieldIndex].IsDelete == true) {
                    if (!isModified) {
                        isModified = true;
                    }
                    reviewResult.FieldsAfterQC[fieldIndex].Value = updatedValue;
                }

            });

            if (isModified) {
                var submitAction = function () {
                    $(".loader").show();
                    PostResultsToServerForUpdate(reviewResult);
                    setTimeout(function () {
                        $(".loader").hide();
                    }, 1000);
                };

                var title = 'Are you sure !';
                var message = '<p class = "text-danger">Do you want to submit the review? Once submitted document will not be available for review again!</p>';

                ShowReviewAlertBox(title, message, submitAction, null, true, true);

            }
            else {
                var submitAction = function () {
                    $(".loader").show();
                    PostResultsToServerForUpdate(reviewResult);
                    setTimeout(function () {
                        $(".loader").hide();
                    }, 1000);
                };

                var title = 'Are you sure !';
                var message = '<p class = "text-danger">No Changes were made.Do you still want to submit the review? Once submitted, the document will not be available for review again!</p>';

                ShowReviewAlertBox(title, message, submitAction, null, true, true);
            }
        }
        else {
            ShowReviewErrorBox("!Error", "Please select atleast one value amongst duplicate fields.", null);
        }

    }
}

function ValidateAtleastOneOptionInDuplicateIsSelected() {
    var check = true;
    var rowsWithDuplicates = $(".dvFieldsULContainer").find('li[data-hasDuplicates = "True"]');
    if (rowsWithDuplicates.length > 0) {
        $(rowsWithDuplicates).each(function () {
            if (!$(this).find('.spnDuplicateWarn').hasClass("glyphDuplicateGreen")) {
                check = false;
            }
        });
    }
    else {
        check = true;
    }

    if (check && $(currentSelectedField).data('hasduplicates') === "True" && !$(currentSelectedField).find('clsFieldInputContainer').hasClass("clsFirstFieldSingle")) {
        SwitchToSingleFieldViewForDuplicates(currentSelectedField, $(currentSelectedField).data('fieldindex'), $(currentSelectedField).find('.clsFieldInputContainer'));
    }

    return check;
}

function SkipReview() {
    var submitAction = function () {
        $(".loader").show();
        PostResultsToServerForSkip(currentReviewRequest);
        setTimeout(function () {
            $(".loader").hide();
        }, 1000);
    };

    var title = 'Are you sure !';
    var message = '<p class = "text-danger">Do you want to skip this review? Once skipped document will not be available for review again!</p>';

    ShowSkipAlertBox(title, message, submitAction, null, true, true);
}

function ShowReviewAlertBox(title, message, submitAction, cancelAction, closeDialogAfterSubmit, closeDialogAfterCancel) {
    BootstrapDialog.show({
        type: BootstrapDialog.TYPE_PRIMARY,
        title: title,
        message: message,
        buttons: [{
            label: '(Y)es',
            cssClass: 'btn-primary',
            hotkey: 89,
            action: function (dialog) {
                if (closeDialogAfterSubmit == true) {
                    dialog.close();
                }

                if (submitAction != null && submitAction != undefined && typeof submitAction == 'function') {
                    submitAction();
                }
            }
        }, {
            label: '(N)o',
            cssClass: 'btn-primary',
            hotkey: 78,
            action: function (dialog) {
                if (cancelAction != null && cancelAction != undefined && typeof cancelAction == 'function') {
                    cancelAction();
                }
                if (closeDialogAfterCancel == true) {
                    dialog.close();
                }
            }
        }]
    });
}

function ShowSkipAlertBox(title, message, submitAction, cancelAction, closeDialogAfterSubmit, closeDialogAfterCancel) {
    BootstrapDialog.show({
        type: BootstrapDialog.TYPE_PRIMARY,
        title: title,
        message: message,
        buttons: [{
            label: '(Y)es',
            hotkey: 89,
            cssClass: 'btn-primary',
            action: function (dialog) {
                if (closeDialogAfterSubmit == true) {
                    dialog.close();
                }

                if (submitAction != null && submitAction != undefined && typeof submitAction == 'function') {
                    submitAction();
                }
            }
        }, {
            label: '(N)o',
            cssClass: 'btn-primary',
            hotkey: 78,
            action: function (dialog) {
                if (cancelAction != null && cancelAction != undefined && typeof cancelAction == 'function') {
                    cancelAction();
                }
                if (closeDialogAfterCancel == true) {
                    dialog.close();
                }
            }
        }]
    });
}

function ShowReviewErrorBox(title, message, action) {
    BootstrapDialog.show({
        type: BootstrapDialog.TYPE_DANGER,
        title: title,
        message: message,
        buttons: [{
            label: '(O)k',
            hotkey: 79,
            cssClass: 'btn-danger',
            action: function (dialog) {
                if (action != null && action != undefined && typeof action == 'function') {
                    action();
                }
                dialog.close();
            }
        }]
    });
}

function PostResultsToServerForUpdate(reviewResult) {
    var inputData = { updatedReviewRequest: reviewResult };
    _helper.put(locationPathName + "review/submit", inputData, function (data) {
        if (!data || data == false) {
            var title = 'Error !';
            var message = '<p class = "text-danger">OOPS ! Something went wrong while updating review! Please try again later or contact application support.</p>';

            ShowReviewErrorBox(title, message, null);
        }
        
        GetNextRequestBasedonUserPreference();
        
    }, function () {
        var title = 'Error !';
        var message = '<p class = "text-danger">OOPS! Something went wrong while updating review! Please try again later or contact application support.</p>';

        ShowReviewErrorBox(title, message, null);
    });
}

function PostResultsToServerForSkip(reviewResult) {
    var inputData = { reviewRequest: reviewResult };
    _helper.put(locationPathName + "review/skip", inputData, function (data) {
        if (!data || data == false) {
            var title = 'Error !';
            var message = '<p class = "text-danger">OOPS ! Something went wrong while skipping the review! Please try again later or contact application support.</p>';

            ShowReviewErrorBox(title, message, null);
        }
        
        GetNextRequestBasedonUserPreference();

    }, function () {
        var title = 'Error !';
        var message = '<p class = "text-danger">OOPS! Something went wrong while skipping the review! Please try again later or contact application support.</p>';

        ShowReviewErrorBox(title, message, null);
    });
}

function GetNextRequestBasedonUserPreference() {
    if ($("#chkGetNextReviewRequest").is(':checked')) {
        GetNextQCRequestForReview();
    }
    else {
        ShowReviewStopRequestedMsg();
        openNav();
    }
}

function GetNextRequestWithReviewPopup(loadNextRequest) {
    if (loadNextRequest) {
        CurrentReviewStatus = [];
        var inputData = { selectedProcesses: selectedProcesses };
        _helper.post(locationPathName + "review/request", inputData, function (data) {
            if (data != false) {
                currentReviewRequest = data;
                GenerateCurrentReviewStatus(data);
                selectFirstField = true;
                var inputData = { reviewRequest: currentReviewRequest };
                $.when(ReloadPDFViewerToOccupyFullPage()).done(function () {
                    $("#pdf-contents").removeClass("dvPDFContents");
                    ShowHideProcessInfoAboveRenderedPDF(true);
                    _helper.post(locationPathName + "review/PopOut", inputData, function (data) {
                        if (currentReviewWindow !== null && currentReviewWindow !== undefined) {
                            currentReviewWindow.document.documentElement.innerHTML = "";
                            currentReviewWindow.document.documentElement.innerHTML = data;

                            setTimeout(function () {
                                currentReviewWindow.Initalize();
                                currentReviewWindow.SetCurrentReviewStatusFromParent(CurrentReviewStatus, true, JSON.stringify(currentReviewRequest), JSON.stringify(duplicateFields));
                                isReviewPopWindowSubmit = false;
                                $(".loader").hide();
                            }, 1000);
                        }
                    });
                });
            }
            else {
                doNothingOnReviewWindowClose = true;
                CloseReviewPopup();
                ShowNoReviewsAvailableMsg();
            }
        }, function () {
            var title = 'Error !';
            var message = '<p class = "text-danger">OOPS! Something went wrong while fetching review request! Please try again later or contact application support.</p>';

            ShowReviewErrorBox(title, message, null);
        });

        $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
    }
    else {
        doNothingOnReviewWindowClose = true;
        CloseReviewPopup();
        ShowReviewStopRequestedMsg();
        openNav();
    }
}

function GetLinesFromFieldValue() {
    var lines = [];
}

function MarkUnmarkForDelete(delElem) {
    var fieldLi = $(delElem).closest('li');
    var index = $(fieldLi).data("fieldindex");

    if ($(fieldLi).hasClass("markedForDelete")) {
        $(fieldLi).removeClass("markedForDelete");
        CurrentReviewStatus[index].IsDeleted = false;
    }
    else {
        $(fieldLi).addClass("markedForDelete");
        CurrentReviewStatus[index].IsDeleted = true;
    }
}

function On_FieldValueChanged(fieldElement) {
    var fieldLi = $(fieldElement).closest('li');

    $(fieldLi).find('.editedField').css('display', 'inline-block');

    if ($(fieldLi).data("hasduplicates") == "True") {
        var index = $(fieldElement).closest(".dvDuplicateFieldRow").data("fieldindexinsource");
        if ($(fieldLi).find(".dvDuplicateFieldRow").length > 0)
        {
            index = $(fieldElement).closest(".dvDuplicateFieldRow").data("fieldindexinsource");
        }
        else
        {
            index = $(fieldLi).data("selectedfieldindex");
        }

        CurrentReviewStatus[index].LatestValue = $(fieldElement).val();
        CurrentReviewStatus[index].IsModified = true;
        $(fieldElement).css('background-color', '#e6f3f7');
    }
    else {
        var index = $(fieldLi).data("fieldindex");

        CurrentReviewStatus[index].LatestValue = $(fieldElement).val();
        CurrentReviewStatus[index].IsModified = true;
        $(fieldLi).find(".input-sm").css('background-color', '#e6f3f7');
    }
}

function PopOutReview(element) {
    $(element).tooltip('hide');
    $(".loader").show();
    isReviewPopWindowSubmit = false;
    var inputData = { reviewRequest: currentReviewRequest };
    var isLoadNextReview = $('#chkGetNextReviewRequest').prop("checked");
    $.when(ReloadPDFViewerToOccupyFullPage()).done(function () {
        ShowHideProcessInfoAboveRenderedPDF(true);
        $("#pdf-contents").removeClass("dvPDFContents");
        _helper.post(locationPathName + "review/PopOut", inputData, function (data) {
            $.when(OpenReviewFieldsPopUP(data)).done(function () {
                selectFirstField = true;
                $(".loader").hide();
                currentReviewWindow.Initalize();
                currentReviewWindow.SetCurrentReviewStatusFromParent(CurrentReviewStatus, isLoadNextReview, JSON.stringify(currentReviewRequest), JSON.stringify(duplicateFields));
            });
        });
    });
}

function OpenReviewFieldsPopUP(data) {
    var dfd = $.Deferred();
    var strWindowFeatures = "width=900,height=600,menubar=no,toolbar=no,personalbar=no,directories=no,status=no,location=no,resizable=yes,scrollbars=yes,status=no,titlebar=yes,alwaysRaised=yes,close=no";
    currentReviewWindow = window.open("", "Extracted Fields", strWindowFeatures);

    currentReviewWindow.document.write(data);

    currentReviewWindow.onbeforeunload = function () {
        onChildWindowClose();
    };

    ExecuteOnChildWindowLoadComplete(function () { dfd.resolve(); });

    return dfd.promise();
}

function ReloadPDFViewerToOccupyFullPage() {
    var dfd = $.Deferred();
    $(".reviewPartition").css('display', 'none');
    $(".pdfViewerPadding").removeClass("col-md-7");
    $(".pdfViewerPadding").addClass("col-md-12");
    $(".pdfViewerPadding").css('margin-left', '11%');
    $("#mainBody").css('overflow', 'visible');


    LoadPDFViewerPage(currentReviewRequest, "1200");

    dfd.resolve();
    return dfd.promise();
}

function onChildWindowClose() {
    currentReviewWindow = null;
    if (doNothingOnReviewWindowClose !== true) {
        RestoreParentPageToOriginal();
    }

    doNothingOnReviewWindowClose = false;
}

function RestoreParentPageToOriginal() {
    if ($(".reviewPartition").css("display") == "none") {
        $(".reviewPartition").css('display', '');
        $(".pdfViewerPadding").removeClass("col-md-12");
        $(".pdfViewerPadding").addClass("col-md-7");
        $(".pdfViewerPadding").css('margin-left', '');
        $(".rwDocandProcInfo").removeClass("rowPdfFullPage");
        $("#mainBody").css('overflow', 'hidden');

        selectFirstField = true;
        LoadPDFViewerPage(currentReviewRequest, "900", false);

        $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
    }

    if (isReviewPopWindowSubmit == false) {
        SyncLatestReviewStatus();
    }
    AssignKeyBoardShortCuts();
    $("#dvDocInfoReviewPanelOnPopout").hide();
    $("#dvPDFViewer").removeClass("pdfViepageInfoOnPopout");
}

function SetReviewPopUpWindowSubmitFlag() {
    isReviewPopWindowSubmit = true;
}

function SyncFieldModificationsWithChild(index, modifiedValue, isMarkedForDelete, loadNextRequest) {
    if (index !== undefined && index !== null) {
        var fieldLi = $("#dvReview").find('li')[index];

        if (modifiedValue !== undefined && modifiedValue !== null) {
            $(fieldLi).find(".input-sm").val(modifiedValue);
            CurrentReviewStatus[index].IsModified = true;
            CurrentReviewStatus[index].LatestValue = modifiedValue;
        }
    }

    if (loadNextRequest !== null && loadNextRequest !== undefined) {
        if (loadNextRequest == true) {
            $('#chkGetNextReviewRequest').prop('checked', true);
        }
        else {
            $('#chkGetNextReviewRequest').prop('checked', false);
        }
    }
}

function SyncDuplicateFieldChangesWithChild(fieldName, fieldIndexInSource) {
    var fieldLis = $(".dvFieldsULContainer").find('li');
    var fieldObj = currentReviewRequest.FieldsToQC[fieldIndexInSource];
    var fieldLi = null;

    $.each($(".dvFieldsULContainer").find('li'), function (index, elem) {
        if ($(elem).find(".lblFieldName:first").text() === fieldObj.Name) {
            fieldLi = elem;
        }
    });

    UpdateDuplicateFieldsArray(fieldName, fieldIndexInSource);

    $(fieldLi).data('selectedfieldindex', fieldIndexInSource);
}

function SyncLatestReviewStatus() {

    var colFieldList = $("#dvReview").find('li');
    var fieldCount = CurrentReviewStatus.length;

    if (fieldCount > 0) {
        for (i = 0; i < fieldCount; i++) {
            var fieldLi = colFieldList[i];

            if (CurrentReviewStatus[i].IsModified && $(fieldLi).data("hasduplicates") !== "True") {
                $(fieldLi).find(".input-sm").val(CurrentReviewStatus[i].LatestValue);
                $(fieldLi).find('.editedField').css('display', 'inline-block');
                $(fieldLi).find(".input-sm").css('background-color', '#e6f3f7');
            }

            UpdateSelectionsInDuplicateFields($(fieldLi).find('.clsFieldInputContainer'), $(fieldLi).find(".lblFieldName:first").text());
        }
    }
}

function CloseReviewPopup() {
    if (currentReviewWindow !== null && currentReviewWindow !== undefined) {
        currentReviewWindow.close();
    }
}

function ResizeField(field) {
    var fieldLi = $(field).closest('li');

    if (!$($(fieldLi).find('.clsFieldInputContainer')[0]).hasClass("clsFirstFieldSingle")) {
        return false;
    }

    var fieldTextArea = $(fieldLi).find('textarea');
    var expandCollapseSpanGlyph = $(fieldLi).find('.spnExpandCollapseglyph');

    if ($(expandCollapseSpanGlyph).hasClass("glyphicon-resize-full")) {
        $(fieldTextArea).addClass("expandField");
        $(expandCollapseSpanGlyph).addClass("glyphicon-resize-small");
        $(expandCollapseSpanGlyph).removeClass("glyphicon-resize-full");

    }
    else {
        $(fieldTextArea).removeClass("expandField");
        $(expandCollapseSpanGlyph).removeClass("glyphicon-resize-small");
        $(expandCollapseSpanGlyph).addClass("glyphicon-resize-full");
    }

    $(fieldLi).scrollintoview({ direction: "both" });
}

function SelectFirstReviewField() {
    if (selectFirstField) {
        ExecuteAfterRequestLoad(function () {
            var firstFieldLi = $(".dvFieldsULContainer li:first-child");

            if ($(firstFieldLi).data("hasduplicates") == "True") {
                var duplicateFieldObj = GetDupliCateFieldObject($(firstFieldLi).find(".lblFieldName:first").text());
                if (duplicateFieldObj != null && duplicateFieldObj.SelectedValueSourceIndex !== -1) {
                    $(firstFieldLi).data("selectedfieldindex", duplicateFieldObj.SelectedValueSourceIndex);
                }
            }

            HighLightSelectedFieldForReview(firstFieldLi);
            selectFirstField = false;
        });
    }
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
}

function ExecuteAfterRequestLoad(callback) {
    var checker = window.setInterval(function () {
        if (currentReviewRequest !== null && currentReviewRequest !== undefined) {
            clearInterval(checker);
            callback();
        }
    }, 50);
}

function ExecuteOnChildWindowLoadComplete(callback) {
    var checker = window.setInterval(function () {
        if (currentReviewWindow.Initalize !== null && currentReviewWindow.Initalize !== undefined && $(currentReviewWindow.document).contents().find("#btnSubmitReview").length > 0) {
            clearInterval(checker);
            callback();
        }
    }, 50);
}