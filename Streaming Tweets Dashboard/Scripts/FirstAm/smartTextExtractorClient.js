var showLoadingImageFlag = false;
$(document).ready(function () {
    
});

function readURL(input) {
    debugger
    window.location.href = 'http://localhost:59545/content/documents/AZ-MC-DYI.6844932FI0.455-1997.867848.tif';
    clearPageData();
    var fileTypes = ['tiff', 'tif'];
    var files = input.files;
    var extension = files[0].name.split('.').pop().toLowerCase();
    
    if (FileReader && files && files.length && fileTypes.indexOf(extension) > -1) {
        var fr = new FileReader();
        fr.onload = function (e) {
            success = fileTypes.indexOf(extension) > -1;
            if (success) {
                Tiff.initialize({
                    TOTAL_MEMORY: 10000000
                });
                var tiff = new Tiff({
                    buffer: e.target.result
                });
                var tiff1 = new Tiff({
                    buffer: e.target.result
                });

                $('#canvasDiv').empty();
                $('#ResponseDiv').empty();
                //if (tiff.countDirectory() == 1) {
                //    loadOCR(tiff.toDataURL());
                //}
                //else
                {
                    for (var i = 0, len = tiff.countDirectory() ; i < len; ++i) {
                        tiff.setDirectory(i);
                        var tiffCanvas = tiff.toCanvas();

                        $(tiffCanvas).css({
                            "max-width": "100px",
                            "width": "100%",
                            "height": "auto",
                            "display": "block",
                            "padding-top": "10px",
                            "padding-left": "5px",
                            "padding-right": "5px",
                            "cursor": "pointer"
                        }).addClass("preview")

                        $('#canvasDiv').append(tiffCanvas);
                        $('#canvasDiv').append("<div style='text-align: center;'> Page " + (i + 1) + "</    div>");

                        tiff1.setDirectory(i);
                        var tiffCanvas1 = tiff1.toCanvas();

                        $(tiffCanvas1).css({
                            "max-width": "100%",
                            "width": "100%",
                            "height": "auto",
                            "display": "block",
                            "padding-top": "10px",
                            "padding-left": "5px",
                            "padding-right": "5px",
                            "cursor": "pointer"
                        })//.addClass("preview")

                        $('#ResponseDiv').append(tiffCanvas1);
                        $('#ResponseDiv').append("<div style='text-align: center;'> Page " + (i + 1) + "</    div>");
                       // ResponseCmpr2
                    }

                    $('#canvasDiv').click(function (element) {
                        if (element.target.className === "preview")
                            onCanvasClick(element.target);
                    });
                }
            }
        }
        fr.onloadend = function (e) {
            fr = null;
        }
        fr.readAsArrayBuffer(files[0]);
    }
    else if (extension == "pdf") {
        convertPdf(files[0]);
    }
    else {
        loadImageAndOCR(input);
    }
};

function loadImageAndOCR(input) {

    var file = input.files[0];
    var reader = new FileReader();

    reader.onload = function (event) {
        var dataUri = event.target.result;
        $('#canvasDiv').empty();
        loadOCR(dataUri)
    };

    reader.onerror = function (event) {
        console.error("File could not be read.");
    };

    reader.readAsDataURL(file);
};

