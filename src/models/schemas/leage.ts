import { model, Schema } from 'mongoose';

const LeageSchema = new Schema({
    name:{
        type: String,
        required: [true, "Please specify the leage's name."],
    },
    contestIds:[{
        type: Schema.Types.ObjectId, ref: 'Contest', required: true,
    }],
    description:{
        type: String,
        required: [true, 'Please describe your leage.'],
    },
    startDate: {
        type: String,
        // required: [true, "Please specify leage's start date."],
    },
    endDate: {
        type: String,
        // required: [true, "Please specify leage's end date."],
    },
    admins:[{
        type: Schema.Types.ObjectId, ref: 'User', required: true,
    }],
});

export default model('Leage', LeageSchema);
