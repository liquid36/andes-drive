import * as bodyParser from 'body-parser';
import * as HttpStatus from 'http-status-codes';
import { Express } from 'express';
import * as express from 'express';
import { initialize, generateToken } from './auth';
import * as debug from 'debug';
import multer from './multer';

const log = debug('bootstrap');

interface MSRouter extends express.Router {
    group (path: String, callback: (router: MSRouter) => void): void;
    group (callback: (router: MSRouter) => void): void;
}

function MSRouter(): MSRouter {
    let r = express.Router.apply(this, arguments);
    r.group = function (arg1, arg2) {
        let fn, path;
        if (arg2 === undefined) {
            path = '/';
            fn = arg1;
        } else {
            path = arg1;
            fn = arg2;
        }

        let router = MSRouter();
        fn(router);
        this.use(path, router);
        return router;
    };
    return r;
}

export const MulterMiddleware = multer;

export function Router(): express.Router {
    return express.Router();
}

export { Middleware } from './auth';

export class Microservice {
    private _app: Express;
    private _routes: any[] = [];
    private _info: any;
    constructor (info) {
        this._info = info;
    }

    add (router) {
        this._routes.push(router);
    }

    start () {
        const port = process.env.PORT || 3000;
        const app = this._app = express();

        initialize(app);

        // Configura Express
        app.use(bodyParser.json({ limit: '150mb' }));
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.all('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

            // Permitir que el método OPTIONS funcione sin autenticación
            if ('OPTIONS' === req.method) {
                res.header('Access-Control-Max-Age', '1728000');
                res.sendStatus(200);
            } else {
                next();
            }
        });

        app.get('/alive', (_req, res) => {
            res.json({ status: 'OK' });
        });

        app.get('/version', (req, res) => {
            res.json({
                name: this._info.name,
                version: this._info.version
            });
        });

        for (let router of this._routes) {
            app.use(router);
        }

        // Error handler
        app.use((err: any, req: any , res: any, next: any) => {
            if (err) {
                // Parse err
                let e: Error;
                if (!isNaN(err)) {
                    e = new Error(HttpStatus.getStatusText(err));
                    (e as any).status = err;
                    err = e;
                } else {
                    if (typeof err === 'string') {
                        e = new Error(err);
                        (e as any).status = 400;
                        err = e;
                    } else {
                        err.status = 500;
                    }
                }

                // Send response
                res.status(err.status);
                res.send({
                    message: err.message,
                    error: (app.get('env') === 'development') ? err : null
                });
            }
        });

        app.listen(port, () => {
            log(`Listening on port ${port}`);
        });
        return app;
    }

    router() {
        return MSRouter();
    }

    token(uuid) {
        return generateToken(uuid);
    }


}