function loadOCR(uri) {
    $("#MainDiv").css("opacity", "0.5");
    $("#divLoading").css("display", "block");
    showLoadingImageFlag = false;
    var ratio = null;
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    var img = new Image();
    img.crossOrigin = "Anonymous";
    // wait until the image has been fully processed
    img.onload = function () {
        ratio = canvas.width / img.width;
        canvas.height = (img.height * ratio);
        var downScaleCanvas = null;
        //if ($('#isDownscale').prop("checked")) {
        try {
            downScaleCanvas = downScaleImage(img, ratio)
            downCtx = downScaleCanvas.getContext('2d');
            downCtx.imageSmoothingEnabled = false;
            downCtx.globalAlpha = 1;
            context.drawImage(downScaleCanvas, 0, 0, canvas.width, canvas.height);
        }
        catch (err) {
            //}
            //else 
                context.drawImage(img, 0, 0, canvas.width, (img.height * ratio));
        }

        var dataUrl = img.src.trim().toString();
        //var finalOutput = "";
        $.ajax({
            url: "http://localhost/LegalDescr/api/SmartTextExtractor",
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            //data: JSON.stringify(dataUrl),
            data: JSON.stringify({ dataUrls: dataUrl, LastPage:true, methodType: "Unigram" }),
            success: function (data) {
                if (!nicEditors.findEditor('ResponseCmpr2')) {
                    new nicEditor({ fontFormat: "Pre", fullPanel: true, iconsPath: 'http://localhost/SmartTextExtractorClient/nicEditorIcons.gif' }).panelInstance('ResponseCmpr2');
                }

                var nicReq = nicEditors.findEditor('ResponseCmpr2');
                nicReq.setContent(data);
                $('#rsltText').text(data);
                $("#MainDiv").css("opacity", "1");
                $("#divLoading").css("display", "none");
                //finalOutput=data
                $('#ResponseCmpr2').prev().css("font-family", "Verdana");
                $('#ResponseCmpr2').prev().css("font-size", "12px");

                var wordSpans = $("div.nicEdit-main span[class='ocrx_word']");
                var wordCount = wordSpans.length;
                var totalConf = 0;
                var lessConf = [];
                wordSpans.each(function (a, b) {
                    var imageData = null;
                    var title = $(this)[0].title.split(";");
                    var confScore = title[1].split(" ")[2];
                    totalConf = totalConf + parseFloat(confScore);
                    var cord = title[0].split(" ");
                    var cordx1 = cord[1] * ratio;
                    var cordy1 = cord[2] * ratio;
                    var cordx2 = (cord[3] * ratio) - (cord[1] * ratio);
                    var cordy2 = (cord[4] * ratio) - (cord[2] * ratio);

                    context.globalAlpha = 0.5;
                    if (confScore < 80) {
                        $(this).background = 'Turquoise';
                        context.fillStyle = 'Turquoise';
                        context.fillRect(cordx1, cordy1, cordx2, cordy2);
                        $(this)[0].style.background = 'Turquoise';

                        var cords = [];
                        cords.push(cordx1)
                        cords.push(cordy1)
                        cords.push(cordx2)
                        cords.push(cordy2)
                        lessConf.push(cords);
                    }

                    $(this).mouseenter(function (element) {
                        context.clearRect(0, 0, canvas.width, canvas.height)
                        context.imageSmoothingEnabled = false;
                        context.globalAlpha = 1;
                        if (downScaleCanvas != null)
                            context.drawImage(downScaleCanvas, 0, 0, canvas.width, canvas.height)
                        else
                            context.drawImage(img, 0, 0, canvas.width, canvas.height);
                        zoomCanvasElement(canvas, cordx1, cordy1, cordx2, cordy2);
                        context.globalAlpha = 0.5;
                        context.fillStyle = 'green';
                        context.fillRect(cordx1, cordy1, cordx2, cordy2);
                        lessConf.forEach(function (item) {
                            context.fillStyle = 'Turquoise';
                            context.fillRect(item[0], item[1], item[2], item[3]);
                        });

                    })
                      .mouseleave(function (element) {
                          context.clearRect(0, 0, canvas.width, canvas.height)
                          context.imageSmoothingEnabled = false;
                          context.globalAlpha = 1;
                          if (downScaleCanvas != null)
                              context.drawImage(downScaleCanvas, 0, 0, canvas.width, canvas.height)
                          else
                              context.drawImage(img, 0, 0, canvas.width, canvas.height);
                          lessConf.forEach(function (item) {
                              context.globalAlpha = 0.5;
                              context.fillStyle = 'Turquoise';
                              context.fillRect(item[0], item[1], item[2], item[3]);
                          });
                          var zoom = document.getElementById("zoom");
                          zoom.style.display = "none";
                      })
                    .contextMenu('myMenu', {
                        onContextMenu: function (e) {
                            var textToCheck = e.target.innerText;
                            var isTrue = false;
                            $.ajax({
                                url: "http://localhost:63094/SpellCheck/CheckSpelling",
                                type: 'POST',
                                contentType: 'application/json; charset=utf-8',
                                dataType: 'json',
                                async: false,
                                data: JSON.stringify(textToCheck),
                                success: function (data) {
                                    var dictData = JSON.parse(data);
                                    $("#suggestions").empty();
                                    if (dictData.suggestions.length > 0) {
                                        dictData.suggestions.forEach(function (item) {
                                            $("#suggestions").append("<li>" + item + "</li>")
                                        })
                                        $("#suggestions").append("<li id='addDic'>Add To Learning</li>")
                                        isTrue = true;
                                    }
                                }
                            });
                            return isTrue;
                        },

                        onShowMenu: function (e, menu) {
                            $("#suggestions li").click(function (menuItem) {
                                if (menuItem.target.getAttribute("id") == "addDic") {
                                    $.ajax({
                                        url: "http://localhost:63094/SpellCheck/AddWord",
                                        type: 'POST',
                                        contentType: 'application/json; charset=utf-8',
                                        dataType: 'json',
                                        async: false,
                                        data: JSON.stringify(e.target.innerText)
                                    });
                                }
                                else {
                                    e.target.innerText = menuItem.target.innerText;
                                    return false;
                                }
                            });
                            return menu;
                        }
                    });

                });

                var docConfidence = Math.round((totalConf / wordCount) * 100) / 100;
                $("#totalConfScoreSpan").text(docConfidence);
                $("#totalConfScoreDiv").show();
                //magnifyCanvas

                $('.nicEdit-main').attr("spellcheck", "true");
                $('.ocr_par').attr("spellcheck", "true");
            }
        });
    };

    img.onerror = function () {
        console.error('Image could not load.');
    };

    img.src = uri;
};

