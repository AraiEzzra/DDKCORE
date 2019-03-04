import bodyParser = require('body-parser');

const app = require('express')();
const server = require('http').createServer(app);
const redis = require('redis');
const io = require('socket.io')(server, {
    serveClient: false,
    wsEngine: 'ws',
    pingTimeout: 30000,
    pingInterval: 30000,
});
const cors = require('cors');
const port = process.env.API_PORT || 4601;

app.use(bodyParser.json());
app.use(cors());
io.on('connect', onConnect);
server.listen(port, () => console.log('API server is listening on port ' + port));

function onConnect(socket: any) {
    console.log('Socket %s connected', socket);

    socket.on('api_message', function (json: string) {
        onApiMessage(json, socket);
    });

    socket.on('core_message', function (json: string) {
        onCoreMessage(json, socket);
    });
}

async function onCoreMessage(json: string, socket: any) {
    console.log('onMessage here');
}

async function onApiMessage(json: string, socket: any) {
    console.log('onMessage here');
}
