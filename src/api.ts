import express from 'express';

const app = express();
const port = 3000;

const unuser_var = 20




app.listen(port, () => {
    console.log(`App is running, listening on port: ${port}`);
});



app.get('/users', function (req, res) {
    res.send('requested users');
});
