import { Model, model, Document, Schema } from 'mongoose';

export interface IFileDescriptor {
    uuid?: string;
    adapter: string;
    real_id: string;
    mimetype: string;
    originalname: string;
}

export interface FileDescriptorDocument extends Document, IFileDescriptor {}

export let FileDescriptorSchema: Schema = new Schema({
    uuid: String,
    adapter: String,
    real_id: String,
    mimetype: String,
    originalname: String
});

export let FileDescriptorModel: Model<FileDescriptorDocument> = model('AndesDriveMetadata', FileDescriptorSchema, 'AndesDriveMetadata');
