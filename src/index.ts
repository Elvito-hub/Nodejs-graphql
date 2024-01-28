/* eslint-disable sonarjs/no-duplicate-string */
import express, { NextFunction, Request, Response } from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { clone } from 'lodash';
import { ApolloServer } from 'apollo-server-express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { UserResolvers, UserTypedefs } from './graphql dataSources/Users';
import { ContestResolvers, ContestTypedefs } from './graphql dataSources/Contests';
import { UserContestResolvers, UserContestTypedefs } from './graphql dataSources/UserContest';
import { UserContestRankingsResolvers, UserContestRankingsTypedefs } from './graphql dataSources/ContestRankings';
import {ContentCommentsTypedefs, ContestCommentsResolvers} from './graphql dataSources/Contest comments';

import {
    FastSelectionPairResolvers, FastSelectionPairTypedefs,
    FastSelectionSingleResolvers, FastSelectionSingleTypedefs,
    MultipleQuestionResolvers, MultipleQuestionTypedefs,
    ThreeDeeperQuestionsResolvers, ThreeDeeperQuestionsTypedefs,
    TopicQuestionResolvers, TopicQuestionTypedefs,
    TypingQuestionResolvers, TypingQuestionTypedefs
} from './graphql dataSources/Questions';
import { YoutubeChunkSetter } from './restApi dataSources/youtubeChunkSetter/YoutubeChunkSetter';
import { generateUploadURL } from './middleware/contestMediaS3';
import contest from './models/schemas/contest';
import { createUserContest } from './restApi dataSources/userContest/UserContest';
import contestRanking from './models/schemas/contestRanking';
import user from './models/schemas/user';
import multiplequestion from './models/schemas/multiplequestion';
import typingquestion from './models/schemas/typingquestion';
import contestComments from './models/schemas/contestComments';

const graphqlschema = makeExecutableSchema({
    typeDefs: [
        UserTypedefs, ContestTypedefs,
        TopicQuestionTypedefs,
        MultipleQuestionTypedefs,
        FastSelectionSingleTypedefs,
        FastSelectionPairTypedefs,
        ThreeDeeperQuestionsTypedefs,
        UserContestTypedefs,
        UserContestRankingsTypedefs,
        TypingQuestionTypedefs,
        ContentCommentsTypedefs,
    ],
    resolvers: [UserResolvers, ContestResolvers,
        TopicQuestionResolvers,
        MultipleQuestionResolvers,
        FastSelectionSingleResolvers,
        FastSelectionPairResolvers,
        ThreeDeeperQuestionsResolvers,
        UserContestResolvers,
        UserContestRankingsResolvers,
        TypingQuestionResolvers,
        ContestCommentsResolvers,
    ],
});

