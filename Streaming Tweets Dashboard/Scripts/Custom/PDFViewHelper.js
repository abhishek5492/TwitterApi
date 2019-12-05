var __PDF_DOC,
    __CURRENT_PAGE,
    __TOTAL_PAGES,
    __PAGE_RENDERING_IN_PROGRESS = 0,
    __CANVAS,
    __CANVAS_CTX;

var __overlayDiv;
var currentReviewRequest = null;

function InitiatePDFView() {
    PDFJS.imageResourcesPath = baseURL + "Scripts/pdf.js/images/";
    PDFJS.workerSrc = baseURL + "Scripts/pdf.js/build/pdf.worker.js";
    PDFJS.cMapUrl = baseURL + "Scripts/pdf.js/web/cmaps/";
    __CANVAS = $('#pdf-canvas').get(0),
    __CANVAS_CTX = __CANVAS.getContext('2d');

    $(".pdfViewPageInfo").hide();
}

function BindPDFViewEvents() {
    // Previous page of the PDF
    $("#pdf-prev").on('click', function () {
        if (__CURRENT_PAGE != 1) {
            $(currentSelectedField).removeClass("highLightField");
            $(__overlayDiv).css('display', 'none');
            showPage(--__CURRENT_PAGE);
        }
    });

    // Next page of the PDF
    $("#pdf-next").on('click', function () {
        if (__CURRENT_PAGE != __TOTAL_PAGES) {
            $(currentSelectedField).removeClass("highLightField");
            $(__overlayDiv).css('display', 'none');
            showPage(++__CURRENT_PAGE);
        }

    });
}

function highlightFirstAmerican_Click() {
    var pdfWidth = 12240;
    var pdfHeight = 15840;
    //HighlightText(1272, 2486, 2640, 3538, pdfWidth, pdfHeight);
    HighlightText(1272, 2486, 4387, 3298, pdfWidth, pdfHeight);
}

function highlightHide_Click() {
    HighlightText(0, 0, 1, 1);
}

function HighlightText(pdfLeft, pdfTop, pdfRight, pdfBottom, pdfWidth, pdfHeight) {

    var canvasWidth = __CANVAS.width;
    var canvasHeight = __CANVAS.height;

    var top, left, bottom, right, width, height;

    top = pdfTop / pdfHeight * canvasHeight;
    left = pdfLeft / pdfWidth * canvasWidth;
    bottom = pdfBottom / pdfHeight * canvasHeight;
    right = pdfRight / pdfWidth * canvasWidth;

    width = right - left;
    height = bottom - top;

    top = top + __CANVAS.offsetTop;
    left = left + __CANVAS.offsetLeft;

    __overlayDiv.setAttribute('style', 'background-color: rgba(255, 255, 0,0.399);position:absolute;' +
      'left:' + left + 'px;top:' + top + 'px;width:' + width + 'px;height:' + height + 'px;');

    SmoothScrollToElement($("#pdf-contents"), __overlayDiv);
}

function CreateHighlightDiv() {
    var overlayDiv = document.createElement('div');
    overlayDiv.setAttribute('class', 'overlayHighlightDiv');

    __CANVAS.parentElement.appendChild(overlayDiv);

    __overlayDiv = overlayDiv;
}

// Initialize and load the PDF
function showPDF(reviewRequest) {
    $(".loader").show();
    LoadFileFromNetworkShare(reviewRequest);
}

function LoadFileFromNetworkShare(reviewRequest) {

    var xhr = new XMLHttpRequest(), blob, fileReader = new FileReader();

    xhr.open("GET", locationPathName + "pdfFile" + "/" + reviewRequest.TransactionID + "/" + reviewRequest.FileName, true);
    xhr.responseType = "arraybuffer";

    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
            // Create a blob from the response
            blob = new Blob([xhr.response], { type: "application/pdf" });
            var fileurl = URL.createObjectURL(blob);

            fileReader.onloadend = function () {
                var result = fileReader.result;

                PDFJS.getDocument(result).then(function (pdf_doc) {
                    __PDF_DOC = pdf_doc;
                    __TOTAL_PAGES = __PDF_DOC.numPages;

                    // Hide the pdf loader and show pdf container in HTML
                    $("#pdf-contents").show();
                    $("#pdf-total-pages").text(__TOTAL_PAGES);
                    $(".pdfViewPageInfo").show();
                    // Show the first page
                    showPage(1);
                    currentReviewRequest = reviewRequest;
                }).catch(function (error) {
                    // If error re-show the upload button
                    $("#upload-button").show();
                    alert(error.message);
                });
            };
            // Load blob as Data URL
            fileReader.readAsArrayBuffer(blob);
        }
    }, false);
    // Send XHR
    xhr.send();
}

// Load and render a specific page of the PDF
function showPage(page_no, pdfHighLightCoordinates) {
    
    __PAGE_RENDERING_IN_PROGRESS = 1;
    __CURRENT_PAGE = page_no;

    // Disable Prev & Next buttons while page is being loaded
    $("#pdf-next, #pdf-prev").attr('disabled', 'disabled');

    // While page is being rendered hide the canvas and show a loading message
    $("#pdf-canvas").hide();
    $(".loader").show();

    // Update current page in HTML
    $("#pdf-current-page").text(page_no);

    // Fetch the page
    __PDF_DOC.getPage(page_no).then(function (page) {
        // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
        var scale_required = __CANVAS.width / page.getViewport(1).width;

        // Get viewport of the page at required scale
        var viewport = page.getViewport(scale_required);

        // Set canvas height
        __CANVAS.height = viewport.height;

        var renderContext = {
            canvasContext: __CANVAS_CTX,
            viewport: viewport
        };

        // Render the page contents in the canvas
        page.render(renderContext).then(function () {
            __PAGE_RENDERING_IN_PROGRESS = 0;

            // Re-enable Prev & Next buttons
            $("#pdf-next, #pdf-prev").removeAttr('disabled');

            // Show the canvas and hide the page loader
            $("#pdf-canvas").show();

            CreateHighlightDivsandSetPosition(pdfHighLightCoordinates);
            if (selectFirstField) {
                SelectFirstReviewField();
            }

            $(".loader").hide();
        });
    });
}

function CreateHighlightDivsandSetPosition(pdfHighLightCoordinates) {
    if (pdfHighLightCoordinates !== null && pdfHighLightCoordinates !== undefined) {
        $.each(pdfHighLightCoordinates, function (index, coordinates) {
            CreateHighlightDiv();
            $(__overlayDiv).css('display', 'block');
            HighlightText(coordinates.pdfLeft, coordinates.pdfTop, coordinates.pdfRight, coordinates.pdfBottom, coordinates.pdfWidth, coordinates.pdfHeight);
        });
    }
}

function SmoothScrollToElement(parentDiv, targetElement) {
    $(targetElement).scrollintoview({ direction: "both" });
}


