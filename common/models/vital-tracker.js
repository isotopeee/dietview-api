'use strict';

module.exports = function(VitalTracker) {
  var g = require('strong-globalize')();
  var utils = require('../../node_modules/loopback/lib/utils.js');

  // get reference to the app object
  var app = require('../../server/server');

  /* Static Methods */

  VitalTracker.eer = function (req, fn) {
    fn = fn || utils.createPromiseCallback();
        req.query.height = JSON.parse(req.query.height);
        var age = Number.parseInt(req.query.age);
        var weight = Number.parseFloat(req.query.weight / 2.2);
        var height = (((Number.parseInt(req.query.height.feet * 12)) + Number.parseInt(req.query.height.inches)) * 0.0254);
        var gender = req.query.gender;
        var exerciseLevel = Number.parseInt(req.query.exerciseLevel);
        var EER = 0;
        if (gender === 'male') {
            EER = 662 - (9.53 * age) + exerciseLevel * ((15.91 * weight) + (539.6 * height));
        } else if (gender === 'female') {
            EER = 354 - (6.91 * age) + exerciseLevel * ((9.36 * weight) + (726 * height));
        }
        EER = EER.toFixed(2);
        fn(null, EER);
  };

  /* Remote Methods */
  VitalTracker.remoteMethod(
        'eer', {
            description: 'Get daily caloric intake',
            accepts: [{
                arg: 'req',
                type: 'object',
                http: {
                    source: 'req'
                }
            }],
            returns: [{
                arg: 'eer',
                type: 'number',
            }],
            http: {
                verb: 'get',
                path: '/eer',
                status: '200'
            }
        }
    );
};
