'use strict';

module.exports = function(MealPlan) {
  var g = require('strong-globalize')();
  var utils = require('../../node_modules/loopback/lib/utils.js');

  var path = require('path');
  var formidable = require('formidable');
  var fs = require('fs');

  // get reference to the app object
  var app = require('../../server/server');

  /* Static Methods */

  // upload image handler
  MealPlan.upload = upload;
  // food recommendations handler
  MealPlan.recommendations = recommendations;

  /* Remote Methods */

  MealPlan.remoteMethod(
    'upload', {
      description: 'upload meal plan image',
      accepts: [{
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      }],
      returns: [{
        arg: 'path',
        type: 'string'
      }],
      http: {
        verb: 'post',
        path: '/upload',
        status: '200'
      }
    }
  );

  MealPlan.remoteMethod(
    'recommendations', {
      description: 'Get recommended meals',
      accepts: [{
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      }],
      returns: [{
        arg: 'recommendations',
        type: 'array',
      }],
      http: {
        verb: 'get',
        path: '/recommendations',
        status: '200'
      }
    }
  );

  ////////////////////////////////////////////////////////////////////////////
  function upload(req, fn) {
    fn = fn || utils.createPromiseCallback();

    var form = new formidable.IncomingForm();

    form.uploadDir = './uploads/images/meal_plans';

    var new_path = '';

    form.on('file', function(name, file) {
      var name = file.name;
      name = name.slice(0, name.lastIndexOf('.'));
      name = name + '-' + new Date().toJSON() + '.jpg';
      name = name.replace(':', '');
      name = name.replace(':', '');
      new_path = path.join(form.uploadDir, name);

      fs.rename(file.path, new_path);
    });

    form.on('field', function(name, value) {
      console.log('Field received.');
    });

    form.parse(req, function(err, fields, files) {
      if (err) {
        console.log('Upload failed.');
        var error = new Error(g.f('File upload failed.'));
        error.statusCode = 400;
        error.code = 'FILE_UPLOAD_FAILED';
        return fn(error);
      } else {
        console.log('Upload success.');
        fn(null, new_path);
      }
    });

    return fn.promise;
  }

  function recommendations(req, fn) {
    fn = fn || utils.createPromiseCallback();

    var User = app.models.User;
    var userId = req.query.userId;
    User.findById(userId, function(err, user) {
      var age = Number.parseInt((new Date().getFullYear()) -
        (new Date(user.account.profile.birthday).getFullYear()));
      var weight = user.account.vitals.weight / 2.2;
      var height = ((Number.parseInt(user.account.vitals.height.feet * 12)) +
        Number.parseInt(user.account.vitals.height.inches)) * 0.0254;
      var gender = user.account.profile.gender;
      var EER = 0;
      var x = 0;
      var y = 0;
      var exerciseLevel = 0;
      if (gender === 'male') {
        x = (662 - (9.53 * age));
        y = ((15.91 * weight) + (539.6 * height));
        exerciseLevel = 1.0;
        EER = x + (exerciseLevel * y);
      } else if (gender === 'female') {
        x = (354 - (6.91 * age));
        y = ((9.36 * weight) + (726 * height));
        exerciseLevel = 1.0;
        EER = x + (exerciseLevel * y);
      }
      var recommendations = [];
      MealPlan.find(function(err, mealPlans) {
        for (var i = 0; i < mealPlans.length; i++) {
          var margin = mealPlans[i].averageCalories * 0.05;
          var min = mealPlans[i].averageCalories - margin,
            max = mealPlans[i].averageCalories + margin;
          console.log(min, max);
          if (min < EER && EER < max) {
            recommendations.push(mealPlans[i]);
          }
        }
        fn(null, recommendations);
      });
    });
  }
};
