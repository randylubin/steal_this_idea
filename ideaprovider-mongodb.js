var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

IdeaProvider = function(host, port) {
  this.db= new Db('steal_my_idea', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

IdeaProvider.prototype.addCommentToIdea = function(ideaId, comment, callback) {
  this.getCollection(function(error, idea_collection) {
    if( error ) callback( error );
    else {
      idea_collection.update(
        {_id: idea_collection.db.bson_serializer.ObjectID.createFromHexString(ideaId)},
        {"$push": {comments: comment}},
        function(error, idea){
          if( error ) callback(error);
          else callback(null, idea)
        });
    }
  });
};

IdeaProvider.prototype.addStealToIdea = function(ideaId, steal, callback) {
  this.getCollection(function(error, idea_collection) {
    if( error ) callback( error );
    else {
      idea_collection.update(
        {_id: idea_collection.db.bson_serializer.ObjectID.createFromHexString(ideaId)},
        {"$push": {steals: steal}},
        function(error, idea){
          if( error ) callback(error);
          else callback(null, idea)
        });
    }
  });
};

//upvote
IdeaProvider.prototype.upvoteIdea = function(ideaId, voter, callback) {
  this.getCollection(function(error, idea_collection) {
    if( error ) callback( error );
    else {
      idea_collection.update(
        {_id: idea_collection.db.bson_serializer.ObjectID.createFromHexString(ideaId)},
        {"$addToSet": {voters: voter.voter}},
        function(error, idea){
          if( error ) callback(error);
          else callback(null, idea)
        });
    }
  });    
};

//getCollection

IdeaProvider.prototype.getCollection= function(callback) {
  this.db.collection('ideas', function(error, idea_collection) {
    if( error ) callback(error);
    else callback(null, idea_collection);
  });
};

//findAll
IdeaProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, idea_collection) {
      if( error ) callback(error)
      else {
        idea_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

//findById

IdeaProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, idea_collection) {
      if( error ) callback(error)
      else {
        idea_collection.findOne({_id: idea_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

IdeaProvider.prototype.findByUser = function(UserId, callback) {
    this.getCollection(function(error, idea_collection) {
      console.log("start");
      userIdq = UserId.toString();
      if( error ) callback(error)
      else {
        idea_collection.find({'username': userIdq}).toArray(function(error, result) {
          console.log(result);
          if( error ) callback(error)
          else callback(null, UserId, result)
        });
      }
    });
};

//save
IdeaProvider.prototype.save = function(ideas, callback) {
    this.getCollection(function(error, idea_collection) {
      if( error ) callback(error)
      else {
        if( typeof(ideas.length)=="undefined")
          ideas = [ideas];

        for( var i =0;i< ideas.length;i++ ) {
          idea = ideas[i];
          idea.created_at = new Date();
          if( idea.steals === undefined ) idea.steals = [];
          if( idea.comments === undefined ) idea.comments = [];
          for(var j =0;j< idea.comments.length; j++) {
            idea.comments[j].created_at = new Date();
          }
        }

        idea_collection.insert(ideas, function() {
          callback(null, ideas);
        });
      }
    });
};

UsersDb = function(host, port) {
  this.db= new Db('steal_my_idea', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

UsersDb.prototype.getCollection= function(callback) {
  this.db.collection('users', function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
};

UsersDb.prototype.upvoteIdea= function(ideaId, ideaTitle, voter, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.update(
          {_id: user_collection.db.bson_serializer.ObjectID.createFromHexString(voter)},
          {"$addToSet": {votes: {id:ideaId, title:ideaTitle}}},
          function(error, idea){
            if( error ) callback(error);
            else callback(null);
          });

      };
    });
};

UsersDb.prototype.findAll = function(callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.find().toArray(function(error, results) {
          console.log(results);
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

exports.IdeaProvider = IdeaProvider;
exports.UsersDb = UsersDb;
