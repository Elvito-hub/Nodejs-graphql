import { model, Schema } from 'mongoose';

const message = new Schema({
    sender: {
        type: Schema.Types.ObjectId, ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timeSent: {
        type: String,
        required: true,
    },
});

export default model('Message', message);
