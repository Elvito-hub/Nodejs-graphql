import { gql } from 'apollo-server-express';
import userContest from '../../models/schemas/userContest';

const UserContestTypedefs = gql`
scalar Date
type UserContestData{
    id: ID 
    userId: String
    contestId: String
    userContestPackage: userContestPackageSchema
}
type userContestPackageSchema{
    multipleChoiceAnswers: multipleChoiceAnswersSchema
}
type multipleChoiceAnswersSchema{
    questionIndex: String
    answer: [String]
    score: Float
}
type Query{
    getAllUsersContestResult(contestId:String): [UserContestData]
    getSingleUserContestResult(userId:String,contestId:String):[UserContestData]
  }
`;

const UserContestResolvers = {
    Query:{
        getAllUsersContestResult:async(_source: any, _args: any)=>{
            return await userContest.find({
                contestId: _args.contestId,
            });
        },
        getSingleUserContestResult: async(_source: any, _args: any)=>{
            return await userContest.find({
                contestId: _args.contestId,
                userId:_args.userId,
            });
        },
    },
};

export { UserContestTypedefs, UserContestResolvers };
