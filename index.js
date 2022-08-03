const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';
const errorMessage = { message: 'Pessoa palestrante não encontrada' };
const emailValidation = /^\w+(\[\+\.-\]?\w)*@\w+(\[\.-\]?\w+)*\.[a-z]+$/i;

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

const getTalkers = async () => {
  const talkers = JSON.parse(await fs.readFile('./talker.json', 'utf8'));
  return talkers;
};

const routerTalker = async (req, res) => {
  const talkers = await getTalkers();
  if (talkers) {
    return res.status(200).json(talkers);
  }
  return res.status(200).json([]);
};

app.get('/talker', routerTalker);

const routerTalkerId = async (req, res) => {
  const { id } = req.params;
  const talkers = await getTalkers();
  const idTalker = talkers.find((talker) => talker.id === Number(id));
  if (idTalker) {
    return res.status(200).json(idTalker);
  }
  res.status(404).json(errorMessage);
};

app.get('/talker/:id', routerTalkerId);

const generateToken = () => {
  const tokenId = crypto.randomBytes(8).toString('hex');
  return { token: tokenId };
};

const postEmailPassword = (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  }
  if (!emailValidation.test(email)) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  if (!password) {
    return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  res.status(200).json(generateToken());
};

app.post('/login', postEmailPassword);

app.listen(PORT, () => {
  console.log('Online');
});
