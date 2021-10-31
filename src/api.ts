import express from 'express';

const app = express();
const port = 3000;

app.listen(port, () => {
    console.log(`App is running, listening on port: ${port}`);
});

app.get('/users', function (req, res) {
    res.send('requested users');
});
