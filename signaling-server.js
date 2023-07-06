const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8888 });

wss.on('listening', () => {
  console.log('Servidor de sinalização iniciado na porta');
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Reenviar mensagem para todos os clientes conectados
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Enviar mensagem com informações sobre o vídeo a ser exibido
        const videoMessage = {
          type: 'video',
          videoStream: message
        };
        client.send(JSON.stringify(videoMessage));
      }
    });
  });
});
