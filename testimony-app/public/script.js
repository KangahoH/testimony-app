let recognition;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const startBtn = document.getElementById('startRecording');
const stopBtn = document.getElementById('stopRecording');
const recordingStatus = document.getElementById('recordingStatus');
const testimonyField = document.getElementById('testimony');
const timer = document.getElementById('timer');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const downloadLink = document.getElementById('downloadLink');

let seconds = 0;
let timerInterval;
let animationId;
let analyser, dataArray;

// Timer Functions
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timer.textContent = `⏱️ ${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timer.textContent = '⏱️ 00:00';
}

// Waveform Visualization
function drawWaveform() {
  animationId = requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'lime';
  ctx.beginPath();

  let sliceWidth = canvas.width / dataArray.length;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    let v = dataArray[i] / 128.0;
    let y = (v * canvas.height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

// Setup Speech Recognition (Web Speech API)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
    testimonyField.value += ' ' + transcript;
  };

  recognition.onerror = (e) => {
    console.error('Speech error:', e);
    recordingStatus.textContent = `⚠️ Error: ${e.error}`;
  };
} else {
  alert("Speech Recognition not supported.");
}

// Start Recording
startBtn.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Speech recognition
  recognition?.start();

  // Audio Recorder
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  audioChunks = [];

  mediaRecorder.ondataavailable = (e) => {
    audioChunks.push(e.data);
  };

  // Timer + Status
  isRecording = true;
  recordingStatus.textContent = "🎙️ Recording... speak now";
  startBtn.disabled = true;
  stopBtn.disabled = false;
  startTimer();

  // Visualize
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  drawWaveform();
});

// Stop Recording
stopBtn.addEventListener('click', () => {
  if (!isRecording) return;

// Stop recognition + media recorder
recognition?.stop();
mediaRecorder?.stop();

mediaRecorder.onstop = async () => {
  // Collect all form fields along with the audio
  const form = document.getElementById('testimonyForm');
  const formData = new FormData(form);
  const blob = new Blob(audioChunks, { type: 'audio/webm' });
  formData.append('audio', blob, 'testimony.webm');

  try {
    recordingStatus.textContent = '🧠 Transcribing with Whisper...';

    const response = await fetch('/transcribe', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    testimonyField.value += '\n\n' + result.transcript;
    recordingStatus.textContent = '✅ Transcription complete';
  } catch (error) {
    console.error(error);
    recordingStatus.textContent = '❌ Transcription failed.';
  }

  // Enable download link
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = `testimony-${Date.now()}.webm`;
  downloadLink.classList.remove('hidden');
  downloadLink.textContent = '⬇️ Download Audio';
};


  stopTimer();
  cancelAnimationFrame(animationId);
  recordingStatus.textContent = "🛑 Recording stopped.";
  startBtn.disabled = false;
  stopBtn.disabled = true;
  isRecording = false;
});
