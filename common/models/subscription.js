'use strict';

module.exports = function(Subscription) {
  var g = require('strong-globalize')();
  var utils = require('../../node_modules/loopback/lib/utils.js');
  var path = require('path');
  var formidable = require('formidable');
  var fs = require('fs');

  /* Static Methods */
  Subscription.findCompleted = findCompleted;
  Subscription.findExpired = findExpired;
  Subscription.findUnprocessed = findUnprocessed;
  
  Subscription.upload = upload;

  Subscription.remoteMethod(
    'findCompleted', {
      description: 'Find completed active subscriptions.',
      returns: [{
        type: 'array',
        root: true
      }],
      http: {
        verb: 'get',
        path:'/findCompleted',
        status: '200'
      }
    }
  )

  Subscription.remoteMethod(
    'findExpired', {
      description: 'Find expired unprocessed and completed active subscriptions.',
      returns: [{
        type: 'array',
        root: true
      }],
      http: {
        verb: 'get',
        path: '/findExpired',
        status: '200'
      }
    }
  )

  Subscription.remoteMethod(
    'findUnprocessed', {
      description: 'Find expired unprocessed subscriptions.',
      returns: [{
        type: 'array',
        root: true
      }],
      http: {
        verb: 'get',
        path: '/findUnprocessed',
        status: '200'
      }
    }
  )

  Subscription.remoteMethod(
    'upload', {
      description: 'upload subscription payment details',
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

  //////////////////////////////////////////////////////////////////////////////

  function findCompleted(cb) {
    cb = cb || utils.createPromiseCallback();

    const filter = {
      where: {
        status: 'active'
      },
      order: 'endDate DESC'
    };
    Subscription.find(filter, (err, completedSubscriptions) => {
      let subscriptionsToDelete = completedSubscriptions.filter(cs => {
        const now = new Date();
        return now > cs.endDate;
      });
      cb(null, subscriptionsToDelete);
    });

    return cb.promise;
  }

  function findExpired(cb) {
    cb =  cb || utils.createPromiseCallback();

    Subscription.findUnprocessed((err, pendingSubscriptions) => {
      Subscription.findCompleted((err,completedSubscriptions) => {
        const subscriptionsToDelete = [...pendingSubscriptions, ...completedSubscriptions];
        cb(null, subscriptionsToDelete);
      })
    })

    return cb.promise;
  }

  function findUnprocessed(cb) {
    cb = cb || utils.createPromiseCallback();

    const filter = {
      where: {
        status: 'pending'
      },
      order: 'subscriptionDate DESC'
    };
    Subscription.find(filter, (err, pendingSubscriptions) => {
      let subscriptionsToDelete = pendingSubscriptions.filter(ps => {
        const now = new Date();
        let subscriptionDate = ps.subscriptionDate.getDate();
        ps.subscriptionDate.setDate(subscriptionDate + 8);
        return now > ps.subscriptionDate;
      });
      cb(null, subscriptionsToDelete);
    });
    
    return cb.promise;
  }

  function upload(req, fn) {
    fn = fn || utils.createPromiseCallback();

    var form = new formidable.IncomingForm();

    form.uploadDir = './uploads/images/subscriptions';

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
