import { Microservice, MulterMiddleware, Middleware } from './bootstrap';
import { Connections, FileDescriptor, IFileDescriptor } from './file-descriptor';
import { FileAdapter, MongoAdapter, SeaweedAdapter } from './adapters';

import * as mongoose from 'mongoose';

/**
 * ENV VARIABLES
 *
 * PORT: Puerto de app
 * NODE_ENV: environment de uso
 * JWT_KEY: Secret JWT
 * JWT_EXPIRES: tiempo de vencimiento del token generado
 * MONGO_HOST: url para conectarse a mongo
 *
 * FILE_PATH: Path del FileAdapter
 * SEAWEED_HOST: Host de seaweedFS
 * SEAWEED_PORT: Puerto de seaweedFS
 */

Connections.initialize();
const ms = new Microservice(require('./package.json'));


const adapterName = process.env.DEFAULT_ADAPTER || 'file';
let _adapter;
switch (adapterName) {
    case 'file':
        _adapter = new FileAdapter({ folder: process.env.FILE_PATH || './' });
        break;
    case 'mongo':
        _adapter = new MongoAdapter({ connection: mongoose.connection });
        break;
    case 'seaweed':
        const server = process.env.SEAWEED_HOST || '127.0.0.1';
        const port = process.env.SEAWEED_PORT || '9333';
        _adapter = new SeaweedAdapter({ port, server });
        break;
}

const upload = MulterMiddleware(_adapter);

const router = ms.router();
router.group('/drive', (route) => {

    route.use(Middleware.authenticate());
    /**
     * Get simple token
     */
    route.post('/token', (req, res, next) => {
        const uuid = req.query.uuid;
        const token = ms.token(uuid);
        res.send({ token });
    });

    /**
     * Create new file description multi-part upload
     */

    route.post('/', upload.single('file'), async (req: any, res, next) => {
        try {
            const file = req.file;
            const data: IFileDescriptor = {
                real_id: file.id,
                adapter: file.adapter,
                originalname: file.originalname,
                mimetype: file.mimetype
            };
            const fd = await FileDescriptor.create(data);
            if (fd) {
                return res.send({ id: fd.uuid });
            }
            return next(422);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Two-face upload
     */

    route.post('/assign', async (req: any, res, next) => {
        try {
            const body = req.body;
            const data: IFileDescriptor = {
                originalname: body.originalname,
                mimetype: body.mimetype
            };
            const fd = await FileDescriptor.create(data);
            if (fd) {
                return res.send({ id: fd.uuid });
            }
            return next(422);
        } catch (err) {
            next(err);
        }
    });

    route.put('/:uuid', async (req: any, res, next) => {
        try {
            const uuid = req.params.uuid;
            const real_id = await _adapter.write(req);
            await FileDescriptor.update(uuid, { real_id, adapter: _adapter.name });
            return res.json({ status: 'OK' });
        } catch (err) {
            return next(err);
        }
    });

    /**
     * GET FILE
     */

    route.get('/:uuid', async (req: any, res, next) => {
        const uuid = req.params.uuid;
        const token = req.user;
        if (!token || !token.uuid || token.uuid !== uuid) {
            return next(403);
        }
        const fd = await FileDescriptor.find(uuid);
        if (fd) {
            const stream = await _adapter.read(fd.real_id);
            res.writeHead(200, {
                'Content-Type': fd.mimetype.toString(),
                'Content-Disposition': `attachment; filename=${fd.originalname}`
            });
            stream.pipe(res);
        }
    });
});

ms.add(router);
ms.start();
