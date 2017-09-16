/**
 * This bootscript removes unprocessed and completed (expired) subscriptions.
 */
'use strict';

module.exports = function(app){
    const jobDate = new Date();

    Subscription.findUnprocessed((err, unprocessedSubscriptions) => {
        unprocessedSubscriptions = unprocessedSubscriptions.map(us => ({id: us.id}));
        const where = {
            or: unprocessedSubscriptions
        };
        Subscription.updateAll(where, {
            ['status']: 'unprocessed'
        }, (err, info) => {
            console.log(info);
            Subscription.destroyAll(where, (err, info) => {
            console.log(info)
            });
        });
    });

    console.log(`Unprocessed subscriptions removed at: ${jobDate}`);

    Subscription.findCompleted((err, completedSubscriptions) => {
        completedSubscriptions = completedSubscriptions.map(us => ({id: us.id}));
        const where = {
          or: completedSubscriptions
        };
        Subscription.updateAll(where, {
          ['status']: 'completed'
        }, (err, info) => {
          console.log(info);
          Subscription.destroyAll(where, (err, info) => {
            console.log(info)
          });
        });
    });

    console.log(`Completed subscriptions removed at: ${jobDate}`);
};
