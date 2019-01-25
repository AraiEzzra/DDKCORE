import { app } from './app';

const env = process.env;

const defaultPort = 3000;
const port = env.SERVER_CORE ? env.SERVER_CORE : defaultPort;

app.listen(port, () => {
    console.log(`Core. Listening on port ${port}`);
});
