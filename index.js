const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs/promises');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

const getTalkers = async () => {
  const talkers = JSON.parse(await fs.readFile('./talker.json', 'utf8'));
  return talkers;
};

app.get('/talker', async (req, res) => {
    const talkers = await getTalkers();
    if (!talkers) {
      return res.status(200).json([]);
    }
    res.status(200).json(talkers);
});

app.listen(PORT, () => {
  console.log('Online');
});