function onCanvasClick(canvasElement) {
    clearWorkArea();
    var ratio = null;
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    ratio = canvas.width / canvasElement.width;
    canvas.height = (canvasElement.height * ratio);
    var downScaleImage = null;
    //if ($('#isDownscale').prop("checked")) {
    try {
        downScaleImage = downScaleCanvas(canvasElement, ratio);
        downCtx = downScaleImage.getContext('2d');
        downCtx.imageSmoothingEnabled = false;
        downCtx.globalAlpha = 1;
        context.drawImage(downScaleImage, 0, 0, canvas.width, canvas.height);
    }
    catch (err) {
        //}
        //else 
        context.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
    }

    var dataUrl = canvasElement.toDataURL();

    $.ajax({
        url: "http://localhost:63094/api/SmartTextExtractor",
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(dataUrl),
        success: function (data) {
            if (!nicEditors.findEditor('ResponseCmpr2')) {
                new nicEditor({ fontFormat: "Pre", fullPanel: true, iconsPath: 'http://localhost/SmartTextExtractorClient/nicEditorIcons.gif' }).panelInstance('ResponseCmpr2');
            }

            var nicReq = nicEditors.findEditor('ResponseCmpr2');
            nicReq.setContent(data);
            $('#ResponseCmpr2').prev().css("font-family", "Verdana");
            $('#ResponseCmpr2').prev().css("font-size", "12px");

            var wordSpans = $("div.nicEdit-main span[class='ocrx_word']");
            var wordCount = wordSpans.length;
            var totalConf = 0;
            var lessConf = [];
            wordSpans.each(function (a, b) {
                var imageData = null;
                var title = $(this)[0].title.split(";");
                var confScore = title[1].split(" ")[2];
                totalConf = totalConf + parseFloat(confScore);
                var cord = title[0].split(" ");
                var cordx1 = cord[1] * ratio;
                var cordy1 = cord[2] * ratio;
                var cordx2 = (cord[3] * ratio) - (cord[1] * ratio);
                var cordy2 = (cord[4] * ratio) - (cord[2] * ratio);

                context.globalAlpha = 0.5;
                if (confScore < 80) {
                    $(this).background = 'Turquoise';
                    context.fillStyle = 'Turquoise';
                    context.fillRect(cordx1, cordy1, cordx2, cordy2);
                    $(this)[0].style.background = 'Turquoise';

                    var cords = [];
                    cords.push(cordx1)
                    cords.push(cordy1)
                    cords.push(cordx2)
                    cords.push(cordy2)
                    lessConf.push(cords);
                }

                $(this).mouseenter(function (element) {
                    context.clearRect(0, 0, canvas.width, canvas.height)
                    context.imageSmoothingEnabled = false;
                    context.globalAlpha = 1;
                    if (downScaleImage != null)
                        context.drawImage(downScaleImage, 0, 0, canvas.width, canvas.height)
                    else
                        context.drawImage(canvasElement, 0, 0, canvas.width, canvas.height)
                    zoomCanvasElement(canvas, cordx1, cordy1, cordx2, cordy2);
                    context.globalAlpha = 0.5;
                    context.fillStyle = 'green';
                    context.fillRect(cordx1, cordy1, cordx2, cordy2);
                    lessConf.forEach(function (item) {
                        context.fillStyle = 'Turquoise';
                        context.fillRect(item[0], item[1], item[2], item[3]);
                    });
                })
                  .mouseleave(function (element) {
                      context.clearRect(0, 0, canvas.width, canvas.height)
                      context.imageSmoothingEnabled = false;
                      context.globalAlpha = 1;
                      if (downScaleImage != null)
                          context.drawImage(downScaleImage, 0, 0, canvas.width, canvas.height)
                      else
                          context.drawImage(canvasElement, 0, 0, canvas.width, canvas.height)
                      lessConf.forEach(function (item) {
                          context.globalAlpha = 0.5;
                          context.fillStyle = 'Turquoise';
                          context.fillRect(item[0], item[1], item[2], item[3]);
                      });
                      var zoom = document.getElementById("zoom");
                      zoom.style.display = "none";
                  })
                .contextMenu('myMenu', {
                    onContextMenu: function (e) {
                        var textToCheck = e.target.innerText;
                        var isTrue = false;
                        $.ajax({
                            url: "http://localhost:63094/SpellCheck/CheckSpelling",
                            type: 'POST',
                            contentType: 'application/json; charset=utf-8',
                            dataType: 'json',
                            async: false,
                            data: JSON.stringify(textToCheck),
                            success: function (data) {
                                var dictData = JSON.parse(data);
                                $("#suggestions").empty();
                                if (dictData.suggestions.length > 0) {
                                    dictData.suggestions.forEach(function (item) {
                                        $("#suggestions").append("<li>" + item + "</li>")
                                    })
                                    $("#suggestions").append("<li id='addDic'>Add To Learning</li>")
                                    isTrue = true;
                                }
                            }
                        });
                        return isTrue;
                    },

                    onShowMenu: function (e, menu) {
                        $("#suggestions li").click(function (menuItem) {
                            if (menuItem.target.getAttribute("id") == "addDic") {
                                $.ajax({
                                    url: "http://localhost:63094/SpellCheck/AddWord",
                                    type: 'POST',
                                    contentType: 'application/json; charset=utf-8',
                                    dataType: 'json',
                                    async: false,
                                    data: JSON.stringify(e.target.innerText)
                                });
                            }
                            else {
                                e.target.innerText = menuItem.target.innerText;
                                return false;
                            }
                        });
                        return menu;
                    }
                });
                //.mousedown(function (e) {
                //    if (e.button == 2) {
                //        checkSpelling(e);
                //    }
                //});

            });

            var docConfidence = Math.round((totalConf / wordCount) * 100) / 100;
            $("#totalConfScoreSpan").text(docConfidence);
            $("#totalConfScoreDiv").show();
            //magnifyCanvas();
            $('.nicEdit-main').attr("spellcheck", "true");
            $('.ocr_par').attr("spellcheck", "true");
        }
    });
};

