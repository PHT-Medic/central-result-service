import 'reflect-metadata';
import dotenv from 'dotenv';
import env from './env';
import createConfig from './config';
import createExpressApp from './config/http/express';
import createHttpServer from './config/http/server';

dotenv.config();

//--------------------------------------------------------------------
// HTTP Server & Express App
//--------------------------------------------------------------------
const config = createConfig({ env });
const expressApp = createExpressApp({ config, env });
const httpServer = createHttpServer({ expressApp });

//--------------------------------------------------------------------
// Start Server
//--------------------------------------------------------------------

function signalStart() {
    // eslint-disable-next-line no-console
    console.table([
        ['Port', env.port],
        ['Environment', env.env],
    ]);
}

function start() {
    config.components.forEach((c) => c.start());
    config.aggregators.forEach((a) => a.start());

    httpServer.listen(env.port, signalStart);
}

start();
