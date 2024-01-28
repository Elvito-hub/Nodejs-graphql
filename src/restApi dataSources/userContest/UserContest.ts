import userContest from '../../models/schemas/userContest';

export const createUserContest=async(userId: string, contestId: string, contestRes: any)=>{
    const userContestObj = {
        userId,
        contestId,
        UserContestPackage:{
            multipleChoiceAnswers:contestRes,
        },
    };
    const newUserContest = await userContest.create(userContestObj);
    newUserContest.save();
};
