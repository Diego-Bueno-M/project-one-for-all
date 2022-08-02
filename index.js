const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs/promises');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';
const errorMessage = { message: 'Pessoa palestrante não encontrada' };

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

app.listen(PORT, () => {
  console.log('Online');
});
