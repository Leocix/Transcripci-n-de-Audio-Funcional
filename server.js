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

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/tmp', express.static(TMP_DIR));
app.use(express.json());

// Multer for file uploads - Aumentado a 100MB y permitir videos
const upload = multer({ 
  dest: path.join(TMP_DIR, 'uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB
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
  });
});

// Upload endpoint: receives audio or video, extracts audio, transcribes and returns result + download links
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const origPath = req.file.path;
  const outAudio = path.join(TMP_DIR, `${req.file.filename}.wav`);

  // Check if client requested precise timestamps (form field 'precise')
  const usePrecise = req.body && req.body.precise === 'true';

  try {
    // Convert to wav (ffmpeg) to ensure compatibility
    await new Promise((resolve, reject) => {
      ffmpeg(origPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .format('wav')
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(outAudio);
    });

    const result = await transcribeFile(outAudio, { verbose: !!usePrecise });
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
    res.status(500).json({ error: 'Processing failed' });
  }
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
