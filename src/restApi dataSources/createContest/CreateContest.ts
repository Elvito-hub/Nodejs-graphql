import contest from '../../models/schemas/contest';

export const createContest=async(contestObject: any)=>{
    const newContest = await contest.create(contestObject);
    newContest.save();
};
