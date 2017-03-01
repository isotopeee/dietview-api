'use strict';

module.exports = function(Meal) {
  var g = require('strong-globalize')();
  var utils = require('../../node_modules/loopback/lib/utils.js');

  var Dropbox = require('dropbox');
  var path = require('path');
  var formidable = require('formidable');
  var fs = require('fs');

  /* Static Methods */

  // upload image handler
  Meal.upload = function (req, fn) {
    fn = fn || utils.createPromiseCallback();

    var form = new formidable.IncomingForm();
    form.uploadDir = '/temp';
    var dbx = new Dropbox({ accessToken: 'zkRM0L0OfnAAAAAAAAAAJ40hAaWmGQlhKpyw-v6S6UncQfxzhQ6sAugQ07zIsGm5'});
    form.parse(req, function (err, fields, files) {
      dbx.filesUpload({
        path: '/',
        contents: files
      }).then(function (response) {
        fn();
      }).catch(function (err) {
        var error = new Error(g.f('File upload failed.'));
        error.statusCode = 400;
        error.code = 'FILE_UPLOAD_FAILED';
        return fn(error);
      });
    });

    return fn.promise;
  };

  /* Remote Methods */
  Meal.remoteMethod(
    'upload',
    {
      description: 'upload meal image',
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}}
      ],
      http: {verb: 'post', path: '/upload', status: '200'}
    }
  )
};
