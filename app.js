
/**
 * Module dependencies.
 */

var express = require('express');
var IdeaProvider = require('./ideaprovider-mongodb').IdeaProvider;
var UsersDb = require ('./ideaprovider-mongodb').UsersDb;

var conf = require('./conf');

var everyauth = require('everyauth')
  , Promise = everyauth.Promise;

everyauth.debug = true;

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

var UserSchema = new Schema({})
  , User;

var mongooseAuth = require('./mongoose_auth_index');

UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , facebook: {
      everyauth: {
          myHostname: 'http://node.randylubin.com'
        , appId: conf.fb.appId
        , appSecret: conf.fb.appSecret
        , redirectPath: '/'

      }
    }

  , password: {
        loginWith: 'login'
      , extraParams: {
          votes: Array,
      //      phone: String,
          name: {
                first: String
              , last: String
            }
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'login.jade'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.jade'
          , loginSuccessRedirect: '/'
          , registerSuccessRedirect: '/'
        }
    }
});
// Adds login: String

mongoose.model('User', UserSchema);

mongoose.connect('mongodb://localhost/steal_my_idea');

User = mongoose.model('User');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
//  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
//next
  app.use(express.cookieParser());
  app.use(express.session({ secret: conf.mongoose.secret}));
  app.use(mongooseAuth.middleware());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

var ideaProvider = new IdeaProvider('localhost', 27017);
var usersDb = new UsersDb('localhost', 27017);

app.get('/', function(req, res){
    ideaProvider.findAll( function(error,ideas){
        res.render('index.jade', { locals: {
            title: 'Steal My Idea',
            ideas:ideas
            }
        });
    })
});

/*
app.post('/posted', function(req, res){
  console.log(req);
  res.render('posted.jade', { locals: {
      title: 'posted',
      info: req
    }
  });
});
*/

app.get('/users', function(req, res){
    usersDb.findAll( function(error,users){
        res.render('users.jade', { locals: {
            title: 'User Directory',
            users: users
            }
        });
    })
});

app.get('/idea/new', function(req, res) {
    res.render('idea_new.jade', { locals: {
        title: 'New Idea'
    }
    });
});

app.post('/idea/new', function(req, res){
    ideaProvider.save({
        title: req.param('title'),
        body: req.param('body'),
        userId: req.param('userId'),
        username: req.param('username'),
        voters: [req.param('userId')]
    }, function( error, ideas) {
        res.redirect('/')
    });
});

app.get('/idea/:id', function(req, res) {
    ideaProvider.findById(req.params.id, function(error, idea) {
        res.render('idea_show.jade',
        { locals: {
            title: idea.title,
            idea:idea
        }
        });
    });
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});



app.get('/user/:userId', function(req, res) {
    ideaProvider.findByUser(req.params.userId, function(error, userId, ideas) {
        res.render('userId_show.jade',
        { locals: {
            userId: userId,
            title: userId,
            ideas:ideas,
        }
        });
    });
});

app.get('/profile/:userId', function(req, res) {
    ideaProvider.findByUser(req.params.userId, function(error, userId, ideas) {
        res.render('profile_show.jade',
        { locals: {
            userId: userId,
            title: userId + "'s Profile",
            ideas:ideas
        }
        });
    });
});

app.post('/idea/upvote', function(req, res){
    usersDb.upvoteIdea(req.param('_id'), req.param('ideaTitle'), req.param('voter'), function(error){console.log('error')});

    ideaProvider.upvoteIdea(req.param('_id'), {
      voter: req.param('voter')
    } , function( error, docs) {
      res.redirect('/idea/' + req.param('_id'))
    });
});

app.post('/idea/addComment', function(req, res) {
    ideaProvider.addCommentToIdea(req.param('_id'), {
        person: req.param('person'),
        comment: req.param('comment'),
        created_at: new Date()
       } , function( error, docs) {
           res.redirect('/idea/' + req.param('_id'))
       });
});

app.post('/idea/addSteal', function(req, res) {
    ideaProvider.addStealToIdea(req.param('_id'), {
        title: req.param('title'),
        link: req.param('link'),
        created_at: new Date()
       } , function( error, docs) {
           res.redirect('/idea/' + req.param('_id'))
       });
});

mongooseAuth.helpExpress(app);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
