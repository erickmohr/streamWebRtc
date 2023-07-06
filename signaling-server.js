const clients = new Map(); // Mapa para armazenar os clientes conectados

wss.on('connection', (ws) => {
  // Gerar um identificador único para o cliente
  const clientId = generateClientId();

  // Armazenar o cliente no mapa de clientes
  clients.set(clientId, ws);

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    // Obter o destinatário da mensagem do campo 'recipientId'
    const recipientId = parsedMessage.recipientId;

    // Enviar a mensagem somente para o cliente destinatário
    const recipient = clients.get(recipientId);
    if (recipient && recipient.readyState === WebSocket.OPEN) {
      recipient.send(message);
    }
  });
});
