import express from 'express';
import userRouter from './http/user/userRouter';
import errorMiddleware from './middleware/error.middleware';


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send('Welcome to the BookHub Backend!!!');
});

app.use('/api/users', userRouter);
app.use(errorMiddleware);

export default app;