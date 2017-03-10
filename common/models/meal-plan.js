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
    MealPlan.upload = function(req, fn) {
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
    };

    MealPlan.recommendations = function (req, fn) {
        var User = app.models.User;
        User.findById(userId, function (err, user) {
             var age = (new Date().getFullYear()) - (new Date(user.account.profile.birthday).getFullYear());
             var weight = user.account.vitals.weight / 2.2;
             var height = ((user.account.feet * 12) + user.account.inches) * 0.0254;
             var gender = user.account.profile.gender;
             var EER = 0;
             if (gender === 'male') {
                 EER = 662 - (9.53 * age) + 1.8 * ((15.91 * weight) + (539.6 * height));
             } else if (gender === 'female') {
                 EER = 354 - (6.91 * age) + 1.8 * ((9.36 * weight) + (726 * height));
             }

             var recommendations = [];
             MealPlan.find(function (err, mealPlans) {
                for (var i = 0; i < mealPlans.length; i++) {
                    var margin = mealPlans[i].averageCalories *.05;
                    var min = mealPlans[i].averageCalories - margin,
                        max = mealPlans[i].averageCalories + margin;
                    if (min < ERR && ERR < max) {
                        recommendations.push(mealPlans);
                    }
                }
             });

             fn(null, recommendations);
        });
    };

    /* Remote Methods */

    MealPlan.remoteMethod(
        'upload', {
            description: 'upload meal plan image',
            accepts: [{
                arg: 'userId',
                type: 'string'
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

    /* Remote Hooks */

    MealPlan.afterRemote('create', function(ctx, mealPlan, next) {
        // get reference to Meal model
        var Meal = app.models.Meal;
        for (var i = 0; i < mealPlan.meals.length; i++) {
            Meal.findById(mealPlan.meals[i].id, function(err, meal) {
                if (err) {
                    console.error(err);
                }
                var mealPlans = meal.mealPlans;
                var mp = {
                    id: mealPlan.id,
                    code: mealPlan.code,
                    name: mealPlan.name
                };
                if (mealPlans) {
                    mealPlans.push(mp);
                } else {
                    mealPlans = [mp];
                }
                meal.updateAttributes({
                    mealPlans: mealPlans
                }, function(err, meal) {
                    if (err) {
                        console.error(err);
                    }
                });
            });
        }
        next();
    });

    /* Operation Hooks */

    MealPlan.observe('before delete', function(ctx, next) {
        var Meal = app.models.Meal;
        var mealPlanId = ctx.where.id;
        // retrieve meal plan record to be deleted
        MealPlan.findById(mealPlanId, function(err, mealPlan) {
            for (var i = 0; i < mealPlan.meals.length; i++) {
                // retrieve meal records
                Meal.findById(mealPlan.meals[i].id, function(err, meal) {
                    // get index of mealPlanId to be deleted
                    var mealPlanIndex = 0;
                    for (var i = 0; i < meal.mealPlans.length; i++) {
                        if (mealPlanId === meal.mealPlans[i].id) {
                            mealPlanIndex = i;
                            break;
                        }
                    }
                    meal.mealPlans.splice(mealIndex, 1);
                    meal.updateAttributes({
                        mealPlans: meal.mealPlans
                    }, function(err, meal) {
                        if (err) {
                            console.error(err);
                        }
                        meal.save(function(err, obj) {
                            if (err) {
                                console.error(err);
                            }
                            // TODO: delete image from ./uploads folder
                        });
                    });
                });
            }
        });
        next();
    });
};
