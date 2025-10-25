(() => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const changeSpeakerBtn = document.getElementById('changeSpeakerBtn');
  const status = document.getElementById('status');
  const transcriptEl = document.getElementById('transcript');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const formatSelect = document.getElementById('formatSelect');
  const preciseCheckbox = document.getElementById('preciseCheckbox');
  const diarizeCheckbox = document.getElementById('diarizeCheckbox');
  const statusArea = document.getElementById('statusArea');
  const historyEl = document.getElementById('history');
  const fileName = document.getElementById('fileName');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const startRealtimeBtn = document.getElementById('startRealtimeBtn');
  // Ensure progressPhase element exists (in case index.html wasn't updated or is cached)
  let progressPhase = document.getElementById('progressPhase');
  if (!progressPhase) {
    try {
      progressPhase = document.createElement('div');
      progressPhase.id = 'progressPhase';
      progressPhase.style.marginTop = '8px';
      progressPhase.style.fontSize = '13px';
      progressPhase.style.color = '#374151';
      progressPhase.style.display = 'none';
      if (progressContainer && progressContainer.parentNode) {
        progressContainer.parentNode.insertBefore(progressPhase, progressContainer.nextSibling);
      }
    } catch (e) {
      // If DOM manipulation fails, ignore — updateProgress will guard
      console.warn('No se pudo crear progressPhase dinámicamente:', e);
    }
  }
  const speakerInfo = document.getElementById('speakerInfo');
  const currentSpeakerLabel = document.getElementById('currentSpeakerLabel');
  const clearBtn = document.getElementById('clearBtn');
  const numSpeakersSelect = document.getElementById('numSpeakersSelect');

  let mediaRecorder;
  let ws;
  let currentDownloads = null;
  let recognition = null;
  let isUsingWebSpeech = false;
  let currentSpeaker = 1; // Empezar siempre con Persona-01
  let speakerCount = 1;
  let maxSpeakers = 2; // Número máximo de hablantes configurados
  // Unique client id to correlate upload -> websocket updates
  const clientId = 'cli-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
  // processingInterval moved to outer scope so ws messages can cancel it
  let processingInterval = null;
  // Realtime streaming variables
  let wsRealtime = null;
  let audioContext = null;
  let audioStream = null;
  let audioProcessor = null;
  let realtimeActive = false;

  // Función para actualizar UI del hablante
  function updateSpeakerUI() {
    if (currentSpeakerLabel) {
      currentSpeakerLabel.textContent = `Persona-${String(currentSpeaker).padStart(2, '0')}`;
      const colors = ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a'];
      currentSpeakerLabel.style.color = colors[(currentSpeaker - 1) % colors.length];
      currentSpeakerLabel.style.fontWeight = 'bold';
    }
  }
  
  // Botón para limpiar transcripción
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm('¿Estás seguro de que quieres limpiar toda la transcripción?')) {
        transcriptEl.value = '';
        currentSpeaker = 1;
        speakerCount = 1;
        updateSpeakerUI();
        showStatus('🗑️ Transcripción limpiada', 'success');
        setTimeout(hideStatus, 2000);
      }
    };
  }
  
  // Selector de número de hablantes
  if (numSpeakersSelect) {
    numSpeakersSelect.onchange = () => {
      maxSpeakers = parseInt(numSpeakersSelect.value);
      showStatus(`👥 Configurado para ${maxSpeakers} persona${maxSpeakers > 1 ? 's' : ''}`, 'success');
      setTimeout(hideStatus, 2000);
    };
  }
  
  // Botón para cambiar hablante manualmente
  if (changeSpeakerBtn) {
    changeSpeakerBtn.onclick = () => {
      // Ciclar entre los hablantes configurados
      currentSpeaker = (currentSpeaker % maxSpeakers) + 1;
      if (currentSpeaker > speakerCount) {
        speakerCount = currentSpeaker;
      }
      updateSpeakerUI();
      showStatus(`🔄 Cambiado a Persona-${String(currentSpeaker).padStart(2, '0')}`, 'success');
      setTimeout(hideStatus, 2000);
    };
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
          // NO detectar cambio automático - solo usar hablante actual
          const speakerTag = `Persona-${String(currentSpeaker).padStart(2, '0')}`;
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
    // Also show the numeric percent as aria label for accessibility
    progressBar.setAttribute('aria-valuenow', percent);
    const phaseEl = document.getElementById('progressPhase');
    if (phaseEl) phaseEl.style.display = 'block';
  }

  function hideProgress() {
    progressContainer.classList.remove('active');
    progressBar.style.width = '0%';
    const phaseEl = document.getElementById('progressPhase');
    if (phaseEl) {
      phaseEl.style.display = 'none';
      phaseEl.textContent = '';
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Downsample Float32 audio buffer to target sample rate and convert to Int16
  function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
    if (outputSampleRate === inputSampleRate) return buffer;
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  function floatTo16BitPCM(float32Array) {
    const l = float32Array.length;
    const buf = new ArrayBuffer(l * 2);
    const view = new DataView(buf);
    let offset = 0;
    for (let i = 0; i < l; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buf;
  }

  function connectWS() {
    if (!isUsingWebSpeech) {
      ws = new WebSocket(((location.protocol === 'https:')? 'wss://' : 'ws://') + location.host);
      ws.onopen = () => {
        console.log('WS open');
        // Register this page with the server so it can receive progress updates
        try { ws.send(JSON.stringify({ type: 'register', clientId })); } catch (e) {}
        showStatus('Conexión WebSocket establecida', 'success');
        setTimeout(hideStatus, 2000);
      };
      ws.onmessage = (ev) => {
        let parsed;
        try { parsed = JSON.parse(ev.data); } catch (e) { return; }
        // Handle server progress events
        if (parsed.type === 'progress') {
          // Stop simulated processing if running
          if (processingInterval) { clearInterval(processingInterval); processingInterval = null; }
          // Update progress and phase
          const pct = typeof parsed.percent === 'number' ? parsed.percent : null;
          if (pct !== null) updateProgress(Math.min(100, Math.max(0, pct)));
          const phaseEl = document.getElementById('progressPhase');
          if (phaseEl) phaseEl.textContent = parsed.message || (`${parsed.phase || 'Procesando'} ${parsed.index? `${parsed.index}/${parsed.total}`: ''}`);
          return;
        }
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

  // Start realtime ASR: capture mic, resample to 16kHz PCM16 and send via a dedicated WS
  async function startRealtimeASR() {
    if (realtimeActive) return;
    if (!navigator.mediaDevices) {
      showStatus('MediaDevices no soportado en este navegador', 'error');
      return;
    }
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const inputSampleRate = audioContext.sampleRate || 48000;

      const source = audioContext.createMediaStreamSource(audioStream);
      const processorSize = 4096;
      audioProcessor = audioContext.createScriptProcessor(processorSize, 1, 1);

      wsRealtime = new WebSocket(((location.protocol === 'https:') ? 'wss://' : 'ws://') + location.host);
      wsRealtime.binaryType = 'arraybuffer';
      wsRealtime.onopen = () => {
        console.log('WS realtime open');
        wsRealtime.send(JSON.stringify({ type: 'realtime-register', sampleRate: 16000 }));
        showStatus('🔴 Realtime ASR conectado', 'success');
        setTimeout(hideStatus, 1500);
      };
      wsRealtime.onmessage = (ev) => {
        let parsed;
        try { parsed = JSON.parse(ev.data); } catch (e) { return; }
        if (parsed.type === 'realtime-ready') {
          // server ready
          realtimeActive = true;
          startRealtimeBtn.disabled = true;
          stopBtn.disabled = false;
          status.textContent = 'Grabando (Realtime ASR)...';
          status.classList.add('recording');
        }
        if (parsed.type === 'realtime-partial') {
          // show interim in a lighter way (do not commit)
          const last = transcriptEl.value.split('\n').filter(Boolean).slice(-1)[0] || '';
          // show partial as a grey placeholder by updating statusArea
          const tmp = parsed.text || '';
          showStatus('🔁 Interim: ' + tmp, 'info');
        }
        if (parsed.type === 'realtime-final') {
          // append final text
          if (parsed.text) {
            transcriptEl.value += parsed.text + '\n';
          }
          hideStatus();
        }
        if (parsed.type === 'realtime-unavailable') {
          showStatus('Realtime ASR no disponible: ' + (parsed.message || ''), 'error');
        }
      };
      wsRealtime.onerror = (err) => {
        console.error('WS realtime error', err);
        showStatus('Error de conexión realtime', 'error');
      };
      wsRealtime.onclose = () => {
        console.log('WS realtime closed');
        realtimeActive = false;
        startRealtimeBtn.disabled = false;
        stopBtn.disabled = true;
        status.textContent = 'Idle';
        status.classList.remove('recording');
        showStatus('Realtime desconectado', 'info');
      };

      audioProcessor.onaudioprocess = (evt) => {
        if (!wsRealtime || wsRealtime.readyState !== WebSocket.OPEN) return;
        const input = evt.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(input, inputSampleRate, 16000);
        const pcm16 = floatTo16BitPCM(downsampled);
        try {
          wsRealtime.send(pcm16);
        } catch (e) {
          console.warn('Failed to send realtime chunk', e);
        }
      };

      source.connect(audioProcessor);
      audioProcessor.connect(audioContext.destination);

      // keep references to stop later
      audioContext._source = source;
      audioContext._processor = audioProcessor;
      showStatus('🔴 Capturando audio para Realtime ASR...', 'info');
    } catch (e) {
      console.error('Error starting realtime ASR', e);
      showStatus('Error al iniciar Realtime ASR: ' + e.message, 'error');
    }
  }

  function stopRealtimeASR() {
    try {
      if (wsRealtime && wsRealtime.readyState === WebSocket.OPEN) {
        try { wsRealtime.send(JSON.stringify({ type: 'realtime-end' })); } catch (e) {}
        wsRealtime.close();
      }
    } catch (e) {}
    try {
      if (audioContext) {
        if (audioContext._processor) audioContext._processor.disconnect();
        if (audioContext._source) audioContext._source.disconnect();
        audioContext.close();
      }
    } catch (e) {}
    try { if (audioStream) audioStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    audioContext = null; audioStream = null; audioProcessor = null; wsRealtime = null; realtimeActive = false;
    startRealtimeBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = 'Idle';
    status.classList.remove('recording');
    showStatus('Realtime detenido', 'info');
    setTimeout(hideStatus, 1200);
  }

  startBtn.onclick = async () => {
    if (!navigator.mediaDevices) { 
      showStatus('MediaDevices no soportado en este navegador', 'error'); 
      return; 
    }
    
    // Resetear hablantes al iniciar nueva grabación
    currentSpeaker = 1; // Siempre empezar con Persona-01
    speakerCount = 1;
    
    // Priorizar Web Speech API (gratuito)
    if (recognition && isUsingWebSpeech) {
      try {
        recognition.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        changeSpeakerBtn.disabled = false; // Habilitar botón de cambio
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

  // Start realtime button
  if (startRealtimeBtn) {
    startRealtimeBtn.onclick = async () => {
      // If Web Speech API available, user may prefer it — but realtime ASR uses server Vosk
      await startRealtimeASR();
      // disable other start button to avoid conflicts
      startBtn.disabled = true;
    };
  }

  stopBtn.onclick = () => {
    // Detener Web Speech API
    if (recognition && isUsingWebSpeech) {
      recognition.stop();
    }
    
    // Ocultar info del hablante y deshabilitar botón
    if (speakerInfo) {
      speakerInfo.style.display = 'none';
    }
    if (changeSpeakerBtn) {
      changeSpeakerBtn.disabled = true;
    }
    
    // Detener MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    // Stop realtime ASR if active
    try { if (realtimeActive) stopRealtimeASR(); } catch (e) {}
    
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
    fd.append('diarize', diarizeCheckbox.checked ? 'true' : 'false');
  // attach clientId so server can push progress to our WS
  fd.append('clientId', clientId);

    const isDiarizing = diarizeCheckbox.checked;
    showStatus(isDiarizing ? 'Subiendo y detectando hablantes...' : 'Subiendo archivo...', 'info');
    updateProgress(10);
    uploadBtn.disabled = true;
    
    try {
      const xhr = new XMLHttpRequest();

      // Preparación
      updateProgress(3);
      const phaseEl = document.getElementById('progressPhase');
      if (phaseEl) phaseEl.textContent = 'Preparando archivo...';

      // Track upload progress and map to 5% - 55%
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const uploadPercent = Math.round((e.loaded / e.total) * 100);
          // Map 0-100 upload to 5-55 progress
          const mapped = Math.min(55, Math.max(5, Math.round(5 + (uploadPercent * 50) / 100)));
          updateProgress(mapped);
          const mbLoaded = formatBytes(e.loaded);
          const mbTotal = formatBytes(e.total);
          if (phaseEl) phaseEl.textContent = `Subiendo: ${mbLoaded} de ${mbTotal} (${uploadPercent}%)`;
          showStatus(`Subiendo archivo... ${uploadPercent}%`, 'info');
        }
      };

      xhr.onloadstart = () => {
        // Ensure progress container visible
        updateProgress(5);
      };

      xhr.onload = () => {
        // Stop any simulated processing interval
        if (processingInterval) clearInterval(processingInterval);

        if (xhr.status === 200) {
          updateProgress(100);
          if (phaseEl) phaseEl.textContent = 'Combinando resultados y finalizando...';
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
          }, 1600);
        } else {
          hideProgress();
          const errorMsg = xhr.responseText || 'Error en el servidor';

          // Detectar error de archivo muy grande
          if (xhr.status === 413 || errorMsg.includes('too large') || errorMsg.includes('File too large')) {
            showStatus('❌ Archivo demasiado grande. Máximo: 200 MB. Comprime el video o divide el archivo.', 'error');
          } else if (xhr.status === 400) {
            showStatus('❌ Error al procesar el archivo. Verifica el formato.', 'error');
          } else {
            // Si el servidor envía JSON con detalles parciales (por ejemplo progreso por chunks), mostrarlo
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed && parsed.message) {
                showStatus('❌ Error en el servidor: ' + parsed.message, 'error');
              } else {
                showStatus('❌ Error en el servidor: ' + errorMsg, 'error');
              }
            } catch (err) {
              showStatus('❌ Error en el servidor: ' + errorMsg, 'error');
            }
          }
        }
      };

      xhr.onerror = () => {
        if (processingInterval) clearInterval(processingInterval);
        hideProgress();
        showStatus('Error de red durante la subida', 'error');
      };

      xhr.open('POST', '/upload');
      xhr.send(fd);

      // Start a simulated processing progress after upload reaches ~55%.
      // This will animate progress between 56% and 90% until the server responds.
      let simulated = 56;
      processingInterval = setInterval(() => {
        // only animate if current progress below 90
        const current = parseInt(progressBar.style.width) || 0;
        if (current >= 90) return;
        simulated += Math.floor(Math.random() * 3) + 1; // 1..3
        if (simulated > 90) simulated = 90;
        updateProgress(simulated);
        const phaseEl2 = document.getElementById('progressPhase');
        if (phaseEl2) {
          if (isDiarizing) {
            phaseEl2.textContent = `Procesando y detectando hablantes... (${simulated}%)`;
          } else {
            phaseEl2.textContent = `Transcribiendo en servidor... (${simulated}%)`;
          }
        }
      }, 700);

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
