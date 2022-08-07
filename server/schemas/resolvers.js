const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // get user by username
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({})
                .select('-__v' -password)
                .populate('books')

                return userData;
            }
            throw new AuthenticationError("you need to log in")
        },
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return {token, user};
        },
        
        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if(!user) {
                throw new AuthenticationError('worng password or username');
            }
            const correctPw = await user.isCorrectPassword(password);
            
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            
            const token = signToken(user);
            return { token, user };
        }, 

        saveBook: async (parent, args, context) => {
            if(context.user) {
                const updateUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: args.input } },
                    { new: true }
                ).populate('Books');

                return updateUser;
            }
            throw new AuthenticationError('you need to log in');
        },

        removeBook: async (parent, args, context) => {
            if(context.user) {
                const updateUser = await User.findOneAndDelete(
                    { _id: context.user._id },
                    { $pull: {savedBooks: { bookId: args.bookId }}},
                    {new: true} 
                );
                return updateUser;
            }
            throw new AuthenticationError('you need to log in');
        }
    }
};

module.exports = resolvers;