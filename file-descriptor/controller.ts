import { FileDescriptorModel } from './schemas';
const ObjectID = require('bson-objectid');

export class FileDescriptor {
    constructor () {

    }

    public static async create(data) {
        // [TODO] Add some validation
        const fd = new FileDescriptorModel(data);
        fd.uuid = ObjectID();
        return fd.save();
    }

    public static async update(uuid, data) {
        const fd = await this.find(uuid);
        fd.real_id = data.real_id;
        fd.adapter = data.adapter;
        return fd.save();
    }

    public static async find(id) {
        // [TODO] Add some validation
        const files = await FileDescriptorModel.find({ uuid: id });
        if (files && files.length > 0) {
            return files[0];
        }
        return null;
    }

}
