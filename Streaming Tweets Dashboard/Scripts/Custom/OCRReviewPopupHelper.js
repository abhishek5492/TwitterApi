var currentReviewRequestPopup = null;
var CurrentReviewStatusPopup = null;
var currentSelectedField = null;
var currentHighlightedFieldIndex = null;
var CurrentDuplicateFieldHTML = null;
var CurrentDuplicateFieldHTMLSingle = null;
var duplicateFields = [];

function Initalize() {
    ApplyToolTips();
    SelectFirstReviewField();
    $(".dateTimePicker").datepicker();
    AssignKeyBoardShortCuts();
}

function ApplyToolTips() {
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' });
}

function On_FieldValueChanged(fieldElement) {
    var fieldLi = $(fieldElement).closest('li');
    var value = $(fieldElement).val();

    $(fieldLi).find('.editedField').css('display', 'inline-block');


    if ($(fieldLi).data("hasduplicates") == "True") {
        var index = $(fieldElement).closest(".dvDuplicateFieldRow").data("fieldindexinsource");

        CurrentReviewStatusPopup[index].LatestValue = $(fieldElement).val();
        CurrentReviewStatusPopup[index].IsModified = true;
        $(fieldElement).css('background-color', '#e6f3f7');
        window.opener.SyncFieldModificationsWithChild(index, value, false, null);
    }
    else {
        var index = $(fieldLi).data("fieldindex");

        CurrentReviewStatusPopup[index].LatestValue = $(fieldElement).val();
        CurrentReviewStatusPopup[index].IsModified = true;
        $(fieldLi).find(".input-sm").css('background-color', '#e6f3f7');
        window.opener.SyncFieldModificationsWithChild(index, value, false, null);
    }

    
}

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

    if (currentHighlightedFieldIndex !== fieldIndex) {
        if (currentSelectedField != null) {
            if ($(currentSelectedField).hasClass("expandFieldPopup")) {

                if ($(currentSelectedField).data('hasduplicates')) {
                    if (!SwitchToSingleFieldViewForDuplicates(currentSelectedField, $(currentSelectedField).data('fieldindex'), $(currentSelectedField).find('.clsFieldInputContainer'))) {
                        return false;
                    }
                }
                $(currentSelectedField).removeClass("expandFieldPopup");
            }
            $(objField).addClass("highLightField");
            $(currentSelectedField).removeClass("highLightField");
        }

        currentSelectedField = objField;

        if ($(objField).data('hasduplicates') == "True") {
            window.opener.HighLightSelectedFieldForReviewFromChild($(objField).data('selectedfieldindex'));
        }
        else {
            window.opener.HighLightSelectedFieldForReviewFromChild(fieldIndex);
        }

        currentHighlightedFieldIndex = fieldIndex;
    }
}

function SetCurrentReviewStatusFromParent(reviewStatus, loadNextRequest, currentReviewRequest, duplicateFieldsParent) {
    currentReviewRequestPopup = JSON.parse(currentReviewRequest);
    duplicateFields = JSON.parse(duplicateFieldsParent);
    CurrentReviewStatusPopup = reviewStatus;
    
    var colFieldList = $("#listReviewFields").find('li');
    var fieldCount = reviewStatus.length;

    if (fieldCount > 0) {
        for (i = 0; i < fieldCount; i++) {
            var fieldLi = colFieldList[i];

            if (reviewStatus[i].IsModified && $(fieldLi).data("hasduplicates") !== "True") {
                $(fieldLi).find(".input-sm").val(reviewStatus[i].LatestValue);
                $(fieldLi).find('.editedField').css('display', 'inline-block');
                $(fieldLi).find(".input-sm").css('background-color', '#e6f3f7');
            }

            UpdateSelectionsInDuplicateFields($(fieldLi).find('.clsFieldInputContainer'), $(fieldLi).find(".lblFieldNameReviewPopup:first").text());
        }
    }

    if (loadNextRequest) {
        $('#chkGetNextReviewRequest').prop('checked', true);
    }
    else {
        $('#chkGetNextReviewRequest').prop('checked', false);
    }

    $(".loader").hide();
}

function chkGetNextReviewRequest_change(chkbox) {
    if ($('#chkGetNextReviewRequest').prop("checked")) {
        window.opener.SyncFieldModificationsWithChild(null, null, null, true);
    }
    else {
        window.opener.SyncFieldModificationsWithChild(null, null, null, false);
    }
}

function SubmitReview_Click() {
    UpdateReviewResults();
}

function SkipReview_Click() {
    SkipReview();
}

