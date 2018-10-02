import { IAdapter } from './IAdapter.interface';
import { Types } from 'mongoose';

export function AndesDriveStoreModel(connection) {
    const gridfs = require('mongoose-gridfs');
    const AndesDriveStoreSchema = gridfs({
        collection: 'AndesDriveStore',
        model: 'AndesDriveStore',
        mongooseConnection: connection
    });
  // obtain a model
    return AndesDriveStoreSchema.model;
}


export class MongoAdapter implements IAdapter {
    public name = 'mongo-adapter';
    private _model;
    private _connection;
    constructor ({ connection }) {
        this._connection = connection;
    }

    model() {
        if (!this._model) {
            this._model = AndesDriveStoreModel(this._connection);
        }
        return this._model;
    }

    write (stream: NodeJS.WriteStream): Promise<string> {
        return new Promise((resolve, reject) => {
            const objId = new Types.ObjectId();
            const dto = {
                _id: objId,
                filename: String(objId)
            };
            this.model().write(dto, stream, (error, createdFile) => {
                if (error) {
                    return reject(error);
                }
                return resolve(createdFile._id);
            });
        });
    }

    read(uuid: string): Promise<NodeJS.ReadStream> {
        return new Promise((resolve, reject) => {
            const reader = this.model().readById(uuid);
            return resolve(reader);
        });
    }

    delete (uuid: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.model().unlinkById(uuid, (error, unlinkedAttachment) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }
}
