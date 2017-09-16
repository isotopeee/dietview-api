/**
 * This bootscript acts as a job scheduler using cron module
 */
'use strict';

module.exports = function(app) {
  const CronJob = require('cron').CronJob;
  const Subscription = app.models.Subscription;

  const deleteUnprocessedSubscriptionsJob = new CronJob({
    cronTime: '00 00 01 1-31 0-11 0-6',
    onTick: () => {
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
    },
    onComplete: () => {
      console.error('Removed unprocessed subscriptions job stopped.');
    }
  })

  const deleteCompletedSubscriptionsJob = new CronJob({
    cronTime: '00 43 15 1-31 0-11 0-6',
    onTick: () => {
      const jobDate = new Date();

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
    },
    onComplete: () => {
      console.error('Removed completed subscriptions job stopped.');
    }
  })

  deleteUnprocessedSubscriptionsJob.start();
  deleteCompletedSubscriptionsJob.start();
};
