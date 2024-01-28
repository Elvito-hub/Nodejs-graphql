import { model, Schema } from 'mongoose';

const participantsSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId, ref: 'User', required: true,
    }],
    messages: [{
        type: Schema.Types.ObjectId, ref: 'Message',
        required: true,
    }],
    contestId: {
        type: Schema.Types.ObjectId, ref: 'Contest',
        required: true,
    },
});

export default model('ParticipantMessage', participantsSchema);
