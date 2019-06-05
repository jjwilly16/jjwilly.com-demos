const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}));

app.use('/', express.static(path.join(__dirname, './dist')));

app.use(require('./server/routes'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Listening on port %s', port);
});
