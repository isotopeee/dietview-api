'use strict';

module.exports = function(User) {
    var utils = require('../../node_modules/loopback/lib/utils.js');
    var g = require('strong-globalize')();

    /* Static Methods */

    //changePassword handler
    User.changePassword = function(body, fn) {
        fn = fn || utils.createPromiseCallback();

        var accessToken = body.accessToken,
            userId = body.userId,
            password = body.password,
            confirmation = body.confirmation;

        if (!accessToken || !userId) {
            var err1 = new Error(g.f('Invalid Token'));
            err1.statusCode = 400;
            err1.code = 'INVALID_TOKEN';
            return fn(err1);
        }

        if (!password ||
            !confirmation ||
            password !== confirmation) {
            var err2 = new Error(g.f('Password do not match'));
            err2.statusCode = '400';
            err2.code = 'PASSWORD_MISMATCH';
            return fn(err2);
        }

        User.findById(userId, function(err, user) {
            if (err) {
                return fn(err);
            }

            user.updateAttribute('password', password, function(err, user) {
                if (err) {
                    return fn(err);
                }
                //remove the token
                var token = new User.app.models.AccessToken({
                    id: accessToken
                });
                token.destroy();
                fn();
            });
        });

        return fn.promise;
    };

    /* Remote Methods */

    //changePassword
    User.remoteMethod(
        'changePassword', {
            description: 'change user password.',
            accepts: [{
                arg: 'body',
                type: 'object',
                required: true,
                http: {
                    source: 'body'
                }
            }],
            http: {
                verb: 'post',
                path: '/reset-password',
                status: '200'
            }
        }
    );

    /* Remote Hooks */

    // create hook
    User.afterRemote('create', function(context, user, next) {

        if (user.account.hasOwnProperty('social')) {
            if (user.account.social.hasOwnProperty('facebook')) {
                // do nothing
            }
        } else {
            var options = {
                type: 'email',
                to: user.email,
                from: 'dietviewph@gmail.com',
                subject: 'Thank you for signing up',
                user: User,
                host: 'dietview-api.mybluemix.net',
                port: '443',
                protocol: 'https',
                redirect: 'https://dietview.mybluemix.net'
            };

            //send verification email
            user.verify(options, function(err) {
                if (err) {
                    User.deleteById(user.id);
                    return next(err);
                }

            });
        }
        return next();
    });

    /* Event Handlers */

    //resetPasswordRequest event handler
    User.on('resetPasswordRequest', function(info) {
        var url = 'https://dietview.mybluemix.net/#/password-reset';
        var html = 'Click <a href="' + url + '?access_token=' + info.accessToken.id +
            '&user_id=' + info.accessToken.userId +
            '">here </a> to reset your password';

        //send email
        User.app.models.Email.send({
            to: info.email,
            from: info.email,
            subject: 'Password reset',
            html: html
        }, function(err) {
            if (err) {
                return console.error('> error sending password reset email');
            }
        });
    });
};
