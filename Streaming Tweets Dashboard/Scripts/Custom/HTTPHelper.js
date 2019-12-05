var _helper;
$(document).ready(function () {
    _helper = new helper();

    function helper() {

    }

    helper.prototype.isUndefinedorNull = function (value) {
        if (value == undefined && value == null)
            return true;
        else
            return false;
    }

    helper.prototype.get = function (action, success, failure, context) {
        $.ajax({
            method: "GET",
            url: action,
            async: false,
            contentType: "application/json",
            cache: false,
            success: function (data) {
                success(data, context);
            },
            error: function (error) {
                console.log(error);
                if (failure !== null && failure !== undefined && typeof failure === "function") {
                    failure();
                }
            },
            complete: function () {

            }
        });
    }

    helper.prototype.post = function (action, inputData, success, failure, context) {
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

    helper.prototype.put = function (action, inputData, success, failure, context) {
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
                if (failure !== null && failure !== undefined && typeof failure === "function") {
                    failure();
                }
            },
            complete: function () {

            }
        });
    }

    helper.prototype.delete = function (action, inputData, success, failure, context) {
        $.ajax({
            method: "DELETE",
            url: action,
            async: false,
            contentType: "application/json",
            data: JSON.stringify(inputData),
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
});


