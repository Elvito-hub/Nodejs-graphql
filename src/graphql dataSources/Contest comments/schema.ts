/* eslint-disable eqeqeq */
/* eslint-disable sonarjs/no-duplicate-string */
import { gql } from 'apollo-server-express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import contestRanking from '../../models/schemas/contestRanking';
import contestComments from '../../models/schemas/contestComments';

const ContentCommentsTypedefs = gql`
type ContestCommentData{
    id: ID
    contestId: ID
    comments: [CommentsData]
}
type CommentsData{
    sender: ID
    firstName: String
    lastName: String
    isCurrentUser: Boolean
    comment: String
    timestamp: String
    parentId: String
    depth: Float
}
type Query{
    getSingleContestComments(contestId: String):ContestCommentData
}
`;
const ContestCommentsResolvers = {
    Query:{
        getSingleContestComments:async(_source: any, _args: any, _context: any)=>{
            const token1 = _context.token;
            console.log(token1);
            let userIdToken = '';
            if (token1){
                const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
                userIdToken = verified.id;
            }

            console.log(userIdToken);
            const contestId = new mongoose.Types.ObjectId(_args.contestId);
            let ouruserId;
            if (userIdToken){
                ouruserId = new mongoose.Types.ObjectId(userIdToken);
            }

            const res = await contestComments.aggregate([
                {
                    $match: {
                        contestId: contestId,
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'comments.sender',
                        foreignField: '_id',
                        as: 'users',
                    },
                },
                {
                    $addFields: {
                        userIdToken: ouruserId,
                    },
                },
                {
                    $project: {
                        contestId: 1,
                        comments: {
                            $map: {
                                input: '$comments',
                                as: 'comment',
                                in: {
                                    firstName: {
                                        $first: {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: '$users',
                                                        as: 'user',
                                                        cond: { $eq: ['$$user._id', '$$comment.sender'] },
                                                    },
                                                },
                                                as: 'user',
                                                in: '$$user.firstName',
                                            },
                                        },
                                    },
                                    lastName: {
                                        $first: {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: '$users',
                                                        as: 'user',
                                                        cond: { $eq: ['$$user._id', '$$comment.sender'] },
                                                    },
                                                },
                                                as: 'user',
                                                in: '$$user.lastName',
                                            },
                                        },
                                    },
                                    comment:'$$comment.comment',
                                    timestamp:'$$comment.timestamp',
                                    isCurrentUser: { $eq: ['$$comment.sender', '$userIdToken'] },

                                // Rest of comment fields
                                },
                            },
                        },
                    },
                },
            ]);
            // const res = await contestRanking.find({ contestId:contestId });
            return res[0];
        },
    },
};

export { ContentCommentsTypedefs, ContestCommentsResolvers };
