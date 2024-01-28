/* eslint-disable sonarjs/no-duplicate-string */
import { AuthenticationError, gql } from 'apollo-server-express';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import contest from '../../models/schemas/contest';
import { encryptCorrectAnswers } from '../../restApi dataSources/utils/questionUtils/question';

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPEN_AI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const ContestTypedefs= gql`
  scalar Date
  type encryptedData {
    contest:ContestData
    setter: String
  }
  type ContestData {
    id: ID
    name: String
    dateCreated: Date
    dateTobeLaunched: Date
    creatorId: String
    onApproved: Boolean
    bookingsNumber: Float
    isUserBooked: Boolean
    duration: Float
    multipleQuestion: [quickQuestionsTypes]
    typingQuestion: [typingQuestionsTypes]
    creator: String
    bookings: [BookingsData]
    contestants: [contestantsInfo]
    # singleSelection: [singleSelectionTypes]
    # pairselection: [pairSelectionTypes]
    # lastSection: [lastSectionTypes]
  }
  type BookingsData {
    userInd: Float
    userId: String
  }
  type contestantsInfo {
    userInd: Float,
    userId: String,
    firstName: String,
    lastName: String
  }
  type ContestantsData {
    contestants: [SingleContestantData]
  }
  type SingleContestantData{
    id: ID
    firstName: String
    lastName: String
    achievements: [AchievementsTypes]
  }
  type AchievementsTypes{
    contest: String
    rank: Float
  }
  type quickQuestionsTypes{
    question: String
    answers: [String]
    correctAnswer: [String]
    score: Float
    time: Float
  }
  type singleSelectionTypes{
    question: String
    options: [String]
    correctOptions: [String]
  }
  type pairSelectionTypes{
    question: String
    options: [String]
    correctPairs: [String]
  }
  type lastSectionTypes{
    questionSet: [String]
    answer: String
  }
  type questionReturn{
    question:String
    answer:String
  }
  type multiplequestionReturn{
    question:String
    options:[String]
    correctAnswer:String
  }
  type typingQuestionsTypes{
    question: String
    answer: String
    score: Float
    floated: String
    time: Float
    hints: [hintsTypes]
  }

  type hintsTypes {
    index: Float
    hint: String
  }

  type Query{
    getAllContestsAdmin: [ContestData]
    getAllContests(userId: String): [ContestData]
    getAllUserContests(userId:String): [ContestData]
    getLiveContest(userId: String): [ContestData]
    getPastContest(userId: String): [ContestData]
    getUpComingContest(userId: String): [ContestData]
    getCreatorContests(userId:String): [ContestData]
    getSingleContestData(id:String):encryptedData
    getSingleContestDataSafe(id:String): ContestData
    getContestantsData(id:String): [ContestantsData]
    getSingleContestSmallData(id:String): ContestData
  }
  type Mutation {
    Make_contest(
        prompt:String
    ):[multiplequestionReturn]
  }
`;