function convertPdf(file) {
    var reader = new FileReader();
    reader.onload = function (evt) {
    }
    reader.onloadend = function (e) {

        PDFJS.disableWorker = false;
        var myPdfContent = reader.result;
        var docInitParams = convertDataURIToBinary(myPdfContent);

        function renderPage(page) {

            var scale = 10;
            var canvas = document.createElement('canvas');
            var canvas1 = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var ctx1 = canvas1.getContext('2d');
            var viewport = page.getViewport(scale);
            var viewport1 = page.getViewport(20);
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            var renderContext1 = {
                canvasContext: ctx1,
                viewport: viewport1
            };

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            canvas1.height = viewport1.height;
            canvas1.width = viewport1.width;

            $(canvas).css({
                "max-width": "100px",
                "width": "100%",
                "height": "auto",
                "display": "block",
                "padding-top": "10px",
                "padding-left": "5px",
                "padding-right": "5px",
                "cursor": "pointer"
            }).addClass("preview")

            $(canvas1).css({
                "max-width": "100%",
                "width": "100%",
                "height": "auto",
                "display": "block",
                "padding-top": "10px",
                "padding-left": "5px",
                "padding-right": "5px",
                "cursor": "pointer"
            })

            $('#canvasDiv').append(canvas);
            $('#canvasDiv').append("<div style='text-align: center;'> Page " + (page.pageIndex + 1) + "</div>");
        
            $('#ResponseDiv').append(canvas1);
            $('#ResponseDiv').append("<div style='text-align: center;'> Page " + (page.pageIndex + 1) + "</div>");
            page.render(renderContext);
            page.render(renderContext1);
        }

        function renderPages(pdfDoc) {

            for (var num = 1; num <= pdfDoc.numPages; num++) {
                pdfDoc.getPage(num).then(renderPage);
            }

            $('#canvasDiv').click(function (element) {
                if (element.target.className === "preview")
                    onCanvasClick(element.target);
            });
        }

        PDFJS.getDocument(docInitParams).then(renderPages);
    }

    reader.readAsDataURL(file);
};

