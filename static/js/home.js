/**
 * Created by sid on 24/9/17.
 */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
            // Only send the token to relative URLs i.e. locally.
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        }
    }
});

var main_file;
var filePartDetails;
var defaultPartSize = 6000000;
var uploadId;

function handleFileSelect(evt) {
    showLoader();
    var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    main_file = files[0];
    filePartDetails = breakFileIntoParts(main_file);
    createBlobs();
    initiateMultipartUpload();
}

function breakFileIntoParts(file) {
    var count = 1;
    var fileParts = {};
    for (i = 0; i <= file.size; i = i + defaultPartSize) {
        fileParts[count] = {
            'start': i + 1,
            'end': i + defaultPartSize,
            'status': 'pending',
            'size': defaultPartSize,
            'ETag': ''
        }
        count++;
    }
    fileParts[count - 1]['end'] = file.size;
    fileParts[count - 1]['size'] = file.size - fileParts[count - 1]['start'];
    return fileParts;

}

function createBlobs() {
    for (var key in filePartDetails) {
        value = filePartDetails[key]
        filePartDetails[key]['blob'] = main_file.slice(value['start'], value['end'] + 1);
    }
}

function initiateMultipartUpload() {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/initiate_upload/",
        data: {
            "file_name": main_file['name']
        },
        beforeSend: function (xhr, settings) {
            $.ajaxSettings.beforeSend(xhr, settings);
        },
        success: function (result) {
            uploadId = result['upload_id']
            startUploading();
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            showErrorMessage('Upload error: ' + XMLHttpRequest.responseText);
        }
    })
}


function startUploading() {
    for (var key in filePartDetails) {
        get_url_and_upload(key);
    }
}

function get_url_and_upload(key) {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/get_presigned_url/",
        data: {
            "file_name": main_file['name'],
            "part_number": key,
            "upload_id": uploadId
        },
        beforeSend: function (xhr, settings) {
            $.ajaxSettings.beforeSend(xhr, settings);
        },
        success: function (result, a, b) {
            uploadFileToS3(result['signed_url'], key)
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            showErrorMessage('Upload error: ' + XMLHttpRequest.responseText);
        }
    })
}

function uploadFileToS3(url, partNumber) {
    $.ajax({
        type: 'PUT',
        url: url,
        data: filePartDetails[partNumber]['blob'],
        dataType: false,
        processData: false,  // tell jQuery not to convert to form data
        contentType: "multipart/form-data",
        beforeSend: function (request) {
            request.setRequestHeader("Access-Control-Expose-Headers", "ETag");

        }, success: function (data, status, xhr) {
            eTag = xhr.getResponseHeader('ETag');
            filePartDetails[partNumber]['ETag'] = eTag;
            completeMultipartUpload();
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            showErrorMessage('Upload error: ' + XMLHttpRequest.responseText);
        }
    });

}

function completeMultipartUpload() {
    var parts = "["
    for (key in filePartDetails) {
        if (filePartDetails[key]['ETag'] != '') {
            parts = parts + '{"ETag": ' + filePartDetails[key]['ETag'] + ',"PartNumber":' + key + "}"
            if (key != Object.keys(filePartDetails).length) {
                parts = parts + ","
            }
        }
        else {
            return;
        }

    }
    parts = parts + "]"
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/complete_multipart_upload/",
        data: {
            "file_name": main_file['name'],
            "upload_id": uploadId,
            "parts": parts
        },
        beforeSend: function (xhr, settings) {
            $.ajaxSettings.beforeSend(xhr, settings);
        },
        success: function (result) {
            showSuccessMessage("The File has been successfully Uploaded");
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            showErrorMessage('Upload error: ' + XMLHttpRequest.responseText);
        }
    })
}

function showLoader() {
    $('.success-message').hide();
    $('.error-message').hide();
    $('.loading').show();
    $('.fileupload').hide();
}

function showErrorMessage(message) {
    $('.loading').hide();
    $('.error-message > .alert').html(message);
    $('.error-message').show();
    $('.fileupload').show();
}

function showSuccessMessage(message) {
    $('.loading').hide();
    $('.success-message > .alert').html(message);
    $('.success-message').show();
    $('.fileupload').show();
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);