function UpdateReviewResults() {

    var reviewedFields = $("#dvReviewPopupContainer").find('li');
    var isModified = false;
    var reviewResult = new Object();

    if (reviewedFields.length > 0) {

        if (ValidateAtleastOneOptionInDuplicateIsSelected()) {
            $.each(reviewedFields, function () {
                var fieldIndex = $(this).data("fieldindex");
                var inputField = $(this).find(".input-sm")[0];
                reviewResult = currentReviewRequestPopup;
                reviewResult.FieldsAfterQC = currentReviewRequestPopup.FieldsToQC;
                var currentValue = $(inputField).hasClass("dateTimePicker") ? formatDate(currentReviewRequestPopup.FieldsToQC[fieldIndex].Value) : $.trim(currentReviewRequestPopup.FieldsToQC[fieldIndex].Value);
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
                    window.opener.SetReviewPopUpWindowSubmitFlag();
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
                    window.opener.SetReviewPopUpWindowSubmitFlag();
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
    var rowsWithDuplicates = $("#dvReviewPopupContainer").find('li[data-hasDuplicates = "True"]');
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
        PostResultsToServerForSkip(currentReviewRequestPopup);
        setTimeout(function () {
            $(".loader").hide();
        }, 1000);
    };

    var title = 'Are you sure !';
    var message = '<p class = "text-danger">Do you want to skip this review? Once skipped document will not be available for review again!</p>';

    ShowSkipAlertBox(title, message, submitAction, null, true, true);
}

function PostResultsToServerForUpdate(reviewResult) {
    var inputData = { updatedReviewRequest: reviewResult };
    httpPut(window.opener.locationPathName + "review/submit", inputData, function (data) {
        if (!data || data == false) {
            var title = 'Error !';
            var message = '<p class = "text-danger">OOPS ! Something went wrong while updating review! Please try again later or contact application support.</p>';

            ShowReviewErrorBox(title, message, null);
        }
        window.opener.GetNextRequestWithReviewPopup($("#chkGetNextReviewRequest").is(':checked'));
    }, function () {
        var title = 'Error !';
        var message = '<p class = "text-danger">OOPS! Something went wrong while updating review! Please try again later or contact application support.</p>';

        ShowReviewErrorBox(title, message, null);
    });
}

function PostResultsToServerForSkip(reviewResult) {
    var inputData = { reviewRequest: reviewResult };
    httpPut(window.opener.locationPathName + "review/skip", inputData, function (data) {
        if (!data || data == false) {
            var title = 'Error !';
            var message = '<p class = "text-danger">OOPS ! Something went wrong while skipping review! Please try again later or contact application support.</p>';

            ShowReviewErrorBox(title, message, null);
        }
        window.opener.GetNextRequestWithReviewPopup($("#chkGetNextReviewRequest").is(':checked'));
    }, function () {
        var title = 'Error !';
        var message = '<p class = "text-danger">OOPS! Something went wrong while skipping review! Please try again later or contact application support.</p>';

        ShowReviewErrorBox(title, message, null);
    });
}

function ShowReviewAlertBox(title, message, submitAction, cancelAction, closeDialogAfterSubmit, closeDialogAfterCancel) {
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
            hotkey: 78,
            cssClass: 'btn-primary',
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
            hotkey: 78,
            cssClass: 'btn-primary',
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

function httpPut(action, inputData, success, failure, context) {
    $.ajax({
        method: "PUT",
        url: action,
        async: false,
        data: JSON.stringify(inputData),
        contentType: "application/json",
        success: function (data) {
            success(data, inputData, context);
        },
        error: function (data, error) {
            console.log(error);
            failure(error);
        },
        complete: function () {

        }
    });
}

function httpPost(action, inputData, success, failure, context) {
    $.ajax({
        method: "POST",
        url: action,
        data: JSON.stringify(inputData),
        async: false,
        contentType: "application/json",
        success: function (data) {
            success(data, context);
        },
        error: function (data, error) {
            console.log(error);
            if (failure !== null && failure !== undefined && typeof failure === "function") {
                failure();
            }
        },
        complete: function () {

        }
    });
}

function ResizeField(field) {
    var fieldLi = $(field).closest('li');
    var fieldTextArea = $(fieldLi).find('textarea');
    var expandCollapseSpanGlyph = $(fieldLi).find('.spnExpandCollapseglyph');

    if ($(expandCollapseSpanGlyph).hasClass("glyphicon-resize-full")) {
        $(fieldTextArea).addClass("expandFieldPopup");
        $(expandCollapseSpanGlyph).addClass("glyphicon-resize-small");
        $(expandCollapseSpanGlyph).removeClass("glyphicon-resize-full");
    }
    else {
        $(fieldTextArea).removeClass("expandFieldPopup");
        $(expandCollapseSpanGlyph).removeClass("glyphicon-resize-small");
        $(expandCollapseSpanGlyph).addClass("glyphicon-resize-full");
    }

    $('html, body').animate({
        scrollTop: ($(fieldLi).offset().top - 15)
    }, 100);
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

function SelectFirstReviewField() {
    var objField = $("#listReviewFields li:first-child");

    if (!$(objField).is('li')) {
        objField = $(objField).closest('li');
    }

    if (!$(objField).hasClass("highLightField")) {
        if (currentSelectedField != null) {
            $(currentSelectedField).removeClass("highLightField");
        }

        $(objField).addClass("highLightField");
        currentSelectedField = objField;
        currentHighlightedFieldIndex = 0;
    }
}

function AssignKeyBoardShortCuts() {
    shortcut.add("ALT+S", function (e) {
        SubmitReview_Click();
    }, {
        'target': window
    });

    shortcut.add("ALT+K", function (e) {
        SkipReview_Click();
    });
}

//Functions for Handeling duplicateFields
function LoadDuplicateFields(dpSpanElem) {
    var fieldLi = $(dpSpanElem).closest('li');
    var fieldIndex = $(fieldLi).data("fieldindex");
    var inputFieldContainer = $(fieldLi).find('.clsFieldInputContainer');

    if ($(inputFieldContainer).find('textarea').length > 0 && $(fieldLi).find('span.glyphicon-resize-full:first').length !== 1) {
        return false;
    }

    $(fieldLi).addClass("highLightField");
    AddToDuplicateFieldsArray(fieldLi);
    window.opener.AddToDuplicateFieldsArrayFromChild(fieldIndex);

    if ($(inputFieldContainer).hasClass("clsFirstFieldSingle")) {
        $(fieldLi).addClass("expandFieldPopup");
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
        $(fieldLi).removeClass("expandFieldPopup");
        $(inputFieldContainer).addClass("clsFirstFieldSingle");

        if ($(inputFieldContainer).closest('li').find('span.editedField').is(':visible')) {
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

    $('html, body').animate({
        scrollTop: ($(fieldLi).offset().top - 15)
    }, 100);

    var inputData = { fieldsToQC: currentReviewRequestPopup.FieldsToQC, fieldName: currentReviewRequestPopup.FieldsToQC[fieldIndex].Name };
    httpPost(window.opener.locationPathName + "/review/popout/field/duplicates", inputData, function (data) {
        var inputField = $(fieldLi).find('.input-sm');

        CurrentDuplicateFieldHTML = $(data)[0].innerHTML;

        $(inputFieldContainer)[0].innerHTML = data;

        UpdateSelectionsInDuplicateFields(inputFieldContainer, currentReviewRequestPopup.FieldsToQC[fieldIndex].Name);
        InitalizeRCSwitcher(fieldLi);
    });

    $(".dvDuplicateFieldRow").click(function () {
        var sourceElemClassName = event.target.className;
        var fieldIndex = $(this).data("fieldindex");
        var fieldIndexInSource = $(this).data("fieldindexinsource");
        var fieldLi = $(this).closest('li');
        var fieldName = $(fieldLi).find(".lblFieldNameReviewPopup:first").text();
        var spnDuplicateWarning = $(fieldLi).find('.spnDuplicateWarn');

        if ((sourceElemClassName === "sblob" || sourceElemClassName === "slabel-off" || sourceElemClassName === "form-control input-sm") && !isAnyDuplicateFieldSelected(fieldLi)) {
            $(fieldLi).find(".dvDuplicateFieldContainerPopup")[0].innerHTML = CurrentDuplicateFieldHTML;
            var radioElements = $(fieldLi).find(".dvDuplicateFieldContainerPopup").find('input:radio');
            $(radioElements[fieldIndex]).prop('checked', true);

            $.each(radioElements, function (index, elem) {
                if ($(elem).is(':checked')) {
                    MarkUnmarkDuplicateFieldsForDelete($(elem).data('fieldindex'), false);
                    window.opener.MarkUnmarkDuplicateFieldsForDelete($(elem).data('fieldindex'), false);
                }
                else {
                    MarkUnmarkDuplicateFieldsForDelete($(elem).data('fieldindex'), true);
                    window.opener.MarkUnmarkDuplicateFieldsForDelete($(elem).data('fieldindex'), true);
                }
            });

            $(fieldLi).data('selectedfieldindex', fieldIndexInSource);
            window.opener.HighLightSelectedFieldForReviewFromChild(fieldIndexInSource);
            if (!$(spnDuplicateWarning).hasClass("glyphDuplicateGreen")) {
                $(spnDuplicateWarning).addClass("glyphDuplicateGreen").removeClass("glyphDuplicate");
            }
            window.opener.SyncDuplicateFieldChangesWithChild(fieldName, fieldIndexInSource);
            InitalizeRCSwitcher(fieldLi);
        }

        UpdateDuplicateFieldsArray(fieldName, fieldIndexInSource);

    });
}

function UpdateSelectionsInDuplicateFields(inputFieldContainer, fieldName) {
    var objField = GetDupliCateFieldObject(fieldName);

    if (objField !== null && objField !== undefined) {
        var fieldIndex = objField.SelectedValueSourceIndex;

        if (fieldIndex >= 0) {
            var fieldLi = $(inputFieldContainer).closest('li');
            var spnDuplicateWarn = $(fieldLi).find('.spnDuplicateWarn');
            //Test code for field selections
            if (!($(fieldLi).find(".clsFieldInputContainer:first").find(".dvDuplicateFieldRow").length > 1)) {
                var inputTxtArea = $(fieldLi).find(".input-sm:first");

                if (CurrentReviewStatusPopup[objField.SelectedValueSourceIndex].IsModified == true) {
                    $(inputTxtArea).css('background-color', '#e6f3f7');
                    $(inputTxtArea).val(CurrentReviewStatusPopup[objField.SelectedValueSourceIndex].LatestValue);
                }
                else {
                    $(inputTxtArea).val(CurrentReviewStatusPopup[objField.SelectedValueSourceIndex].Value);
                }
            }
            else {
                var inputSM = $(inputFieldContainer).find("input[data-fieldIndex = '" + fieldIndex + "']:first");
                $(inputSM).prop('checked', true);

                $(fieldLi).find(".input-sm").each(function () {
                    var index = $(this).closest(".dvDuplicateFieldRow").data("fieldindexinsource");
                    if (index !== null && index !== undefined) {
                        if (CurrentReviewStatusPopup[index].IsModified == true) {
                            $(this).css('background-color', '#e6f3f7');
                            $(this).val(CurrentReviewStatusPopup[index].LatestValue);
                        }
                        else {
                            $(this).val(CurrentReviewStatusPopup[index].Value);
                        }
                    }
                });
            }
            if (CurrentReviewStatusPopup[fieldIndex].IsModified == true) {
                $(fieldLi).find('.editedField').css('display', 'inline-block');
            }

            //end of test code for field selections

            //$(fieldLi).data("selectedfieldindex", objField.SelectedValueSourceIndex);
            //$(inputFieldContainer).find("input[data-fieldIndex = '" + fieldIndex + "']:first").prop('checked', true);


            //if (!$(fieldLi).hasClass("expandFieldPopup")) {
            //    $(inputFieldContainer).find('.input-sm').val(currentReviewRequestPopup.FieldsToQC[fieldIndex].Value);
            //}

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
    $(fieldLi).find('.dvDuplicateFieldContainerPopup').find('input:radio').rcSwitcher({
        theme: 'flat',
        blobOffset: 1,
        onText: 'Yes',
        offText: 'No'
    }).on({
        'turnon.rcSwitcher': function (e, dataObj) {
            var objField = $(this).closest('li');
            var fieldName = $(this).attr("name");
            var InputSourceIndex = $(this).data("fieldindex");
            UpdateDuplicateFieldsArray(fieldName, InputSourceIndex);
            $(objField).data('selectedfieldindex', InputSourceIndex);

            window.opener.SyncDuplicateFieldChangesWithChild(fieldName, InputSourceIndex);
            window.opener.HighLightSelectedFieldInPDFView(InputSourceIndex);
        },
        'turnoff.rcSwitcher': function (e, dataObj) {
            MarkUnmarkDuplicateFieldsForDelete($(this).data("fieldindex"), true);
        }
    });
}

function AddToDuplicateFieldsArray(fieldLi) {
    var isFieldExist = false;
    $.each(duplicateFields, function (index, obj) {
        if (obj.FieldName === $(fieldLi).find(".lblFieldNameReviewPopup:first").text()) {
            isFieldExist = true;
        }
    });

    if (!isFieldExist) {
        var inputFieldContainer = $(fieldLi).find('.clsFieldInputContainer');
        var objfield = new Object();

        objfield.FieldName = $(fieldLi).find(".lblFieldNameReviewPopup:first").text();
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
        currentReviewRequestPopup.FieldsToQC[fieldIndex].IsDelete = true;
    }
    else {
        currentReviewRequestPopup.FieldsToQC[fieldIndex].IsDelete = false;
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
