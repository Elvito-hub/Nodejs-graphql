import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../interfaces/user';


const AchievementaSchema = new Schema({
    contest: {
        type: Schema.Types.ObjectId, ref: 'Contest',
        required: true,
    },
    rank: {
        type: Number,
    },
});

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    nickName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (email: string): Promise<boolean> {
                const count = await model('User').countDocuments({ email });
                return count === 0;
            },
            message: 'Email already registered',
        },
        // Regexp to validate emails with more strict rules as added in tests/users.js which also conforms mostly with RFC2822 guide lines
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    birthDate: {
        type: Date,
        required: true,
    },
    profilePicture: {
        type: String,
        required: false,
    },
    gender: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        default:'user',
    },
    registerDate: {
        type: Date,
    },
    achievements: {
        type: [AchievementaSchema],

    },
});
UserSchema.pre('save', async function (next: any) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
// mongoose allows creation of functions that can be used by controllers
// creating function for password check
UserSchema.methods.matchPasswords = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};
UserSchema.methods.getSignedToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, `${process.env.JWT_SECRET_KEY}`);
};

export default model<User>('User', UserSchema);