var convertDataURIToBinary = function (dataURI) {
    var BASE64_MARKER = ';base64,';
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
};


var magnifyCanvas = function () {
    var main = document.getElementById("myCanvas");
    var zoom = document.getElementById("zoom");
    var ctx = main.getContext("2d")
    var zoomCtx = zoom.getContext("2d");

    main.addEventListener("mousemove", function (e) {
        zoomCtx.fillStyle = "white";
        zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
        zoomCtx.drawImage(main, e.x > 60 ? e.x - 60 : e.x, e.y > 10 ? e.y - 10 : e.y, 200, 100, 0, 0, 400, 200);
        zoom.style.top = e.pageY - 160 + "px";
        zoom.style.left = e.pageX - 200 + "px";
        zoom.style.display = "block";
    });

    main.addEventListener("mouseout", function () {
        zoom.style.display = "none";
    });
};

function zoomCanvasElement(canvas, cordx1, cordy1, cordx2, cordy2) {
    var zoom = document.getElementById("zoom");
    var zoomCtx = zoom.getContext("2d");
    zoomCtx.fillStyle = "white";
    zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
    zoomCtx.drawImage(canvas, ((cordx1 > 10) ? (cordx1 - 10) : cordx1), ((cordy1 > 3) ? (cordy1 - 3) : cordy1), 200, 100, 0, 0, 400, 200);
    zoom.style.top = cordy1 + 20 + "px";
    zoom.style.left = ((cordx1 > 10) ? (cordx1 - 10) : cordx1) + "px";
    zoom.style.display = "block";
}


function clearPageData() {
    $("#canvasDiv").empty();
    $("#ResponseDiv").empty();

    clearWorkArea();
};

function clearWorkArea() {
    if (nicEditors.findEditor('ResponseCmpr2')) {
        var nicReq = nicEditors.findEditor('ResponseCmpr2');
        nicReq.setContent("");
    }

    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    $("#totalConfScoreDiv").hide();
};

// scales the image by (float) scale < 1
// returns a canvas containing the scaled image.
function downScaleImage(img, scale) {
    var imgCV = document.createElement('canvas');
    imgCV.width = img.width;
    imgCV.height = img.height;
    var imgCtx = imgCV.getContext('2d');
    imgCtx.drawImage(img, 0, 0);
    return downScaleCanvas(imgCV, scale);
};

