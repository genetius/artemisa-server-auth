import { Injector } from '@piros/ioc';

import { Application } from '../lib';
import { AuthController } from './controller/auth-controller';

const injector = new Injector();

setTimeout(() => {

    new Application({
        controllers: [
            AuthController,
        ]
    }, injector).start(<any>process.env.LISTEN_PORT);

}, 1000);
