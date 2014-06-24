var mongoose = require( 'mongoose' );
var Cat = mongoose.model( 'Cat' );
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
//exports.test = function(req, res){
//  res.render('test', { title: 'teest', cats: ['a', 'b']});
//};
//exports.questionnaire = function(req, res){
//  res.render('questionnaire', { title: 'Questions'});
//};
// query db for all todo items
exports.questionnaire = function ( req, res ){
  Cat.aggregate([
        { $group: {
            _id: '$breed',
            weightAvg: { $avg: '$weight'}
        }}
    ], function (err, aveWeight) {
        if (err) {
            console.error(err);
        } else {
            console.log(aveWeight);
            Cat.find( function ( err, cats){
              //console.log(cats);
              res.render( 'questionnaire', {
                title : 'Testing',
                cats : cats,
                aveWeight : aveWeight
                
              });
            });
        }
    }
);
  
};

//test write to db
exports.create = function ( req, res ){
  new Cat({
    name    : req.body.txtName,
    weight: req.body.numWeight, 
    breed: req.body.txtBreed
  }).save( function( err, todo, count ){
    res.redirect( '/questionnaire' );
  });
};
