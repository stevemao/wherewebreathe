var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;
var Question = require('../models/question');
var Answer = require('../models/answer');
var authenticateUser = require('./authUser');
var User = require('../models/account').user;

function removeFromUnansweredSession(req, qid, cb){
      var temp = req.session.unanswered;
      index = temp.indexOf(qid);
      temp.splice(index, 1)
      req.session.unanswered = temp;
      if(cb){
        cb();
      }
}

exports.index = function(req, res){
  res.render('index', { title: 'Home', user : req.user});
};
exports.about = function(req, res){
  res.render('about', { title: 'About Where We Breathe', user : req.user});
};
exports.knowledgebase = function(req, res){
  res.render('knowledge-base', { title: 'Knowledge base', user : req.user});
};
exports.vinhud = function(req, res){
  res.render('vinhud', { title: 'Am I looking for a VIN or a HUD number?', user : req.user});
};
exports.questionnaire = function ( req, res ){
  authenticateUser(req, res, function(){  
    //deal with if there is get param for skipq or not
    if (req.params.skipq !== undefined && req.params.skipq !== 0){
      removeFromUnansweredSession(req, req.params.skipq);    
    } 
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+req.params.nextq);
    var query =  {_id: req.session.unanswered[0]};
    //if conditional question prompted by answer to another question
    if (req.params.nextq){
      query = {order: req.params.nextq};
    } 
    //if user has answered all questions currently in DB
    else if (req.session.unanswered <= 0){
      return res.render('login/message', { title: 'Questionnaire complete!', user : req.user, message: {text:"You have answered all of our questions. If you have skipped any questions during this session of the survey, they will be asked to you the next time you login.", msgType: "alert-success"}});
    }
    Question.find(query, function ( err, questions){
      
 
      //if question not found
      if (questions.length <= 0){
        return res.render('login/message', { title: 'Oops!', user : req.user, message: {text:"It doesn't look like there is a question there yet", msgType: "alert-danger"} });
      }//end if question
      
      var question = questions[0];
      //console.log(question);
      pageOptions = {
        user : req.user,
        title: 'Questionnaire',
        question: question.question, 
        label: question.label,
        qType: question.qType,
        qid: question._id        
      }
      //append suggested answers if they exist (mongoose creates empty array it seems even if query returns nothing for answers key)
      if (typeof question.answers !== 'undefined' && question.answers.length > 0){
        pageOptions['answers']= question.answers; 
      }
      
      res.render( 'questionnaire', pageOptions);
    });
  });//end auth user
};
//append answers into answers collection
exports.answer = function ( req, res ){
  //make sure user logged in 
  if(!req.user){
    return res.send(400, "It looks like you have been logged out. please log in again to submit your answer")
  }
  var ans = new Answer({
    qid: req.body.qid,
    uid: req.user._id, 
    a: req.body.answer
  });
  ans.save( function(err, data){
    if (err) {
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 617)")     
    }
    //append qid to users array of answered questions
    User.findByIdAndUpdate(req.user._id, {$push: {answered: req.body.qid}}, function (err, results) {
      if (err) {
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 618)")
      }
      //remove question from session array
      removeFromUnansweredSession(req, req.body.qid, function(){
      var msgResponse = "OK";
      if (req.body.nextq){
        msgResponse = req.body.nextq.toString();
      }
      res.send(200, msgResponse);
      });
    });//end findby...

  });//end ans.save      
}
/**********************************************************************
TEST - remove later
***********************************************************************/
exports.test =  function(req, res) {
   Answer.find({}, function(err, results){
     for (i in results){
     console.log(results[i]._id.getTimestamp());
     }
   });
    res.locals.myVar = 'fjdklfjsdkflsjfkdl';
    res.render('test', { title: 'test', user : req.user, message: null });
    //res.send("x")
    console.log('here');
}
//exports.questionnaire_cat = function ( req, res ){
//  Cat.aggregate([
//        { $group: {
//            _id: '$breed',
//            weightAvg: { $avg: '$weight'}
//        }}
//    ], function (err, aveWeight) {
//        if (err) {
//            console.error(err);
//        } else {
//            console.log(aveWeight);
 //           Cat.find( function ( err, cats){
///              //console.log(cats);
//              res.render( 'questionnaire_cat', {
//                title : 'Cats Test',
//                cats : cats,
//                aveWeight : aveWeight
//                
//              });
//            });
//        }
//    }
//);
  
//};

//test write to db
//exports.create = function ( req, res ){
///  new Cat({
//    name    : req.body.txtName,
//    weight: req.body.numWeight, 
//    breed: req.body.txtBreed
//  }).save( function( err, todo, count ){
//    res.redirect( '/questionnaire_cat' );
//  });
//};
