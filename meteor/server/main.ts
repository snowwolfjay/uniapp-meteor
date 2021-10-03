import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { publishComposite } from "meteor/reywood:publish-composite";


Meteor.startup(() => {
  console.log(`Hi boot! -- ddp demo -- oh yeah -`);
});
const Users = Meteor.users;
const Rooms = new Mongo.Collection<any>("rooms");
const Messages = new Mongo.Collection<any>("messages");

Meteor.methods({
  "message.add": function (data: any) {
    if (!this.userId || !data.room)
      throw new Meteor.Error("仅有登录用户能那啥");
    return Messages.insert({
      ...data,
      user: this.userId,
    });
  },
  "room.create": function (name: string) {
    if (!this.userId) throw new Meteor.Error("仅有登录用户能那啥");
    return Rooms.insert({
      name,
      createdBy: this.userId,
      createdAt: Date.now(),
      members: [this.userId],
    });
  },
  "room.join": function (id: string) {
    if (!this.userId) throw new Meteor.Error("仅有登录用户能那啥");
    const room = Rooms.findOne(id);
    if (!room) throw new Meteor.Error("没房间不能那啥");
    return Rooms.update(id, {
      $addToSet: {
        members: this.userId,
      },
    });
  },
  "room.left": function (id: string) {
    if (!this.userId) throw new Meteor.Error("仅有登录用户能那啥");
    const room = Rooms.findOne(id);
    if (!room) throw new Meteor.Error("没房间不能那啥");
    return Rooms.update(id, {
      $pull: {
        members: this.userId,
      },
    });
  }
});
 
Meteor.publish("rooms.all", function () {
  return Rooms.find({}, { fields: { name: 1, _id: 1 } });
});

publishComposite("rooms.mine", function () {
  const userId = this.userId;
  return {
    find() {
      return Rooms.find(
        { members: userId },
        { fields: { name: 1, members: 1 } }
      );
    },
    collectionName: `rooms-mine`,
    children: [
      {
        find(room) {
          return Users.find(
            { id: { $in: room.membsers } },
            { fields: { profile: 1 } }
          );
        },
      },
      {
        find(room) {
          return Messages.find({ roomId: room._id });
        },
      },
    ],
  };
});

Meteor.onConnection((con) => {
  console.log(`${con.id} connected`);
  con.onClose(() => {
    console.log(`${con.id} closed`);
  });
});
