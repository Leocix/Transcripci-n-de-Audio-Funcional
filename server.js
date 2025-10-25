const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const PDFDocument = require('pdfkit');
const { transcribeFile } = require('./lib/transcribe');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// Map to keep track of websocket clients by clientId (sent from browser)
const wsClients = new Map();

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/tmp', express.static(TMP_DIR));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Multer for file uploads - Aumentado a 200MB y permitir videos
const upload = multer({ 
  dest: path.join(TMP_DIR, 'uploads'),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB máximo por archivo
    files: 1, // Solo 1 archivo a la vez
    fields: 10, // Máximo 10 campos en el form
    fieldSize: 10 * 1024 * 1024, // 10 MB por campo
    parts: 100 // Máximo 100 partes en multipart
  },
  fileFilter: (req, file, cb) => {
    // Permitir audio y video
    const allowedMimes = [
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/flac', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/webm',
      'audio/aac', 'audio/x-aac',
      // Video
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      'video/x-matroska', 'video/webm', 'video/avi'
    ];
    
    const ext = file.originalname.toLowerCase();
    const allowedExts = [
      '.mp3', '.wav', '.flac', '.ogg', '.m4a', '.webm', '.aac',
      '.mp4', '.avi', '.mov', '.mkv', '.mpeg', '.mpg'
    ];
    
    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExt = allowedExts.some(e => ext.endsWith(e));
    
    if (hasValidMime || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Usa: MP3, WAV, FLAC, OGG, M4A, AAC, MP4, AVI, MOV, MKV'));
    }
  }
});

// WebSocket handling for real-time chunks
wss.on('connection', (ws) => {
  const connId = Date.now() + '-' + Math.floor(Math.random() * 10000);
  console.log('WS connected', connId);

  ws.on('message', async (msg) => {
    // Expect JSON messages with type and data
    let parsed;
    try { parsed = JSON.parse(msg); } catch (e) { return; }

    // Allow client to register its clientId so server can send progress updates
    if (parsed.type === 'register' && parsed.clientId) {
      ws.clientId = parsed.clientId;
      wsClients.set(parsed.clientId, ws);
      console.log('WS registered clientId=', parsed.clientId);
      return;
    }

    if (parsed.type === 'chunk' && parsed.data) {
      // data is base64 string of a blob (webm/mp4)
      const b64 = parsed.data.replace(/^data:.+;base64,/, '');
      const filename = path.join(TMP_DIR, `${connId}-${Date.now()}.webm`);
      fs.writeFileSync(filename, Buffer.from(b64, 'base64'));

      // Transcribe this chunk (quick, per-chunk latency depends on API)
      try {
        const result = await transcribeFile(filename, { verbose: false });
        const txt = result && result.text ? result.text : (typeof result === 'string' ? result : '');
        ws.send(JSON.stringify({ type: 'transcript', text: txt || '' }));
      } catch (err) {
        console.error('Transcription error:', err?.message || err);
        ws.send(JSON.stringify({ type: 'error', message: 'Transcription failed' }));
      }

      // Optional: keep or cleanup
      try { fs.unlinkSync(filename); } catch (e) {}
    }
  });

  ws.on('close', () => {
    console.log('WS closed', connId);
    // cleanup mapping if clientId was registered
    if (ws.clientId && wsClients.has(ws.clientId)) {
      wsClients.delete(ws.clientId);
    }
  });
});

// Helper: send progress to client via WS if connected
function sendProgressToClient(clientId, payload) {
  try {
    if (!clientId) return;
    const sock = wsClients.get(clientId);
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ type: 'progress', ...payload }));
    }
  } catch (e) {
    console.warn('Failed to send progress to client', clientId, e?.message || e);
  }
}

