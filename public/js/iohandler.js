function handleData(data) {
    console.log("handleData called with data: " + data);
}

function recvFileName(data) {
    console.log("filename received: " + data);
    $("#heading").text(data);
}

window.onload = function() {
    var socket = io.connect('http://localhost:8080');
    var content = document.getElementById("content");

    socket.on('data:filename', recvFileName);
    socket.emit('client:ready');
}
