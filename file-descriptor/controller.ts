import { FileDescriptorModel } from './schemas';
const uuidv1 = require('uuid/v1');

export class FileDescriptor {
    constructor () {

    }

    public static async create(data) {
        // [TODO] Add some validation
        const fd = new FileDescriptorModel(data);
        fd.uuid = uuidv1();
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
