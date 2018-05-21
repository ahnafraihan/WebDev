// Ahnaf Raihan
// CS480W - Project 1

/* Citations: 
    https://www.w3schools.com/nodejs/nodejs_mongodb.asp
*/

'use strict';

const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = "mongodb://localhost:27017/test_db";

//used to build a mapper function for the update op.  Returns a
//function F = arg => body.  Subsequently, the invocation,
//F.call(null, value) can be used to map value to its updated value.
function newMapper(arg, body) {
  return new (Function.prototype.bind.call(Function, Function, arg, body));
}

//print msg on stderr and exit.
function error(msg) {
  console.error(msg);
  process.exit(1);
}
//export error() so that it can be used externally.
module.exports.error = error;

//auxiliary functions; break up your code into small functions with
//well-defined responsibilities.

function create (url, operation) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
    db.collection(operation.collection).insert(operation.args, function(err, res) {
        if (err) throw err;
    //console.log("Number of documents inserted: " + res.insertedCount);
    db.close();
    });
});
}

function read (url, operation) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
    db.collection(operation.collection).find(operation.args).toArray(function(err, result)  {
        if (err) throw err;
    console.log(result);
    db.close();
  });
});
}

function update (url, operation) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
    // find args
    db.collection(operation.collection).find(operation.args).toArray(function(err, result) {
        if (err) throw err;
    //map function
    var temp
    temp = newMapper(operation.fn[0], operation.fn[1])
    var length = result.length;
    //apply mapped function to found args
    for (var i = 0; i < length; i++) {
        var tempID = result[i]._id
        db.collection(operation.collection).remove({"_id": ObjectId(tempID)});
            if (err) throw err;
        result[i] = temp.call(null, result[i])
        // add id
        result[i]._id = tempID
        //console.log(result[i])
    }
    //add new args
        db.collection(operation.collection).insert(result, function(err, res) {
    //if (err) throw err;
    db.close();
  });
  });
});
}                                                               
             
function remove (url, operation) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
    db.collection(operation.collection).remove(operation.args, function(err, obj) {
        if (err) throw err;
    db.close();
  });
});
}

//perform op on mongo db specified by url.
function dbOp(url, op) {
    //parse JSON file to retrieve op values
    let operation = JSON.parse(op)
    
    if (operation.op === "create") {
        //console.log ("Create.")
        create (url, operation)
    }
    else if (operation.op === "read") {
        //console.log ("Read.")
        read (url, operation)
    }
    else if (operation.op === "update") {
        //console.log ("Update.")
        update (url, operation)
    }
    else if (operation.op === "remove") {
        //console.log ("Delete.")
        remove (url, operation)
    }
    else
        console.error ("Unidentified Operation.")
}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;