// Upload endpoint: receives audio or video, extracts audio, transcribes and returns result + download links
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const origPath = req.file.path;
  const outAudio = path.join(TMP_DIR, `${req.file.filename}.wav`);

  // Check if client requested precise timestamps (form field 'precise')
  const usePrecise = req.body && req.body.precise === 'true';
  
  // Check if client requested automatic speaker detection (form field 'diarize')
  const useDiarization = req.body && req.body.diarize === 'true';

  try {
    // Convert to wav (ffmpeg) to ensure compatibility
    // Notify client (if present) that conversion started
    try { sendProgressToClient(req.body && req.body.clientId, { phase: 'converting', percent: 5, message: 'Convirtiendo archivo a WAV...' }); } catch (e) {}
    await new Promise((resolve, reject) => {
      ffmpeg(origPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .format('wav')
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(outAudio);
    });

    // Intentar transcribir el archivo completo. Si Hugging Face responde 500
    // intentamos un fallback: dividir el audio en chunks y transcribirlos secuencialmente.
    const opts = { verbose: !!usePrecise, diarize: !!useDiarization };
    let result;
    try {
      result = await transcribeFile(outAudio, opts);
    } catch (err) {
      console.error('Transcribe error, intentando fallback por chunks:', err?.message || err);
      // Si es un error del servidor de Hugging Face, hacer split y retranscribir
      const isServerError = err?.response?.status === 500 || (err?.message && err.message.includes('Internal Error'));
      if (isServerError) {
        // Notify client that chunking fallback will start
        try { sendProgressToClient(req.body && req.body.clientId, { phase: 'chunking_start', percent: 10, message: 'Servicio HF falló; dividiendo audio en chunks...' }); } catch (e) {}
        // Crear carpeta temporal para chunks
        const chunkDir = path.join(TMP_DIR, `chunks-${Date.now()}`);
        if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir);

        // Dividir en segmentos de 60s usando ffmpeg (segment)
        await new Promise((resolve, reject) => {
          ffmpeg(outAudio)
            .output(path.join(chunkDir, 'chunk-%03d.wav'))
            .outputOptions(['-f', 'segment', '-segment_time', '60', '-reset_timestamps', '1'])
            .on('end', () => resolve())
            .on('error', (e) => reject(e))
            .run();
        });

        // Leer y ordenar chunks
        const chunkFiles = fs.readdirSync(chunkDir)
          .filter(f => f.endsWith('.wav'))
          .sort();
        let combinedText = '';
        const total = chunkFiles.length;
        for (let i = 0; i < chunkFiles.length; i++) {
          const cf = chunkFiles[i];
          const chunkPath = path.join(chunkDir, cf);
          try {
            // Evitar recursión de chunking: pedimos sin intentar volver a chunkear
            // Notify client about which chunk is being processed
            const percentForChunk = 30 + Math.round(((i + 1) / total) * 50); // map chunks to 30-80
            try { sendProgressToClient(req.body && req.body.clientId, { phase: 'chunk_processing', index: i + 1, total, percent: percentForChunk, message: `Transcribiendo chunk ${i + 1}/${total}...` }); } catch (e) {}

            const r = await transcribeFile(chunkPath, { ...opts, _noChunk: true });
            combinedText += (r && r.text ? r.text + '\n' : '');
            // after successful chunk
            try { sendProgressToClient(req.body && req.body.clientId, { phase: 'chunk_done', index: i + 1, total, percent: percentForChunk, message: `Chunk ${i + 1}/${total} completado` }); } catch (e) {}
          } catch (eChunk) {
            console.error('Error transcribiendo chunk', chunkPath, eChunk?.message || eChunk);
            // If a chunk fails, notify client but continue
            try { sendProgressToClient(req.body && req.body.clientId, { phase: 'chunk_error', index: i + 1, total, percent: 0, message: `Error en chunk ${i + 1}` }); } catch (e) {}
            combinedText += '';
          }
        }

        // Limpieza de chunks
        try {
          for (const cf of fs.readdirSync(chunkDir)) fs.unlinkSync(path.join(chunkDir, cf));
          fs.rmdirSync(chunkDir);
        } catch (cleanupErr) { console.warn('No se pudo limpiar chunkDir', cleanupErr); }
        result = { text: combinedText, segments: null, raw: null };
        // Notify client that chunk combination is happening
        try { sendProgressToClient(req.body && req.body.clientId, { phase: 'combining', percent: 90, message: 'Combinando resultados de chunks...' }); } catch (e) {}
      } else {
        throw err; // Re-lanzar error no relacionado con HF 500
      }
    }
    const transcript = result && result.text ? result.text : '';

    // Prepare simple download files
    const baseName = `transcript-${Date.now()}`;
    const txtPath = path.join(TMP_DIR, `${baseName}.txt`);
    const srtPath = path.join(TMP_DIR, `${baseName}.srt`);
    const vttPath = path.join(TMP_DIR, `${baseName}.vtt`);

    fs.writeFileSync(txtPath, transcript || '');

    // If the transcriber returned segments with timestamps, use them to build precise SRT/VTT
    let srt = '';
    let vtt = 'WEBVTT\n\n';

    if (result && Array.isArray(result.segments) && result.segments.length > 0) {
      result.segments.forEach((seg, i) => {
        const start = seg.start || seg.start_time || 0;
        const end = seg.end || seg.end_time || (start + 2);
        const text = (seg.text || seg.segment || '').trim();

        const fmtSrt = (secs) => {
          const hr = Math.floor(secs / 3600);
          const mm = Math.floor((secs % 3600) / 60);
          const ss = Math.floor(secs % 60);
          return `${String(hr).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')},${String(Math.floor((secs % 1) * 1000)).padStart(3,'0')}`;
        };

        const fmtVtt = (secs) => {
          const hr = Math.floor(secs / 3600);
          const mm = Math.floor((secs % 3600) / 60);
          const ss = Math.floor(secs % 60);
          return `${String(hr).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(Math.floor((secs % 1) * 1000)).padStart(3,'0')}`;
        };

        srt += `${i+1}\n${fmtSrt(start)} --> ${fmtSrt(end)}\n${text}\n\n`;
        vtt += `${fmtVtt(start)} --> ${fmtVtt(end)}\n${text}\n\n`;
      });
    } else {
      // Basic fallback: sentence splitting and estimated timestamps
      const sentences = (transcript || '').split(/(?<=[.?!])\s+/).filter(Boolean);
      let cursor = 0; // seconds
      const avgSecPerSentence = Math.max(1, Math.floor((sentences.length > 0 ? Math.ceil((sentences.join(' ').split(' ').length) / 2) : 1) / 2));
      sentences.forEach((s, i) => {
        const start = cursor;
        const end = cursor + avgSecPerSentence;
        const fmt = (secs) => {
          const hr = Math.floor(secs / 3600);
          const mm = Math.floor((secs % 3600) / 60);
          const ss = secs % 60;
          return `${String(hr).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')},000`;
        };
        srt += `${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${s.trim()}\n\n`;
        const fmtVtt = (secs) => {
          const hr = Math.floor(secs / 3600);
          const mm = Math.floor((secs % 3600) / 60);
          const ss = secs % 60;
          return `${String(hr).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.000`;
        };
        vtt += `${fmtVtt(start)} --> ${fmtVtt(end)}\n${s.trim()}\n\n`;
        cursor = end;
      });
    }

    fs.writeFileSync(srtPath, srt || '');
    fs.writeFileSync(vttPath, vtt || '');

    // Clean up original and converted audio (keeping transcripts)
    try { fs.unlinkSync(origPath); } catch (e) {}
    try { fs.unlinkSync(outAudio); } catch (e) {}

    res.json({
      transcript: transcript || '',
      downloads: {
        txt: `/tmp/${path.basename(txtPath)}`,
        srt: `/tmp/${path.basename(srtPath)}`,
        vtt: `/tmp/${path.basename(vttPath)}`
      }
    });
  } catch (err) {
    console.error('Upload processing error', err);
    
    // Manejar errores de Multer específicamente
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Archivo demasiado grande. Máximo permitido: 200 MB',
        maxSize: '200 MB'
      });
    }
    
    res.status(500).json({ error: 'Processing failed: ' + err.message });
  }
});

// Manejador de errores de Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Archivo demasiado grande',
        message: 'El archivo excede el límite de 200 MB. Comprime el video o divídelo en partes más pequeñas.',
        maxSize: '200 MB'
      });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// PDF generation endpoint
app.post('/generate-pdf', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transcripcion-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20)
       .fillColor('#667eea')
       .text('Transcripción', { align: 'center' })
       .moveDown();

    // Add date
    doc.fontSize(10)
       .fillColor('#666')
       .text(`Fecha: ${new Date().toLocaleString('es-ES')}`, { align: 'center' })
       .moveDown(2);

    // Add content
    doc.fontSize(12)
       .fillColor('#000')
       .text(text, {
         align: 'justify',
         lineGap: 5
       });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