// scales the canvas by (float) scale < 1
// returns a new canvas containing the scaled image.
function downScaleCanvas(cv, scale) {
    if (!(scale < 1) || !(scale > 0)) throw ('scale must be a positive number <1 ');
    var sqScale = scale * scale; // square scale = area of source pixel within target
    var sw = cv.width; // source image width
    var sh = cv.height; // source image height
    var tw = Math.floor(sw * scale); // target image width
    var th = Math.floor(sh * scale); // target image height
    var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
    var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
    var tX = 0, tY = 0; // rounded tx, ty
    var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
    // weight is weight of current source point within target.
    // next weight is weight of current source point within next target's point.
    var crossX = false; // does scaled px cross its current px right border ?
    var crossY = false; // does scaled px cross its current px bottom border ?
    var sBuffer = cv.getContext('2d').
    getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
    var tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
    var sR = 0, sG = 0, sB = 0; // source's current point r,g,b
    /* untested !
    var sA = 0;  //source alpha  */

    for (sy = 0; sy < sh; sy++) {
        ty = sy * scale; // y src position within target
        tY = 0 | ty;     // rounded : target pixel's y
        yIndex = 3 * tY * tw;  // line index within target array
        crossY = (tY != (0 | ty + scale));
        if (crossY) { // if pixel is crossing botton target pixel
            wy = (tY + 1 - ty); // weight of point within target pixel
            nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
        }
        for (sx = 0; sx < sw; sx++, sIndex += 4) {
            tx = sx * scale; // x src position within target
            tX = 0 | tx;    // rounded : target pixel's x
            tIndex = yIndex + tX * 3; // target pixel index within target array
            crossX = (tX != (0 | tx + scale));
            if (crossX) { // if pixel is crossing target pixel's right
                wx = (tX + 1 - tx); // weight of point within target pixel
                nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
            }
            sR = sBuffer[sIndex];   // retrieving r,g,b for curr src px.
            sG = sBuffer[sIndex + 1];
            sB = sBuffer[sIndex + 2];

            /* !! untested : handling alpha !!
               sA = sBuffer[sIndex + 3];
               if (!sA) continue;
               if (sA != 0xFF) {
                   sR = (sR * sA) >> 8;  // or use /256 instead ??
                   sG = (sG * sA) >> 8;
                   sB = (sB * sA) >> 8;
               }
            */
            if (!crossX && !crossY) { // pixel does not cross
                // just add components weighted by squared scale.
                tBuffer[tIndex] += sR * sqScale;
                tBuffer[tIndex + 1] += sG * sqScale;
                tBuffer[tIndex + 2] += sB * sqScale;
            } else if (crossX && !crossY) { // cross on X only
                w = wx * scale;
                // add weighted component for current px
                tBuffer[tIndex] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                // add weighted component for next (tX+1) px                
                nw = nwx * scale
                tBuffer[tIndex + 3] += sR * nw;
                tBuffer[tIndex + 4] += sG * nw;
                tBuffer[tIndex + 5] += sB * nw;
            } else if (crossY && !crossX) { // cross on Y only
                w = wy * scale;
                // add weighted component for current px
                tBuffer[tIndex] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                // add weighted component for next (tY+1) px                
                nw = nwy * scale
                tBuffer[tIndex + 3 * tw] += sR * nw;
                tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                tBuffer[tIndex + 3 * tw + 2] += sB * nw;
            } else { // crosses both x and y : four target points involved
                // add weighted component for current px
                w = wx * wy;
                tBuffer[tIndex] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                // for tX + 1; tY px
                nw = nwx * wy;
                tBuffer[tIndex + 3] += sR * nw;
                tBuffer[tIndex + 4] += sG * nw;
                tBuffer[tIndex + 5] += sB * nw;
                // for tX ; tY + 1 px
                nw = wx * nwy;
                tBuffer[tIndex + 3 * tw] += sR * nw;
                tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                // for tX + 1 ; tY +1 px
                nw = nwx * nwy;
                tBuffer[tIndex + 3 * tw + 3] += sR * nw;
                tBuffer[tIndex + 3 * tw + 4] += sG * nw;
                tBuffer[tIndex + 3 * tw + 5] += sB * nw;
            }
        } // end for sx 
    } // end for sy

    // create result canvas
    var resCV = document.createElement('canvas');
    resCV.width = tw;
    resCV.height = th;
    var resCtx = resCV.getContext('2d');
    var imgRes = resCtx.getImageData(0, 0, tw, th);
    var tByteBuffer = imgRes.data;
    // convert float32 array into a UInt8Clamped Array
    var pxIndex = 0; //  
    for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
        tByteBuffer[tIndex] = Math.ceil(tBuffer[sIndex]);
        tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
        tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
        tByteBuffer[tIndex + 3] = 255;
    }
    // writing result to canvas.
    resCtx.putImageData(imgRes, 0, 0);
    return resCV;
};

