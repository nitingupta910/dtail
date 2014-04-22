var view;

function recvFileName(fname) {
    console.log("filename received: " + fname);
    $("#heading").text(fname);
}

function recvData(data) {
    //console.log(data);
    view.append(data + "<br />");
}

window.onload = function() {
    var socket = io.connect('http://localhost:8080');
    view = $("#content");

    socket.on('data:filename', recvFileName);
    socket.on('data', recvData)
    socket.emit('client:ready');
}
