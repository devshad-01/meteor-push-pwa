import { Mongo } from 'meteor/mongo';

export const Subscriptions = new Mongo.Collection('subscriptions');
export const Notifications = new Mongo.Collection('notifications');
export const UserActivity = new Mongo.Collection('userActivity');
export const OnlineUsers = new Mongo.Collection('onlineUsers');
