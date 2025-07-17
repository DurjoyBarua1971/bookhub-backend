import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to the BookHub Backend!!!');
});

export default app;