const { sequelize, Testimony } = require('./models/testimony');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    });

    const {
      name,
      date,
      phone,
      nextOfKin,
      nextOfKinContact,
      area,
      problem,
      duration,
      currentState,
      healingMode,
      officialName,
      officialNumber,
    } = req.body;

    const newTestimony = await Testimony.create({
      name,
      date,
      phone,
      nextOfKin,
      nextOfKinContact,
      area,
      problem,
      duration,
      currentState,
      healingMode,
      officialName,
      officialNumber,
      transcript: transcription.text,
      audioFile: req.file.filename,
    });

    res.json({ transcript: transcription.text, status: 'saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to transcribe and save testimony' });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
