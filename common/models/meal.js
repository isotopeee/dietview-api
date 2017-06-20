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

    Meal.afterRemote('create', _afterCreateRemoteHook);

    ////////////////////////////////////////////////////////////////////////////

    function _afterCreateRemoteHook(ctx, meal, next) {
        var mealItems = ctx.args.data.mealItems;
        mealItems.forEach(function (mealItem, index) {
            meal.mealItems.add(mealItem.id, function (err) {
                next(err);
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
