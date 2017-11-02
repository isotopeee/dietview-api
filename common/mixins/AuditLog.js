'use strict';

module.exports = function(Model, options) {
    /**
     * This mixins enables audit logs on models
     */
    const app = require('../../server/server');
    const EVENT_TYPES = {
        UPDATE: 'update',
        CREATE: 'create',
        SOFT_DELETE: 'soft_delete',
        READ: 'read',
        LOGIN: 'login',
        LOGOUT: 'logout'
    }

    Model.afterRemote('create', function (ctx, modelInstance, next) {
        const AuditLog = app.models.AuditLog;
        
        const token = ctx.req.accessToken;
        const userId = token && token.userId;
        const user = userId ? userId : 'anonymous';

        const auditLog = {
            userId: user,
            eventDate: new Date(),
            eventType: EVENT_TYPES.CREATE,
            description: `${EVENT_TYPES.CREATE.toUpperCase()} ${modelInstance.constructor.definition.name} ${modelInstance.name || modelInstance.id}`
        };

        AuditLog.create(auditLog, (err, auditLog) => {
            if (err){
                next(err);
            }
        });

        next();
    });

    Model.afterRemote('upsert', function (ctx, modelInstance, next) {
        const AuditLog = app.models.AuditLog;
        
        const token = ctx.req.accessToken;
        const userId = token && token.userId;
        const user = userId ? userId : 'anonymous';

        const auditLog = {
            userId: user,
            eventDate: new Date(),
            eventType: EVENT_TYPES.UPDATE,
            description: `${EVENT_TYPES.UPDATE.toUpperCase()} ${modelInstance.constructor.definition.name} ${modelInstance.name || modelInstance.id}`
        };


        AuditLog.create(auditLog, (err, auditLog) => {
            if (err){
                next(err);
            }
        });

        next();
    });

    Model.afterRemote('deleteById', function (ctx, modelInstance, next) {
        const AuditLog = app.models.AuditLog;

        const token = ctx.req.accessToken;
        const userId = token && token.userId;
        const user = userId ? userId : 'anonymous';
        const idToDelete = ctx.req.params.id;
        const modelName = Model.modelName;

        const auditLog = {
            userId: user,
            eventDate: new Date(),
            eventType: EVENT_TYPES.SOFT_DELETE,
            description: `${EVENT_TYPES.SOFT_DELETE.toUpperCase()} ${modelName} record: ID=${idToDelete}`
        };

        AuditLog.create(auditLog, (err, auditLog) => {
            if (err){
                next(err);
            }
        });

        next();
    });

    Model.afterRemote('login', function(ctx, {userId}, next) {
        const AuditLog = app.models.AuditLog;

        const auditLog = {
            userId: userId,
            eventDate: new Date(),
            eventType: EVENT_TYPES.LOGIN,
            description: 'User login'
        };

        AuditLog.create(auditLog, (err, auditLog) => {
            if (err) {
                next(err)
            }
        });
        next();
    });

    Model.afterRemote('logout', function (ctx, modelInstance, next) {
        const AuditLog = app.models.AuditLog;

        const token = ctx.req.accessToken;
        const userId = token && token.userId;

        const auditLog = {
            userId: userId,
            eventDate: new Date(),
            eventType: EVENT_TYPES.LOGOUT,
            description: 'User logout'
        };

        AuditLog.create(auditLog, (err, auditLog) => {
            if (err) {
                next(err)
            }
        });
        
        next();
    });
}