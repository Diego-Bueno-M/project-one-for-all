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
const dataValidation = /^(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[012])[/-]\d{4}$/;

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

const checkToken = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: 'Token não encontrado' });
  }
  if (authorization.length < 16) {
    return res.status(401).json({ message: 'Token inválido' });
  }
  next();
};

const searchTalker = async (req, res) => {
  const { q } = req.query;
  const talkers = await getTalkers();
  if (!q || q.length === 0) {
    return res.status(200).json(talkers);
  }
  const searchedTalker = talkers.filter((talker) => talker.name.includes(q));

  // if (talker.length === 0 || !talker) {
  //   return res.status(200).json([]);
  // }
  return res.status(200).json(searchedTalker);
};

app.get('/talker/search', checkToken, searchTalker);

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

const checkName = (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'O campo "name" é obrigatório' });
  }
  if (name.length < 3) {
    return res.status(400).json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }
  next();
};

const checkAge = (req, res, next) => {
  const { age } = req.body;
  if (!age) {
    return res.status(400).json({ message: 'O campo "age" é obrigatório' });
  }
  if (age < 18) {
    return res.status(400).json({ message: 'A pessoa palestrante deve ser maior de idade' });
  }
  next();
};

const checkTalkWatchedAt = (req, res, next) => {
  const { talk } = req.body;
  const { watchedAt } = talk;
  if (!watchedAt) {
    return res.status(400).json({ message: 'O campo "watchedAt" é obrigatório' });
  }
  if (!dataValidation.test(watchedAt)) {
    return res.status(400).json({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  next();
};
const checkTalkRate = (req, res, next) => {
  const { talk } = req.body;
  const { rate } = talk;
  if (rate < 1 || rate > 5) {
    return res.status(400).json({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
  }
  if (!rate) {
    return res.status(400).json({ message: 'O campo "rate" é obrigatório' });
  }
  next();
};

const checkTalk = (req, res, next) => {
  const { talk } = req.body;
  if (!talk) {
    return res.status(400).json({ message: 'O campo "talk" é obrigatório' });
  }

  next();
};

const postTalker = async (req, res) => {
  const { name, age, talk } = req.body;
  const talkers = await getTalkers();
  const newTalker = { name, age, id: talkers.length + 1, talk };
    res.status(201).send(newTalker);
    talkers.push(newTalker);
    fs.writeFile('./talker.json', JSON.stringify(talkers));
  };

app.post('/talker',
  checkToken, checkName, checkAge, checkTalk, checkTalkWatchedAt, checkTalkRate, postTalker);

const putTalker = async (req, res) => {
  const { id } = req.params;
  const { name, age, talk } = req.body;
  const talkers = await getTalkers();
  const newTalker = { name, age, id: Number(id), talk };
  talkers[id - 1] = newTalker;
  res.status(200).send(newTalker);
  talkers.push(newTalker);
  fs.writeFile('./talker.json', JSON.stringify(talkers));
};

app.put('/talker/:id',
  checkToken, checkName, checkAge, checkTalk, checkTalkWatchedAt, checkTalkRate, putTalker);

const deleteTalker = async (req, res) => {
  const { id } = req.params;
  const talkers = await getTalkers();
  const talkerIndex = talkers.findIndex((r) => r.id === Number(id));

  talkers.splice(talkerIndex, 1);
  res.status(204).end();
  fs.writeFile('./talker.json', JSON.stringify(talkers));
};

app.delete('/talker/:id', checkToken, deleteTalker);

app.listen(PORT, () => {
  console.log('Online');
});
