import express from 'express';
import mongoose from 'mongoose';
import { MONGOOSE_URI } from './helpers/populate_db';
import { router as routes } from './routes';

const app = express();
const port = 3000;

app.use('/api', routes);

mongoose.connect(MONGOOSE_URI);
mongoose.connection.on('error', (err) => {
    console.log('err', err);
});
mongoose.connection.on('connected', (err, res) => {
    console.log('mongoose is connected');
});

app.listen(port, () => {
    console.log(`App is running, listening on port: ${port}`);
});
