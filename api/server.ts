import * as bodyParser from 'body-parser';
import router from './routes';

const app = require('express')();
const port = 3001;

app.use(bodyParser.json());
app.use(router);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

