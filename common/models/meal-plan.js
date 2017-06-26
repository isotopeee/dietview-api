'use strict';

module.exports = function(MealPlan) {
  var g = require('strong-globalize')();
  var utils = require('../../node_modules/loopback/lib/utils.js');

  var path = require('path');
  var formidable = require('formidable');
  var fs = require('fs');
  const DbService = require('../helper/dropbox-service');

  // get reference to the app object
  var app = require('../../server/server');

  /* Static Methods */

  MealPlan.upload = upload;
  MealPlan.recommendations = recommendations;
  MealPlan.uploadWithDB = uploadWithDB;

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

  MealPlan.remoteMethod('uploadWithDB', {
      http: { path: '/uploadWithDB', verb: 'get' },
      returns: [
          { arg: 'path', type: 'string' }
      ]
  });

  /* Remote Hooks */

  MealPlan.afterRemote('create', _afterCreateRemoteHookCB);
  MealPlan.afterRemote('upsert', _afterUpsertRemoteHookCB);

  /* Operation Hooks */

  MealPlan.observe('before delete', _beforeDeleteOperationHookCB);

  ////////////////////////////////////////////////////////////////////////////

  function _afterCreateRemoteHookCB(ctx, mealPlan, next) {
    // TODO: Perform cascade insert on related meals
    var meals = ctx.args.data.meals;
    var throughModel = MealPlan.app.models.TM_MealMealPlan;
    var mealPlanMeals = [];
    var mealPlanMeal = null;
    meals.forEach(function (meal, index) {
      mealPlanMeal = {
        mealId: meal.breakfast.id,
        mealPlanId: mealPlan.id,
        day: index + 1
      };

      mealPlanMeals.push(mealPlanMeal);

      mealPlanMeal = {
        mealId: meal.lunch.id,
        mealPlanId: mealPlan.id,
        day: index + 1
      };

      mealPlanMeals.push(mealPlanMeal);

      mealPlanMeal = {
        mealId: meal.dinner.id,
        mealPlanId: mealPlan.id,
        day: index + 1
      };

      mealPlanMeals.push(mealPlanMeal);

      if (meal.snack) {
        mealPlanMeal = {
          mealId: meal.snack.id,
          mealPlanId: mealPlan.id,
          day: index + 1
        };

        mealPlanMeals.push(mealPlanMeal);
      }
    });

    throughModel.create(mealPlanMeals, function (err, mealPlanMeals) {
      if (err) {
        next(err);
      }
      console.log(mealPlanMeals);
    });
    console.log('MEALS');
    console.log(meals);
    next();
  }

  function _afterUpsertRemoteHookCB(ctx, mealPlan, next) {
    var i,
        mealPlanId = ctx.args.data.id,
        mealPlanMeal = null,
        newMealPlanMeals = ctx.args.data.meals,
        oldMealPlanMeals = [],
        mealPlanMealsToRemove = [],
        mealPlanMealsToAdd = [],
        throughModel = MealPlan.app.models.TM_MealMealPlan,
        filter = {
          where: {
            mealPlanId: mealPlanId
          },
          include: {
            relation: 'meal',
            scope: {
              fields: ['type']
            }
          },
          order: 'day ASC'
        };
    // IDEA: Fetch meals of mealPlan, include meal object and sort by day (ASC)
    throughModel.find(filter, function (err, mealPlanMeals) {
      if (err) {
        next(err);
      }

      // IDEA: Store last item in mealPlanMeals
      var lastItem = mealPlanMeals[mealPlanMeals.length - 1];

      // IDEA: Populate oldMealPlanMeals with object with null values
      for (i = 0; i < lastItem.day; i++) {
        mealPlanMeal = {
          breakfast: null,
          lunch: null,
          dinner: null,
          snack: null
        };
        oldMealPlanMeals.push(mealPlanMeal);
      }

      // IDEA: Make oldMealPlanMeals data symetric to newMealPlanMeals
      mealPlanMeals.forEach(function (mealPlanMeal) {
        // IDEA: Lazy load meal data on mealPlanMeal
        oldMealPlanMeals[mealPlanMeal.day - 1][mealPlanMeal.meal().type] = {
          mealPlanMealId: mealPlanMeal.id,
          id: mealPlanMeal.mealId,
          day: mealPlanMeal.day
        };
      });

      // IDEA: Populate mealPlanMealsToRemove & mealPlanMealsToAdd
      for (i = 0; i < oldMealPlanMeals.length; i++) {
        // IDEA: Iterate through each mealTime (breakfast, lunch, dinner, snack)
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function (mealTime) {
          // IDEA: Check IF oldMealPlanMeals & newMealPlanMeals is not null
          if (oldMealPlanMeals[i][mealTime] && newMealPlanMeals[i][mealTime]) {
            // IDEA: Check IF the mealId for the current mealTime of oldMealPlanMeals & newMealPlanMeals was changed
            if (oldMealPlanMeals[i][mealTime].id !== newMealPlanMeals[i][mealTime].id) {
              // IDEA: IF changed, add the current oldMealPlanMeal mealPlanId to mealPlanMealsToRemove...
              mealPlanMealsToRemove.push(oldMealPlanMeals[i][mealTime].mealPlanMealId);
              // IDEA: ...THEN, create a mealPlanMeal object to persist by throughModel
              mealPlanMeal = {
                mealId: newMealPlanMeals[i][mealTime].id,
                mealPlanId: mealPlanId,
                day: oldMealPlanMeals[i][mealTime].day
              };
              // IDEA: ADD the created mealPlanMeal object to mealPlanMealsToAdd
              mealPlanMealsToAdd.push(mealPlanMeal);
            }
            // IDEA: Check IF oldMealPlanMeals is null & newMealPlanMeals is not null
          } else if (!oldMealPlanMeals[i][mealTime] && newMealPlanMeals[i][mealTime]) {
            // IDEA: Create a mealPlanMeal object to persist by throughModel
            mealPlanMeal = {
              mealId: newMealPlanMeals[i][mealTime].id,
              mealPlanId: mealPlanId,
              day: i + 1
            };
            // IDEA: ADD the created mealPlanMeal object to mealPlanMealsToAdd
            mealPlanMealsToAdd.push(mealPlanMeal);
            // IDEA: Check IF oldMealPlanMeals is not null & newMealPlanMeals is null
          } else if (oldMealPlanMeals[i][mealTime] && !newMealPlanMeals[i][mealTime]) {
            // IDEA: ADD the current oldMealPlanMeal mealPlanId to mealPlanMealsToRemove
            mealPlanMealsToRemove.push(oldMealPlanMeals[i][mealTime].mealPlanMealId);
          }
        });
      }
      console.log('ADD');
      console.log(mealPlanMealsToAdd);
      console.log('REMOVE');
      console.log(mealPlanMealsToRemove);

      // IDEA: Perform bulk create to persist newMealPlanMeals to throughModel
      throughModel.create(mealPlanMealsToAdd, function (err, mealPlanMealsToAdd) {
        if (err) {
          next(err);
        }
        console.log(mealPlanMealsToAdd);
      });

      // IDEA: Remove oldMealPlanMeals from throughModel
      mealPlanMealsToRemove.forEach(function (mealPlanMealId) {
        throughModel.destroyById(mealPlanMealId, function (err) {
          if (err) {
            next(err);
          }
        });
      });
    });
    next();
  }

  function _beforeDeleteOperationHookCB(ctx, next) {
    var mealPlanId = ctx.where.id,
        throughModel = MealPlan.app.models.TM_MealMealPlan;
    // IDEA: Perform bulk delete using throughModel
    throughModel.destroyAll({mealPlanId: mealPlanId}, function (err) {
      if (err) {
        next(err);
      }
    });
    next();
  }

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

  function uploadWithDB(fn) {
    var file = './data/powered-by-LB-xs.png';
    var filename = 'lbpic.png';
    DbService.uploadFile(file, filename, function(data){
        fn(null, data);
    });
  }
};
