// Configurar variáveis
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let localStream;
let remoteStream;
let localPeerConnection;
let remotePeerConnection;

// Configuração do servidor de sinalização
const signalingServerUrl = 'ws://localhost:8888'; // URL do servidor de sinalização
const signalingSocket = new WebSocket(signalingServerUrl);

signalingSocket.onmessage = async (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'offer') {
    // Receber oferta SDP do outro navegador
    await receiveOffer(message.offer);
  } else if (message.type === 'answer') {
    // Receber resposta SDP do outro navegador
    await receiveAnswer(message.answer);
  } else if (message.type === 'iceCandidate') {
    // Receber candidato ICE do outro navegador
    await addIceCandidate(message.candidate);
  }
};

// Função para inicializar a conexão WebRTC
async function initialize() {
  try {
    // Obter acesso à câmera e ao microfone do usuário
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Exibir visualização do vídeo local
    localVideo.srcObject = localStream;

    // Criar objeto RTCPeerConnection para conexão local
    localPeerConnection = new RTCPeerConnection();

    // Adicionar faixa de mídia local à conexão local
    localStream.getTracks().forEach((track) => {
      localPeerConnection.addTrack(track, localStream);
    });

    // Criar objeto RTCPeerConnection para conexão remota
    remotePeerConnection = new RTCPeerConnection();

    // Adicionar evento de callback para lidar com chegada de faixas de mídia remotas
    remotePeerConnection.ontrack = (event) => {
      // Adicionar faixa de mídia remota à visualização de vídeo remoto
      remoteStream = event.streams[0];
      remoteVideo.srcObject = remoteStream;
    };

    // Adicionar evento de callback para lidar com chegada de candidatos ICE da conexão local
    localPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Enviar candidato ICE para o outro navegador através do servidor de sinalização
        sendIceCandidate(event.candidate);
      }
    };

    // Criar oferta SDP na conexão local
    const offer = await localPeerConnection.createOffer();

    // Configurar oferta local como descrição local
    await localPeerConnection.setLocalDescription(offer);

    // Enviar oferta para o outro navegador atravésdo servidor de sinalização
    sendOffer(localPeerConnection.localDescription);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para receber oferta SDP do outro navegador
async function receiveOffer(offer) {
  try {
    // Configurar oferta remota na conexão remota
    await remotePeerConnection.setRemoteDescription(offer);

    // Criar resposta SDP na conexão remota
    const answer = await remotePeerConnection.createAnswer();

    // Configurar resposta remota como descrição remota
    await remotePeerConnection.setLocalDescription(answer);

    // Enviar resposta para o outro navegador através do servidor de sinalização
    sendAnswer(remotePeerConnection.localDescription);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para receber resposta SDP do outro navegador
async function receiveAnswer(answer) {
  try {
    // Configurar resposta remota na conexão local
    await localPeerConnection.setRemoteDescription(answer);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para adicionar candidato ICE à conexão remota
async function addIceCandidate(candidate) {
  try {
    await remotePeerConnection.addIceCandidate(candidate);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para enviar oferta SDP para o outro navegador através do servidor de sinalização
function sendOffer(offer) {
  const message = {
    type: 'offer',
    offer: offer,
    recipientId: 'server' // Identificador único do servidor
  };
  signalingSocket.send(JSON.stringify(message));
}

// Função para enviar resposta SDP para o outro navegador através do servidor de sinalização
function sendAnswer(answer) {
  const message = {
    type: 'answer',
    answer: answer,
    recipientId: 'client' // Identificador único do cliente
  };
  signalingSocket.send(JSON.stringify(message));
}


// Função para enviar candidato ICE para o outro navegador através do servidor de sinalização
function sendIceCandidate(candidate) {
  const message = {
    type: 'iceCandidate',
    candidate: candidate
  };
  signalingSocket.send(JSON.stringify(message));
}

// Inicializar a conexão WebRTC quando a página for carregada
window.onload = initialize;