async function startApolloServer() {
    const app = express();
    const server = http.createServer(app);

    // const resend = new Resend('re_dvs1JD2Z_4A2cH5CMQNhfomrq9ggZbbHk');

    // @ts-ignore
    app.use(cookieParser());
    app.use(cors({
        origin:['https://studio.apollographql.com', 'http://192.168.1.64:3002', 'http://contest-docker-app-env.eba-28x3mhfa.us-west-1.elasticbeanstalk.com'],
        methods: ['GET', 'POST'],
        credentials:true,
    }));
    app.use('/graphql', cors({
        origin: ['http://localhost:3002', 'http://192.168.1.64:3002', 'http://contest-docker-app-env.eba-28x3mhfa.us-west-1.elasticbeanstalk.com'],
        methods: ['GET', 'POST'],
        credentials: true,
    }));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    const apolloServer = new ApolloServer({
        schema: graphqlschema,
        context:({ req })=>{
            return { token: req.cookies.token };
        },
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app: app, cors: {
        origin: ['https://studio.apollographql.com', 'http://localhost:3002', 'http://192.168.1.64:3002', 'http://contest-docker-app-env.eba-28x3mhfa.us-west-1.elasticbeanstalk.com'],
        methods: ['GET', 'POST'],
        credentials: true,
    } });

    // app.post('/sendemail',(req,res)=>{

    //     return resend.emails.send({
    //         from: 'onboarding@resend.dev',
    //         to: 'gasanaelvis20@gmail.com',
    //         subject: 'Hello World',
    //         html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    //     });
    // });
    app.get('/', (req: Request, res: Response, next: NextFunction) => {
        res.send('graphql ok');
    });
    app.get('/s3url', async (req: Request, res: Response, next: NextFunction) => {
        const url = await generateUploadURL();
        console.log('v1 ok');
        res.send({ url });
    });

    app.post('/register', async(req: Request, res: Response, next: NextFunction)=>{
        try {
            const newUser = await user.create({
                ...req.body,
                birthDate: new Date(req.body.birthDate),
                registerDate: new Date(),
            });
            if (newUser){
                const token = newUser.getSignedToken();
                res.cookie('token', token, {
                    httpOnly:true,
                }).send();
            }
        } catch (error) {
            res.status(409).json({ message: error });
        }
    });

    app.post('/login', async(req: Request, res: Response, next: NextFunction)=>{
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error('Provide email and password');
        }
        let errorMessage: string | undefined = '';
        try {
            const Loginuser = await user.findOne({ email }).select('+password');
            if (!Loginuser) {
                errorMessage = 'Invalid Username and password';
                return res.status(409).json({ message: errorMessage });
            }
            const isMatch = await Loginuser.matchPasswords(password);
            if (!isMatch) {
                errorMessage = 'Wrong password';
                return res.status(409).json({ message: errorMessage });
            }
            const token = Loginuser.getSignedToken();
            res.cookie('token', token, {
                httpOnly:true,
            }).send();
        } catch (error) {
            res.status(409).json({ message: error });

        }
    });
    app.get('/logout', async(req: Request, res: Response, next: NextFunction)=>{
        res.cookie('token', '', {
            httpOnly:true,
            expires: new Date(0),
        }).send();
    });

    app.get('/loggedin', async(req: Request, res: Response, next: NextFunction)=>{
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.json(false);
            }
            jwt.verify(token, `${process.env.JWT_SECRET_KEY}`);
            res.send(true);
        } catch (error) {
            return res.json(false);
        }
    });

    app.get('/contestmediaupload', async(req: Request, res: Response, next: NextFunction)=>{
        try {
            const youtubeUrl = req.query.url;
            const startSecond = req.query.start;
            const endSecond = req.query.end;


            // if (typeof youtubeUrl === 'string' && typeof startSecond === 'number' && typeof endSecond === 'number') {
            const s3url = await YoutubeChunkSetter(youtubeUrl, startSecond, endSecond);
            res.status(200).json({
                fileurl:s3url,
            });
            // }
        } catch (error) {
            console.error(error);
            res.status(500).send('An error occurred');
        }
    });

    app.post('/createmultiplequestion', async(req: Request, res: Response, next: NextFunction)=>{
        const { question, answers, correctAnswer, field, creatorId } = req.body;
        const newMultQuest = await multiplequestion.create({
            question,
            correctAnswer: JSON.parse(correctAnswer),
            answers: JSON.parse(answers),
            dateAdded: new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }),
            creatorId,
            field,
        });
        try {
            await newMultQuest.save();
            res.status(200).json({
                success: 'true',
                message: 'question uploaded',
                questionId: newMultQuest.id,
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }
    });
    app.post('/createtypingquestion', async(req: Request, res: Response, next: NextFunction)=>{
        const { question, answer, field, creatorId } = req.body;
        const newTypingQuest = await typingquestion.create({
            question,
            answer: answer,
            dateAdded: new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }),
            creatorId,
            field,
        });
        try {
            await newTypingQuest.save();
            res.status(200).json({
                success: 'true',
                message: 'question uploaded',
                questionId: newTypingQuest.id,
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }
    });

    app.post('/createcontest', async(req: Request, res: Response, next: NextFunction)=>{
        const { name, dateTobeLaunched, multipleQuestion, creatorId, description, typingQuestion, duration }=req.body;
        // console.log({ contest1 });
        // const theContest = JSON.parse(contest1);
        const newContest = await contest.create({
            name,
            dateTobeLaunched: new Date(dateTobeLaunched).toLocaleString('en-US', { timeZone: 'Europe/Paris' }),
            description,
            multipleQuestion:JSON.parse(multipleQuestion),
            typingQuestion: JSON.parse(typingQuestion),
            creatorId,
            timeStampStart: new Date(dateTobeLaunched).getTime(),
            timeStampEnd: new Date(dateTobeLaunched).getTime() + Number(duration)*1000,
            duration: Number(duration),
        });
        try {
            await newContest.save();
            res.status(200).json({
                success: 'true',
                message: 'contest uploaded',
                contestId: newContest.id,
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }
    });
    app.patch('/bookcontest/:id/:userId', async(req: Request, res: Response, next: NextFunction)=>{
        const { id, userId } = req.params;

        try {
            const contestToBook = await contest.findById(id);

            if (!contestToBook) {
                return res.status(404).json({ message: 'Contest not found' });
            }

            const newBooking = {
                // @ts-ignore
                userInd: contestToBook.bookings.length,
                userId: userId,
            };
            // Add the new booking to the bookings array
            // @ts-ignore
            contestToBook.bookings.push(newBooking);

            // Save the updated contest document
            const updatedContest = await contestToBook.save();

            res.status(200).json({
                success: 'true',
                message: 'contest booked',
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }

    });
    app.patch('/approvecontest/:id', async(req: Request, res: Response, next: NextFunction)=>{
        const { id } = req.params;
        try {
            const newC = await contest.findByIdAndUpdate(
                id,
                { onApproved: true },
                { new: true }
            );
            res.status(200).json({
                success: 'true',
                message: 'contest approved',
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }
    });
    app.patch('/editcontest/:contestId', async(req: Request, res: Response, next: NextFunction)=>{
        const { contestId } = req.params;
        const { name, dateTobeLaunched, multipleQuestion, creatorId, description, typingQuestion, duration }=req.body;
        try {
            await contest.findByIdAndUpdate(contestId, {
                name,
                dateTobeLaunched:new Date(dateTobeLaunched).toISOString(),
                description,
                multipleQuestion:JSON.parse(multipleQuestion),
                typingQuestion: JSON.parse(typingQuestion),
                creatorId,
                timeStampStart: new Date(dateTobeLaunched).getTime(),
                timeStampEnd: new Date(dateTobeLaunched).getTime() + Number(duration)*1000,
                duration: Number(duration),
            });
            res.status(200).json({
                success: 'true',
                message: 'contest uploaded',
                contestId: contestId,
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }
    });
    app.post('/postcontestranking', async(req: Request, res: Response, next: NextFunction)=>{
        console.log(req.body);
        const { contestId, userRanking } = req.body;
        const alluserRanking = JSON.parse(userRanking);
        console.log(alluserRanking);
        const newContestRank = await contestRanking.create({
            contestId:contestId,
            userRankings:alluserRanking,
        });
        try {
            await newContestRank.save();
            await user.findOneAndUpdate(
                { _id:alluserRanking[0].userId },
                { $push: { achievements: { contest:contestId, rank: 1 } },
                });
            res.status(200).json({
                success: 'true',
                message: 'contestRanking uploaded',
            });
        } catch (error) {
            res.status(409).json({ message: error });
        }

    });
    app.post('/postusercontestres/:userid/:contestid', async(req: Request, res: Response, next: NextFunction)=>{
        const userId = req.params.userid;
        const contestId = req.params.contestid;
        const contestRes = req.body.contestRes;
        const newEditedContest = JSON.parse(contestRes).map((item: any)=>{
            return {
                questionIndex: item.indexQuestion,
                answer: [item.answer],
                score: item.score,
            };
        });
        createUserContest(userId, contestId, newEditedContest);
    });

    app.patch('/postcontestcomment/:userid/:contestid', async(req: Request, res: Response, next: NextFunction)=>{
        const userId = req.params.userid;
        const contestId = req.params.contestid;
        const message = req.body.content;
        const parentId = req.body.parentid;
        const depth = req.body.depth;
        const dateAdded = req.body.dateAdded;
        const authToken = req.cookies.token; // Change 'authToken' to your actual cookie name
        let userIdToken = '';

        if (authToken){
            const verified = jwt.verify(authToken, `${process.env.JWT_SECRET_KEY}`) as {id: string};
            userIdToken = verified.id;
        }

        let ouruserId: any;
        if (userIdToken){
            ouruserId = new mongoose.Types.ObjectId(userIdToken);
        }

        if (userId && contestId && message){
            try {
                // Find the ContestComments document for the given contestId
                let ContestComments = await contestComments.findOne({ contestId });


                // If the ContestComments document doesn't exist, create a new one
                if (!ContestComments) {
                    ContestComments = new contestComments({ contestId, comments: [] });
                }
                // Create a new comment object
                const newComment = {
                    sender: userId,
                    comment: message,
                    timestamp: dateAdded,
                    parentId,
                    depth,
                };

                // Push the new comment to the comments array
                ContestComments.comments.push(newComment);

                // Save the ContestComments document with the new comment
                const newc = await ContestComments.save();

                const novu = clone(newc);
                // console.log(ContestComments.comments, 'novu think');
                const relaxedComments = ContestComments.comments.map((item)=>{
                    return { ...item, isCurrentUser: item.sender===ouruserId };
                });
                console.log(newComment);
                res.status(200).json({
                    success: 'true',
                    message: 'contestcomment uploaded',
                    data: { ...newComment, isCurrentUser: true },
                });
                console.log('New comment added successfully!', newc.comments,authToken);
            } catch (error) {
                res.status(409).json({ message: error });
            }
        }
    });
    const CONNECTION_URL =
    process.env.MONGO_URI || 'mongodb+srv://elvito21:Joseph21pilots@nodeapp1.dvghq.mongodb.net/contestapp?retryWrites=true&w=majority';

    mongoose
        .connect(CONNECTION_URL
        )
        .then(() => {
            const PORT = process.env.PORT || 5001;
            server.listen(PORT, () => {
                console.log(`Listening to port ${PORT}...`);
            });

            console.log('MongoDB connected correctly');
        })
        .catch((error) => console.log(error));
}

startApolloServer();
