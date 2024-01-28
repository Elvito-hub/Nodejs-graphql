import { gql } from 'apollo-server-express';
import mongoose from 'mongoose';
import contestRanking from '../../models/schemas/contestRanking';

const UserContestRankingsTypedefs = gql`
type UserContestRankingData{
    id: ID
    contestId: ID
    contestName: String
    rank: Float
    users: [user]
    user: user
}
type user{
    userId: ID
    firstName: String
    lastName: String
    score: Float
    userAnswers: [userAnswer]
}
type userAnswer{
    indexQuestion: Float
    answer: String
    score: Float
}
type Query{
    getSingleContestRankings(contestId: String):UserContestRankingData
    getuserContestedContests(userId: String):[UserContestRankingData]
    getSingleUserSingleContestData(userId: String, contestId: String): [UserContestRankingData]
} 
`;
const UserContestRankingsResolvers = {
    Query:{
        getSingleContestRankings:async(_source: any, _args: any)=>{
            const contestId = new mongoose.Types.ObjectId(_args.contestId);
            const res= await contestRanking.aggregate([
                {
                    $match: {
                        contestId: contestId,
                    },
                },
                {
                    $lookup: {
                        from: 'users', // Assuming the User model is stored in the "users" collection
                        localField: 'userRankings.userId',
                        foreignField: '_id',
                        as: 'users',
                    },
                },
                {
                    $project: {
                        contestId: 1,
                        users: {
                            $map: {
                                input: '$users',
                                as: 'user',
                                in: {
                                    firstName: '$$user.firstName',
                                    lastName: '$$user.lastName',
                                    // eslint-disable-next-line sonarjs/no-duplicate-string
                                    userId: '$$user._id',
                                    score: {
                                        $let: {
                                            vars: {
                                                userRanking: {
                                                    $arrayElemAt: [
                                                        { $filter: { input: '$userRankings', as: 'ranking', cond: { $eq: ['$$ranking.userId', '$$user._id'] } } },
                                                        0,
                                                    ],
                                                },
                                            },
                                            in: '$$userRanking.score',
                                        },
                                    },
                                    userAnswers: {
                                        $let: {
                                            vars: {
                                                userRanking: {
                                                    $arrayElemAt: [
                                                        { $filter: { input: '$userRankings', as: 'ranking', cond: { $eq: ['$$ranking.userId', '$$user._id'] } } },
                                                        0,
                                                    ],
                                                },
                                            },
                                            in: '$$userRanking.userAnswers',
                                        },
                                    },
                                },

                            },
                        },
                    },
                },
            ]);
            // const res = await contestRanking.find({ contestId:contestId });
            console.log(res[0].users);
            return res[0];
        },
        getuserContestedContests:async(_source: any, _args: any)=>{
            const userId = new mongoose.Types.ObjectId(_args.userId);
            const contestRankings: any = await contestRanking.aggregate([
                {
                    $match:{
                        'userRankings.userId': userId,
                    },
                }, {
                    $lookup:{
                        from: 'contests',
                        localField: 'contestId',
                        foreignField: '_id',
                        as: 'contest',
                    },
                },
                {
                    $project: {
                        contestName: '$contest.name',
                        userRankings: 1,
                        contestId: 1,
                    },
                },
            ]);
            console.log(contestRankings);
            const contests = contestRankings.map((contestRanking1: any) => {
                console.log(contestRanking1.userRankings, 'okok');
                const index = contestRanking1.userRankings.findIndex(
                    (ranking: any) => ranking.userId.toString() === userId.toString()
                );
                console.log(index);
                return {
                    id: contestRanking1._id,
                    contestId: contestRanking1.contestId,
                    rank: index !== -1 ? index+1: null,
                    user: contestRanking1.userRankings[index],
                    contestName: contestRanking1.contestName[0],
                };
            });
            console.log(contests);
            return contests;
        },
        getSingleUserSingleContestData:async(_source: any, _args: any)=>{
            const userId = new mongoose.Types.ObjectId(_args.userId);
            const contestId = new mongoose.Types.ObjectId(_args.contestId);
            const contestRankings = await contestRanking.find(
                { 'userRankings.userId': userId, contestId },
                { 'userRankings': 1, contestId:1 } // Only retrieve the matching userRankings element
            ).lean();

            const contestData = contestRankings.map(contestRanking1 => {
                console.log(contestRanking1.userRankings, 'okok');
                const index = contestRanking1.userRankings.findIndex(
                    ranking => ranking.userId.toString() === userId.toString()
                );
                return {
                    contestId: contestRanking1.contestId,
                    rank: index !== -1 ? index+1: null,
                    user: contestRanking1.userRankings[index],
                };
            });
            console.log(contestData);
            return contestData;
        },
    },
};

export { UserContestRankingsResolvers, UserContestRankingsTypedefs };
