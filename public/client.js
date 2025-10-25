(() => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');
  const transcriptEl = document.getElementById('transcript');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const formatSelect = document.getElementById('formatSelect');
  const preciseCheckbox = document.getElementById('preciseCheckbox');
  const statusArea = document.getElementById('statusArea');
  const historyEl = document.getElementById('history');
  const fileName = document.getElementById('fileName');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');

  let mediaRecorder;
  let ws;
  let currentDownloads = null;
  let recognition = null;
  let isUsingWebSpeech = false;
  let currentSpeaker = 1; // Empezar siempre con Persona-01
  let speakerCount = 1;
  let lastSpeakTime = 0;
  let speakerHistory = []; // Historial de frases por hablante
  const SPEAKER_CHANGE_THRESHOLD = 8000; // 8 segundos para cambiar de hablante (más tiempo)
  const MIN_WORDS_FOR_CHANGE = 15; // Mínimo de palabras antes de considerar cambio
  
  // Elementos adicionales
  const speakerInfo = document.getElementById('speakerInfo');
  const currentSpeakerLabel = document.getElementById('currentSpeakerLabel');

  // Función para actualizar UI del hablante
  function updateSpeakerUI() {
    if (currentSpeakerLabel) {
      currentSpeakerLabel.textContent = `Persona-${String(currentSpeaker).padStart(2, '0')}`;
      currentSpeakerLabel.style.color = currentSpeaker === 1 ? '#667eea' : currentSpeaker === 2 ? '#f5576c' : '#4facfe';
    }
  }

  // Función mejorada para detectar cambio de hablante
  function detectSpeakerChange(transcript) {
    const now = Date.now();
    const timeSinceLastSpeak = now - lastSpeakTime;
    const wordCount = transcript.trim().split(/\s+/).length;
    
    // Si es la primera frase, usar Persona-01
    if (speakerHistory.length === 0) {
      currentSpeaker = 1;
      lastSpeakTime = now;
      return false; // No cambiar
    }
    
    // Solo considerar cambio si:
    // 1. Han pasado más de 8 segundos
    // 2. Y la frase tiene suficientes palabras (indica intervención completa)
    if (timeSinceLastSpeak > SPEAKER_CHANGE_THRESHOLD && wordCount >= MIN_WORDS_FOR_CHANGE) {
      // Alternar entre personas (máximo 3)
      const lastSpeaker = currentSpeaker;
      currentSpeaker = (currentSpeaker % 3) + 1;
      
      if (currentSpeaker > speakerCount) {
        speakerCount = currentSpeaker;
      }
      
      lastSpeakTime = now;
      return true; // Hubo cambio
    }
    
    lastSpeakTime = now;
    return false; // Mismo hablante
  }

  // Detectar navegador
  function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Brave')) return 'Brave';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Unknown';
  }

  const browserName = detectBrowser();
  console.log('Navegador detectado:', browserName);

  // Detectar si el navegador soporta Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition && browserName !== 'Brave') {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const changed = detectSpeakerChange(transcript);
          
          if (changed) {
            updateSpeakerUI(); // Actualizar UI cuando cambia
          }
          
          const speakerTag = `Persona-${String(currentSpeaker).padStart(2, '0')}`;
          
          // Guardar en historial
          speakerHistory.push({
            speaker: currentSpeaker,
            text: transcript,
            timestamp: Date.now()
          });
          
          finalTranscript += `[${speakerTag}] ${transcript}\n`;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        transcriptEl.value += finalTranscript;
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        showStatus('No se detectó voz. Habla más cerca del micrófono.', 'error');
      } else if (event.error === 'not-allowed') {
        showStatus('Permiso denegado. Permite el acceso al micrófono en la configuración del navegador.', 'error');
      } else {
        showStatus('Error: ' + event.error, 'error');
      }
    };
    
    recognition.onend = () => {
      if (isUsingWebSpeech && !stopBtn.disabled) {
        try {
          recognition.start();
        } catch (e) {
          console.log('No se pudo reiniciar el reconocimiento');
        }
      }
    };
    
    isUsingWebSpeech = true;
    console.log('✅ Web Speech API disponible');
  } else {
    if (browserName === 'Brave') {
      console.warn('⚠️ Brave desactiva Web Speech API por privacidad');
      showStatus('⚠️ Brave no soporta grabación en tiempo real. Usa Chrome, Edge o sube archivos con Hugging Face.', 'error');
    } else {
      console.warn('⚠️ Web Speech API no disponible en este navegador');
      showStatus('⚠️ Tu navegador no soporta grabación en tiempo real. Usa Chrome o Edge, o sube archivos.', 'error');
    }
  }

  // Show file name when selected
  fileInput.onchange = () => {
    if (fileInput.files[0]) {
      fileName.textContent = fileInput.files[0].name;
    } else {
      fileName.textContent = '';
    }
  };

  function showStatus(message, type = 'info') {
    statusArea.textContent = message;
    statusArea.className = `active ${type}`;
  }

  function hideStatus() {
    statusArea.className = '';
  }

  function updateProgress(percent) {
    progressContainer.classList.add('active');
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }

  function hideProgress() {
    progressContainer.classList.remove('active');
    progressBar.style.width = '0%';
  }

  function connectWS() {
    if (!isUsingWebSpeech) {
      ws = new WebSocket(((location.protocol === 'https:')? 'wss://' : 'ws://') + location.host);
      ws.onopen = () => {
        console.log('WS open');
        showStatus('Conexión WebSocket establecida', 'success');
        setTimeout(hideStatus, 2000);
      };
      ws.onmessage = (ev) => {
        let parsed;
        try { parsed = JSON.parse(ev.data); } catch (e) { return; }
        if (parsed.type === 'transcript') {
          transcriptEl.value += parsed.text + '\n';
        }
        if (parsed.type === 'error') {
          console.error(parsed.message);
          showStatus('Error en la transcripción: ' + parsed.message, 'error');
        }
      };
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        showStatus('Error de conexión WebSocket', 'error');
      };
      ws.onclose = () => {
        console.log('WS closed');
        showStatus('Conexión WebSocket cerrada', 'error');
      };
    }
  }

  startBtn.onclick = async () => {
    if (!navigator.mediaDevices) { 
      showStatus('MediaDevices no soportado en este navegador', 'error'); 
      return; 
    }
    
    // Resetear hablantes al iniciar nueva grabación
    currentSpeaker = 1; // Siempre empezar con Persona-01
    speakerCount = 1;
    speakerHistory = [];
    lastSpeakTime = Date.now();
    
    // Priorizar Web Speech API (gratuito)
    if (recognition && isUsingWebSpeech) {
      try {
        recognition.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = 'Grabando (Reconocimiento gratuito)...';
        status.classList.add('recording');
        
        // Mostrar info del hablante
        if (speakerInfo) {
          speakerInfo.style.display = 'block';
          updateSpeakerUI();
        }
        
        showStatus('🎤 Usando reconocimiento de voz GRATUITO del navegador', 'success');
        setTimeout(hideStatus, 3000);
        return;
      } catch (err) {
        console.error('Error al iniciar Web Speech API:', err);
        showStatus('Intentando método alternativo...', 'info');
      }
    }
    
    // Fallback: usar servidor (requiere OpenAI)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      if (!ws || ws.readyState !== WebSocket.OPEN) connectWS();

      mediaRecorder.ondataavailable = (e) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'chunk', data: base64 }));
          }
        };
        reader.readAsDataURL(e.data);
      };

      mediaRecorder.start(2000);
      startBtn.disabled = true;
      stopBtn.disabled = false;
      status.textContent = 'Grabando (Servidor)...';
      status.classList.add('recording');
      showStatus('⚠️ Usando servidor (requiere OpenAI API Key)', 'info');
      setTimeout(hideStatus, 3000);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      showStatus('Error al acceder al micrófono: ' + err.message, 'error');
    }
  };

  stopBtn.onclick = () => {
    // Detener Web Speech API
    if (recognition && isUsingWebSpeech) {
      recognition.stop();
    }
    
    // Ocultar info del hablante
    if (speakerInfo) {
      speakerInfo.style.display = 'none';
    }
    
    // Detener MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = 'Idle';
    status.classList.remove('recording');
    showStatus('Grabación detenida', 'info');
    setTimeout(hideStatus, 2000);
  };

  uploadBtn.onclick = async () => {
    const file = fileInput.files[0];
    if (!file) { 
      showStatus('Por favor selecciona un archivo', 'error'); 
      return; 
    }
    
    const fd = new FormData();
    fd.append('file', file);
    fd.append('precise', preciseCheckbox.checked ? 'true' : 'false');

    showStatus('Subiendo archivo...', 'info');
    updateProgress(10);
    uploadBtn.disabled = true;
    
    try {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 50);
          updateProgress(percentComplete);
          showStatus(`Subiendo archivo... ${percentComplete}%`, 'info');
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          updateProgress(100);
          showStatus('Archivo procesado correctamente', 'success');
          
          const json = JSON.parse(xhr.responseText);
          if (json.transcript) {
            transcriptEl.value = json.transcript;
          }
          
          // Store downloads for later
          currentDownloads = json.downloads;
          
          // Add to history
          const li = document.createElement('li');
          const date = new Date().toLocaleString('es-ES');
          const preview = json.transcript ? json.transcript.slice(0, 80).replace(/\n/g, ' ') + '...' : 'Sin transcripción';
          li.innerHTML = `<strong>${date}</strong><br>${preview}`;
          li.onclick = () => {
            transcriptEl.value = json.transcript || '';
            currentDownloads = json.downloads;
          };
          historyEl.prepend(li);
          
          setTimeout(() => {
            hideProgress();
            hideStatus();
          }, 2000);
        } else {
          throw new Error('Error en el servidor');
        }
      };
      
      xhr.onerror = () => {
        throw new Error('Error de red');
      };
      
      xhr.open('POST', '/upload');
      xhr.send(fd);
      
      // Simulate processing progress
      updateProgress(50);
      showStatus('Procesando y transcribiendo...', 'info');
      
    } catch (e) {
      console.error(e);
      showStatus('Error al subir o procesar: ' + e.message, 'error');
      hideProgress();
    } finally {
      uploadBtn.disabled = false;
    }
  };

  downloadBtn.onclick = () => {
    const fmt = formatSelect.value;
    const text = transcriptEl.value;
    
    if (!text) {
      showStatus('No hay transcripción para descargar', 'error');
      return;
    }
    
    if (fmt === 'pdf') {
      showStatus('Generando PDF...', 'info');
      
      fetch('/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      .then(res => {
        if (!res.ok) throw new Error('Error al generar PDF');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcripcion-${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        showStatus('PDF descargado correctamente', 'success');
        setTimeout(hideStatus, 2000);
      })
      .catch(err => {
        console.error(err);
        showStatus('Error al generar PDF: ' + err.message, 'error');
      });
    } else if (fmt === 'txt') {
      // Descargar TXT directamente desde el textarea
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcripcion-${Date.now()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      showStatus('TXT descargado correctamente', 'success');
      setTimeout(hideStatus, 2000);
    } else {
      // Para SRT y VTT, usar downloads del servidor si están disponibles
      if (currentDownloads) {
        if (fmt === 'srt' && currentDownloads.srt) window.open(currentDownloads.srt, '_blank');
        if (fmt === 'vtt' && currentDownloads.vtt) window.open(currentDownloads.vtt, '_blank');
      } else {
        showStatus('No hay archivo procesado en el servidor', 'error');
      }
    }
  };

  // initial WS connect
  connectWS();
})();