function checkSpelling(element) {
    if (element.target) {
        var textToCheck = element.target.innerText;
        $.ajax({
            url: "http://localhost:63094/SpellCheck/CheckSpelling",
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: false,
            data: JSON.stringify(textToCheck),
            success: function (data) {
                var dictData = JSON.parse(data);
                $("#suggestions").empty();
                if (dictData.suggestions.length > 0) {
                    dictData.suggestions.forEach(function (item) {
                        $("#suggestions").append("<li>" + item + "</li>")
                    })
                    return true;
                }
                return false;
            }
        });
    }
};
function ClearDescr() {
    $('#rsltText').text("");
    $("#canvasDiv").empty();
    $("#ResponseDiv").empty();
}
function FetchLegalDescr(methodType) {
    $('#rsltText').text("");
    $("#MainDiv").css("opacity", "0.5");
    $("#divLoading").css("display", "block");
    setTimeout(function () { 
    showLoadingImageFlag = true;
      
    var canvasElements = $('.preview');
    var finalOutput = "";      
    for (var i = 0; i < canvasElements.length; i++) {
      
        var canvasElement = canvasElements[i];
        clearWorkArea();
        var ratio = null;
        var canvas = document.getElementById('myCanvas');
        var context = canvas.getContext('2d');
        ratio = canvas.width / canvasElement.width;
        canvas.height = (canvasElement.height * ratio);
        var downScaleImage = null;
        //if ($('#isDownscale').prop("checked")) {
        try {
            downScaleImage = downScaleCanvas(canvasElement, ratio);
            downCtx = downScaleImage.getContext('2d');
            downCtx.imageSmoothingEnabled = false;
            downCtx.globalAlpha = 1;
            context.drawImage(downScaleImage, 0, 0, canvas.width, canvas.height);
        }
        catch (err) {
            //}
            //else 
            context.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
        }

        var dataUrl = canvasElement.toDataURL();
        //var myData = {};
        //myData.dataUrl = JSON.stringify(dataUrl);
        //myData.LastPage = i==canvasElements.length-1?true:false ;
       // setTimeout(function () { 
        $.ajax({
            url: "http://localhost/LegalDescr/api/SmartTextExtractor",//"http://rpandey-w1.corp.firstam.com/api/SmartTextExtractor",//"http://localhost:63094/api/SmartTextExtractor",
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
           // data: {
           //     dataUrls: 
           //     //JSON.stringify(dataUrl), //dataUrl,
           //    JSON.stringify(dataUrl),
           //     LastPages: (i == canvasElements.length - 1) ? true : false
            //},
            data: JSON.stringify({ dataUrls: dataUrl, LastPage: (i == canvasElements.length - 1) ? true : false, methodType: methodType }),
            async:false,
            success: function (data) {
                if (!nicEditors.findEditor('ResponseCmpr2')) {
                    new nicEditor({ fontFormat: "Pre", fullPanel: true, iconsPath: 'http://localhost:63094/SmartTextClient/nicEditorIcons.gif' }).panelInstance('ResponseCmpr2');
                }
                //if (i >= canvasElements.length - 1) {
                //    //alert("done")
                //    $('#rsltText').text(finalOutput);
                //    $("#MainDiv").css("opacity", "1");
                //    $("#divLoading").css("display", "none");
                //}

                var nicReq = nicEditors.findEditor('ResponseCmpr2');
                nicReq.setContent(data);
                finalOutput = data + "\n";
                $('#ResponseCmpr2').prev().css("font-family", "Verdana");
                $('#ResponseCmpr2').prev().css("font-size", "12px");

                var wordSpans = $("div.nicEdit-main span[class='ocrx_word']");
                var wordCount = wordSpans.length;
                var totalConf = 0;
                var lessConf = [];
                wordSpans.each(function (a, b) {
                    var imageData = null;
                    var title = $(this)[0].title.split(";");
                    var confScore = title[1].split(" ")[2];
                    totalConf = totalConf + parseFloat(confScore);
                    var cord = title[0].split(" ");
                    var cordx1 = cord[1] * ratio;
                    var cordy1 = cord[2] * ratio;
                    var cordx2 = (cord[3] * ratio) - (cord[1] * ratio);
                    var cordy2 = (cord[4] * ratio) - (cord[2] * ratio);

                    context.globalAlpha = 0.5;
                    if (confScore < 80) {
                        $(this).background = 'Turquoise';
                        context.fillStyle = 'Turquoise';
                        context.fillRect(cordx1, cordy1, cordx2, cordy2);
                        $(this)[0].style.background = 'Turquoise';

                        var cords = [];
                        cords.push(cordx1)
                        cords.push(cordy1)
                        cords.push(cordx2)
                        cords.push(cordy2)
                        lessConf.push(cords);
                    }

                    $(this).mouseenter(function (element) {
                        context.clearRect(0, 0, canvas.width, canvas.height)
                        context.imageSmoothingEnabled = false;
                        context.globalAlpha = 1;
                        if (downScaleImage != null)
                            context.drawImage(downScaleImage, 0, 0, canvas.width, canvas.height)
                        else
                            context.drawImage(canvasElement, 0, 0, canvas.width, canvas.height)
                        zoomCanvasElement(canvas, cordx1, cordy1, cordx2, cordy2);
                        context.globalAlpha = 0.5;
                        context.fillStyle = 'green';
                        context.fillRect(cordx1, cordy1, cordx2, cordy2);
                        lessConf.forEach(function (item) {
                            context.fillStyle = 'Turquoise';
                            context.fillRect(item[0], item[1], item[2], item[3]);
                        });
                    })
                      .mouseleave(function (element) {
                          context.clearRect(0, 0, canvas.width, canvas.height)
                          context.imageSmoothingEnabled = false;
                          context.globalAlpha = 1;
                          if (downScaleImage != null)
                              context.drawImage(downScaleImage, 0, 0, canvas.width, canvas.height)
                          else
                              context.drawImage(canvasElement, 0, 0, canvas.width, canvas.height)
                          lessConf.forEach(function (item) {
                              context.globalAlpha = 0.5;
                              context.fillStyle = 'Turquoise';
                              context.fillRect(item[0], item[1], item[2], item[3]);
                          });
                          var zoom = document.getElementById("zoom");
                          zoom.style.display = "none";
                      })
                    .contextMenu('myMenu', {
                        onContextMenu: function (e) {
                            var textToCheck = e.target.innerText;
                            var isTrue = false;
                            $.ajax({
                                url: "http://localhost:63094/SpellCheck/CheckSpelling",
                                type: 'POST',
                                contentType: 'application/json; charset=utf-8',
                                dataType: 'json',
                                async: false,
                                data: JSON.stringify(textToCheck),
                                success: function (data) {
                                    var dictData = JSON.parse(data);
                                    $("#suggestions").empty();
                                    if (dictData.suggestions.length > 0) {
                                        dictData.suggestions.forEach(function (item) {
                                            $("#suggestions").append("<li>" + item + "</li>")
                                        })
                                        $("#suggestions").append("<li id='addDic'>Add To Learning</li>")
                                        isTrue = true;
                                    }
                                }
                            });
                            return isTrue;
                        },

                        onShowMenu: function (e, menu) {
                            $("#suggestions li").click(function (menuItem) {
                                if (menuItem.target.getAttribute("id") == "addDic") {
                                    $.ajax({
                                        url: "http://localhost:63094/SpellCheck/AddWord",
                                        type: 'POST',
                                        contentType: 'application/json; charset=utf-8',
                                        dataType: 'json',
                                        async: false,
                                        data: JSON.stringify(e.target.innerText)
                                    });
                                }
                                else {
                                    e.target.innerText = menuItem.target.innerText;
                                    return false;
                                }
                            });
                            return menu;
                        }
                    });
                    //.mousedown(function (e) {
                    //    if (e.button == 2) {
                    //        checkSpelling(e);
                    //    }
                    //});

                });

                var docConfidence = Math.round((totalConf / wordCount) * 100) / 100;
                $("#totalConfScoreSpan").text(docConfidence);
                $("#totalConfScoreDiv").show();
                //magnifyCanvas();
                $('.nicEdit-main').attr("spellcheck", "true");
                $('.ocr_par').attr("spellcheck", "true");
            },
           fail: function (err) {
                alert(err);
           },
           error: function (err) {
               alert(err);
           }
        });
        //}, 0);
    }

    //var resultDoc = data;
    //var nicReq = nicEditors.findEditor('ResponseCmpr2');
    //nicReq.setContent(resultDoc);
    //$('#rsltText').text(finalOutput);
    $('#rsltText').text(finalOutput);
    $("#MainDiv").css("opacity", "1");
    $("#divLoading").css("display", "none");
    }, 10);
}
