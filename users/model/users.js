// Ahnaf Raihan
// users.js

const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;

const USERS = 'users';

function Users(db) {
  this.db = db;
  this.users = db.collection(USERS);
}

Users.prototype.getUser = function(id) {
    return this.users.find({_id:id}).toArray()
        .then(function(users) {
        return new Promise(function(resolve, reject) {
            if (users.length === 1) {
                resolve(users[0]);
            }
            else {
                reject(new Error(`cannot find user ${id}`));
            }
      });
  });
}

Users.prototype.newUser = function(id, body) {
    body._id = id;
    return this.users.replaceOne(
        { "_id" : id }, body, { upsert: true } 
    )
    .then(function(results) {
      return new Promise((resolve) => resolve(results.modifiedCount));      
    });
}

Users.prototype.updateUser = function(id, body) {
    body._id = id;
    return this.users.findOneAndReplace(
        { "_id" : id },
        body,
        { upsert : false}
    )
    .then(function(results) {
        return new Promise(function(resolve, reject) {
            if (results.lastErrorObject.updatedExisting) {
                resolve();
            }
            else {
                reject(new Error(`cannot update user ${id}`));
            }
        });
   });
    
}

Users.prototype.deleteUser = function(id) {
    return this.users.deleteOne({_id: id}).
    then(function(results) {
        return new Promise(function(resolve, reject) {
            if (results.deletedCount === 1) {
                resolve();
            }
            else {
                reject(new Error(`cannot delete user ${id}`));
            }
        });
    });
}

module.exports = {
  Users: Users,
};
