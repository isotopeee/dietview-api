'use strict';

const loopback = require('loopback');
const utils = require('../../node_modules/loopback/lib/utils.js');
const g = require('strong-globalize')();
const path = require('path');

module.exports = function(User) {
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
                user.updateAttributes({
                    emailVerified: true
                }, function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    user.save(function (err, obj) {
                        if (err) {
                            return next(err);
                        }
                    });
                });
            }
        } else {
            var options = {
                type: 'email',
                to: user.email,
                from: 'dietviewph@gmail.com',
                subject: 'Thank you for signing up',
                user: User,
                host: 'localhost',
                port: '3000',
                protocol: 'http',
                redirect: 'http://localhost:6001/#/account-verified'
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

    User.afterRemote('*.__create__subscriptions', (context, subscription, next) => {
        const MealPlan = User.app.models.MealPlan;

        const expiryDate = new Date(subscription.subscriptionDate);
        expiryDate.setDate(expiryDate.getDate() + 5);
        
        const filter = {
            where: {
                id: subscription.userId
            }
        };
        User.find(filter, (err, users) => {
            if(err) {
                next(err);
            }
            const customer = users[0];

            filter.where.id = subscription.mealPlanId;
            MealPlan.find(filter, (err, mealPlans) => {
                if(err) {
                    next(err);
                }
                const mealPlan = mealPlans[0];

                const templateData = {
                    expiryDate: expiryDate.toLocaleDateString(),
                    customerName: `${customer.account.profile.firstname} ${customer.account.profile.lastname}`,
                    subscriptionDate: subscription.subscriptionDate.toLocaleDateString(),
                    mealPlan: mealPlan.name,
                    mealPlanPrice: `PHP ${mealPlan.price}.00`,
                    total: `PHP ${mealPlan.price}.00`
                };

                const templateRenderer = loopback.template(path.resolve(__dirname, '../../server/views/subscription/payment.ejs'));
                const emailHTML = templateRenderer(templateData);

                User.app.models.Email.send({
                    to: customer.email,
                    from: 'dietviewph@gmail.com',
                    subject: 'Subscription',
                    html: emailHTML
                }, (err) => {
                    if(err){
                        next(err);
                    }
                });
            });
        });

        next();
    })

    /* Event Handlers */

    //resetPasswordRequest event handler
    User.on('resetPasswordRequest', function(info) {
        var url = 'http://localhost:3000/#/reset-password';
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
