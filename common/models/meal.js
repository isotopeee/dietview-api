'use strict';

module.exports = function(Meal) {
    var g = require('strong-globalize')();
    var utils = require('../../node_modules/loopback/lib/utils.js');

    var path = require('path');
    var formidable = require('formidable');
    var fs = require('fs');

    /* Static Methods */

    // upload image handler
    Meal.upload = upload;

    /* Remote Methods */

    Meal.remoteMethod(
        'upload', {
            description: 'Upload meal image',
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

    /* Remote Hooks */

    Meal.afterRemote('create', _afterCreateRemoteHookCB);
    Meal.afterRemote('upsert', _afterUpsertRemoteHookCB);

    /* Operation Hooks */
    Meal.observe('before delete', _beforeDeleteOperationHookCB);
    ////////////////////////////////////////////////////////////////////////////

    function _afterCreateRemoteHookCB(ctx, meal, next) {
        var mealItems = ctx.args.data.mealItems;
        mealItems.forEach(function (mealItem) {
            meal.mealItems.add(mealItem.id, function (err) {
                if (err) {
                    next(err);
                }
            });
        });
        next();
    }

    function _afterUpsertRemoteHookCB(ctx, meal, next) {
        var newMealItems = ctx.args.data.mealItems,
            oldMealItems = [],
            mealItemsToRemove = [],
            mealItemsToAdd = [];

        meal.mealItems({}, function (err, mealItems) {
            oldMealItems = mealItems;

            // TODO: Remove oldMealItems not in newMealItems
            oldMealItems.forEach(function (oldMealItem) {
                var idx = newMealItems.findIndex(newMI => newMI.id === oldMealItem.id);
                if (idx === -1) {
                    mealItemsToRemove.push(oldMealItem);
                }
            });


            // TODO: Add newMealItems not in oldMealItems
            newMealItems.forEach(function (newMealItem) {
                var idx = oldMealItems.findIndex(oldMI => oldMI.id === newMealItem.id);
                if (idx === -1) {
                    mealItemsToAdd.push(newMealItem);
                }
            });

            if (mealItemsToAdd.length) {
                console.log('Added meal items.');
                mealItemsToAdd.forEach(function (mealItemToAdd) {
                    meal.mealItems.add(mealItemToAdd.id, function (err) {
                        if (err) {
                            console.error(err);
                            next(err);
                        } else if (mealItemsToRemove.length) {
                            mealItemsToRemove.forEach(function (mealItemToRemove) {
                                meal.mealItems.remove(mealItemToRemove.id, function (err) {
                                    if (err) {
                                        next(err);
                                    }
                                });
                            });
                        }
                    });
                });
            } else if (!mealItemsToAdd.length && mealItemsToRemove.length) {
                console.log('Removed meal items.');
                mealItemsToRemove.forEach(function (mealItemToRemove) {
                    meal.mealItems.remove(mealItemToRemove.id, function (err) {
                        if (err) {
                            next(err);
                        }
                    });
                });
            } else {
                console.log('Meal items not updated.');
            }
            next();
        });
    }

    function _beforeDeleteOperationHookCB (ctx, next) {
        var mealId = ctx.where.id;
        Meal.find({
            where: {
                id: mealId
            }
        }, function (err, meal) {
            meal.forEach(function (meal) {
                meal.mealItems({}, function (err, mealItems) {
                    mealItems.forEach(function (mealItem) {
                        meal.mealItems.remove(mealItem.id, function (err) {
                            if (err) {
                                next(err);
                            }
                        });
                    });
                });
            });
        });
        next();
    }

    function upload (req, fn) {
        fn = fn || utils.createPromiseCallback();

        var form = new formidable.IncomingForm();

        form.uploadDir = './uploads/images/meals';

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
};