const ContestResolvers = {
    Query:{
        getAllContestsAdmin:async()=>{
            return await contest.aggregate([
                {
                    $lookup:{
                        from: 'users',
                        localField: 'creatorId',
                        foreignField: '_id',
                        as: 'creator',
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        text: 1,
                        creator: { $concat: [{ $arrayElemAt: ['$creator.firstName', 0] }, ' ', { $arrayElemAt: ['$creator.lastName', 0] }] },
                        dateCreated: 1,
                        bookingsNumber: { $size: '$bookings' },
                        dateTobeLaunched: 1,
                        creatorId: 1,
                        onApproved: 1,
                        name:1,
                    },
                },
            ]);
        },
        getAllContests:async(_source: any, _args: any, _context: any)=>{
            const token1 = _context.token;
            let userIdToken = '';
            if (token1){
                const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
                userIdToken = verified.id;
            }
            console.log(_context, 'it has been sent by server');
            if (userIdToken!==''){
                const userId = new mongoose.Types.ObjectId(userIdToken);
                return contest.aggregate([
                    {
                        $match: { onApproved: true },
                    },
                    {
                        $project: {
                            id:'$_id',
                            name: 1,
                            description: 1,
                            dateCreated: 1,
                            onApproved: 1,
                            duration: 1,
                            creatorId: 1,
                            dateTobeLaunched: 1,
                            bookingsNumber: { $size: '$bookings' },
                            isUserBooked: {
                                $in: [userId, '$bookings.userId'],
                            },
                        },
                    },
                ]);
            }
            return await contest.aggregate([
                {
                    $match: { onApproved: true },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        onApproved: 1,
                        creatorId: 1,
                        dateTobeLaunched: 1,
                        bookingsNumber: { $size: '$bookings' },
                    },
                },
            ]);
        },
        getAllUserContests:async(_source: any, _args: any)=>{
            const userId = new mongoose.Types.ObjectId(_args.userId);
            return await contest.aggregate([
                {
                    $match: { onApproved: true,
                        bookings: userId, // Check if the userId exists in the bookings array
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        onApproved: 1,
                        creatorId: 1,
                        dateTobeLaunched: 1,
                        bookingsNumber: { $size: '$bookings' },
                    },
                },
            ]);
        },
        getLiveContest:async(_source: any, _args: any,_context: any)=>{
            const token1 = _context.token;
            let userIdToken = '';
            if (token1){
                const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
                userIdToken = verified.id;
            }
            const currentDate = Date.now();
            if (userIdToken!==''){
                const userId = new mongoose.Types.ObjectId(userIdToken);
                return contest.aggregate([
                    {
                        $match: { onApproved: true,
                            $expr: {
                                $and: [
                                    { $lte: ['$timeStampStart', currentDate] },
                                    {
                                        $gte: ['$timeStampEnd', currentDate],
                                    },
                                ],
                            } },
                    },
                    {
                        $project: {
                            id:'$_id',
                            name: 1,
                            description: 1,
                            dateCreated: 1,
                            onApproved: 1,
                            duration: 1,
                            creatorId: 1,
                            dateTobeLaunched: 1,
                            bookingsNumber: { $size: '$bookings' },
                            isUserBooked: {
                                $in: [userId, '$bookings.userId'],
                            },
                        },
                    },
                ]);
            }
            return await contest.aggregate([
                {
                    $match: { onApproved: true,
                        $expr: {
                            // $lte: [{ $toLong: '$dateToBeLaunched' }, currentDate],

                            $and: [
                                { $lte: ['$timeStampStart', currentDate] },
                                {
                                    $gte: ['$timeStampEnd', currentDate],
                                },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        duration:1,
                        onApproved: 1,
                        timeStart: { $toLong: { $toDate: '$dateToBeLaunched' } },
                        creatorId: 1,
                        dateTobeLaunched: 1,
                        bookingsNumber: { $size: '$bookings' },
                    },
                },
            ]);
        },
        getPastContest:async(_source: any, _args: any, _context: any)=>{
            const token1 = _context.token;
            let userIdToken = '';
            if (token1){
                const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
                userIdToken = verified.id;
            }
            const currentDate = Date.now();
            if (userIdToken!==''){
                const userId = new mongoose.Types.ObjectId(userIdToken);
                return contest.aggregate([
                    {
                        $match: { onApproved: true,
                            timeStampEnd: { $lte: currentDate },
                        },
                    },
                    {
                        $project: {
                            id:'$_id',
                            name: 1,
                            description: 1,
                            dateCreated: 1,
                            onApproved: 1,
                            duration: 1,
                            creatorId: 1,
                            dateTobeLaunched: 1,
                            bookingsNumber: { $size: '$bookings' },
                            isUserBooked: {
                                $in: [userId, '$bookings'],
                            },
                        },
                    },
                ]);
            }
            return await contest.aggregate([
                {
                    $match: { onApproved: true,
                        timeStampEnd: { $lte: currentDate },
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        duration:1,
                        onApproved: 1,
                        timeStart: { $toLong: { $toDate: '$dateToBeLaunched' } },
                        creatorId: 1,
                        dateTobeLaunched: 1,
                        bookingsNumber: { $size: '$bookings.userId' },
                    },
                },
            ]);
        },
        getUpComingContest:async(_source: any, _args: any, _context: any)=>{
            const token1 = _context.token;
            let userIdToken = '';
            if (token1){
                const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
                userIdToken = verified.id;
            }
            const currentDate = Date.now();
            if (userIdToken!==''){
                console.log(userIdToken,'id token');
                const userId = new mongoose.Types.ObjectId(userIdToken);
                return contest.aggregate([
                    {
                        $match: { onApproved: true,
                            timeStampStart: { $gte: currentDate },
                        },
                    },
                    {
                        $project: {
                            id:'$_id',
                            name: 1,
                            description: 1,
                            dateCreated: 1,
                            onApproved: 1,
                            duration: 1,
                            creatorId: 1,
                            dateTobeLaunched: 1,
                            bookingsNumber: { $size: '$bookings' },
                            isUserBooked: {
                                $in: [userId, '$bookings.userId'],
                            },
                        },
                    },
                ]);
            }
            return await contest.aggregate([
                {
                    $match: { onApproved: true,
                        timeStampStart: { $gte: currentDate },
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        duration:1,
                        onApproved: 1,
                        timeStart: { $toLong: { $toDate: '$dateToBeLaunched' } },
                        creatorId: 1,
                        dateTobeLaunched: 1,
                        bookingsNumber: { $size: '$bookings' },
                    },
                },
            ]);
        },
        getCreatorContests:async(_source: any, _args: any,_context: any)=>{
            const contestId = new mongoose.Types.ObjectId(_args.id);
            const token1 = _context.token;
            console.log(token1);
            if (!token1){
                throw new AuthenticationError('you must be logged in');
            }
            const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string;role: string};
            const userRole = verified.role;
            if (userRole !== 'admin'){
                throw new AuthenticationError('you must be an admin');
            }
            const userId = new mongoose.Types.ObjectId(_args.userId);
            return await contest.find({ creatorId: userId });
        },
        getSingleContestData:async(_source: any, _args: any, _context: any)=>{
            const contestId = new mongoose.Types.ObjectId(_args.id);
            const token1 = _context.token;
            console.log(token1);
            if (!token1){
                throw new AuthenticationError('you must be logged in');
            }
            const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
            const userId = verified.id;
            const secretKey = crypto.randomBytes(16).toString('hex');
            // define types plz
            let encryptedques: any={};
            const contestData = await contest.aggregate([
                {
                    $match: { '_id': contestId },
                },
                {
                    $lookup: {
                        from: 'users', // assuming the user model is named 'User' so collection name is 'users'
                        localField: 'bookings.userId',
                        foreignField: '_id',
                        as: 'bookingDetails',
                    },
                },
                {
                    $addFields: {
                        bookingDetails: {
                            $map: {
                                input: '$bookingDetails',
                                as: 'booking',
                                in: {
                                    firstName: '$$booking.firstName',
                                    lastName: '$$booking.lastName',
                                    userId: '$$booking._id',
                                    userInd: {
                                        $reduce: {
                                            input: '$bookings',
                                            initialValue: null,
                                            in: {
                                                $cond: [
                                                    { $eq: ['$$this.userId', '$$booking._id'] },
                                                    '$$this.userInd',
                                                    '$$value',
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        duration:1,
                        onApproved: 1,
                        multipleQuestion: 1,
                        typingQuestion: 1,
                        dateTobeLaunched: 1,
                        bookings: 1,
                        contestants : '$bookingDetails',
                    },
                },
            ]);

            if(contestData && contestData[0] && contestData[0].bookings){
                const thebookings = contestData[0].bookings;
                const theUser = thebookings.findIndex((item: any)=>item.userId.toString() === userId);
                if(theUser === -1){
                    throw new AuthenticationError('Did not book event');
                }
            }
            if ((contestData && new Date(contestData[0].dateTobeLaunched) > new Date())) {
                throw new Error('Event not yet launched');
            } else if (contestData && new Date(contestData[0].dateTobeLaunched).getTime()+(contestData[0].duration*1000) < new Date().getTime()){
                throw new Error('Event Finished');
            }
            encryptedques = encryptCorrectAnswers(contestData[0], secretKey);
            return {
                contest:encryptedques,
                setter: secretKey,
            };
        },
        getSingleContestSmallData: async(_source: any, _args: any)=>{
            const contestId = _args.id;
            return contest.findById(contestId, {
                id: 1,
                dateTobeLaunched: 1,
                name: 1,
                duration: 1,
            });
        },
        getSingleContestDataSafe: async(_source: any, _args: any,_context: any)=>{
            const token1 = _context.token;
            console.log(token1);
            const contestId = _args.id;
            // TODO CHECK IF CONTEST IS DONE
            return await contest.findById(contestId);
        },
        // getSingleContestContestants: async(_source: any, _args: any,_context: any)=>{
        //     const contestId = _args.id;
        //     const res = await contest.aggregate([
        //         {
        //             $match: { '_id': contestId },
        //         },
        //         {
        //             $lookup: {
        //                 from: 'users', // assuming the user model is named 'User' so collection name is 'users'
        //                 localField: 'bookings',
        //                 foreignField: '_id',
        //                 as: 'bookingDetails',
        //             },
        //         },
        //         {
        //             $project: {
        //                 'name': 1,
        //                 'description': 1,
        //                 'dateCreated': 1,
        //                 'bookings':1,
        //                 'contestants': {
        //                     $map: {
        //                         'input': '$bookingDetails',
        //                         'as': 'booking',
        //                         'in': {
        //                             'firstName': '$$booking.firstName',
        //                             'lastName': '$$booking.lastName',
        //                             'id': '$$booking._id',
        //                         },
        //                     },
        //                 },
        //             },
        //         },
        //     ]);
        //     console.log(res[0].bookings)
        // },
        getContestantsData: async(_source: any, _args: any)=>{
            const contestId = new mongoose.Types.ObjectId(_args.id);

            const res = await contest.aggregate([
                {
                    $match: { '_id': contestId },
                },
                {
                    $lookup: {
                        from: 'users', // assuming the user model is named 'User' so collection name is 'users'
                        localField: 'bookings.userId',
                        foreignField: '_id',
                        as: 'bookingDetails',
                    },
                },
                {
                    $addFields: {
                        bookingDetails: {
                            $map: {
                                input: '$bookingDetails',
                                as: 'booking',
                                in: {
                                    firstName: '$$booking.firstName',
                                    lastName: '$$booking.lastName',
                                    userId: '$$booking._id',
                                    achievements: '$$booking.achievements',
                                    userInd: {
                                        $reduce: {
                                            input: '$bookings',
                                            initialValue: null,
                                            in: {
                                                $cond: [
                                                    { $eq: ['$$this.userId', '$$booking._id'] },
                                                    '$$this.userInd',
                                                    '$$value',
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        name: 1,
                        description: 1,
                        dateCreated: 1,
                        duration:1,
                        onApproved: 1,
                        dateTobeLaunched: 1,
                        bookings: 1,
                        contestants : '$bookingDetails',
                    },
                },
            ]);
            console.log(res[0].bookings);
            return res;
        },
    },
    Mutation:{
        Make_contest : async (_source: any, _args: any) => {
            try {
                const prompt = _args.prompt;

                const response = await openai.createCompletion({
                    model: 'text-davinci-003',
                    prompt: `${prompt}`,
                    temperature: 0, // Higher values means the model will take more risks.
                    max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
                    top_p: 1, // alternative to sampling with temperature, called nucleus sampling
                    frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
                    presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
                });

                // res.status(200).send({
                //     bot: response.data.choices[0].text,
                // });
                const respstring: string|undefined = response.data.choices[0].text;
                console.log(respstring);
                if (respstring) {
                    console.log(JSON.parse(respstring));
                    return JSON.parse(respstring);
                }

            } catch (error) {
                console.error(error);
            }
        },
    },
};

export { ContestTypedefs, ContestResolvers };
