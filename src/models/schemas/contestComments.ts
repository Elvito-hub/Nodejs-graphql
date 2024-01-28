import { model, Schema } from 'mongoose';

const commentsSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId, ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    timestamp:{
        type: String,
        required: true,
    },
    parentId: {
        type: String,
        required: false,
    },
    depth: {
        type: Number,
        required: true,
    },
});

const contestCommentsSchema = new Schema({
    contestId: {
        type: Schema.Types.ObjectId, ref: 'Contest',
        required: true,
    },
    comments: {
        type: [commentsSchema],
    },
});


export default model('ContestComments', contestCommentsSchema);
