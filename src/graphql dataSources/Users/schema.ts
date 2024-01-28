import { gql } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import user from '../../models/schemas/user';

const UserTypedefs = gql`
  scalar Date
  type UserData {
    id: ID
    firstName: String
    lastName: String
    nickName: String
    email: String
    phoneNumber: String
    birthDate: Date
    profilePicture: String
    gender: String
    password: String
    role: String
    token: String
    registerDate: Date
  }
  type UserLoginResponse {
    user: UserData
    token: String
  }
  type Query {
    getAllUsers: [UserData]
    getSingleUser(userId: String): UserData
  }
  type Mutation {
    Register(
      firstName: String!
      lastName: String!
      nickName:String
      email: String!
      phoneNumber: String
      birthDate: String
      profilePicture: String
      gender: String!
      password: String
      role: String
    ): UserData
    login: UserData
  }
`;

const UserResolvers = {
    Query: {
        getAllUsers: async () => {
            return await user.find();
        },
        getSingleUser: async(_source: any, _args: any)=>{
            return await user.findById(_args.userId);
        },
    },
    Mutation:{
        Register: async (_source: any, _args: any) => {
            const newUser = await user.create({
                ..._args,
                birthDate: new Date(_args.birthDate),
                registerDate: new Date(),
            });
            if (newUser){
                const token = newUser.getSignedToken();
                return {
                    user: newUser,
                    token,
                };
            }
        },
        login: async (_source: any, _args: any, _context: any) => {

            const token1 = _context.token;
            if (!token1){
                return '';
            }
            const verified = jwt.verify(token1, `${process.env.JWT_SECRET_KEY}`) as {id: string};
            const userId = verified.id;
            return await user.findById(userId);
        },
    },
};

export { UserTypedefs, UserResolvers };
