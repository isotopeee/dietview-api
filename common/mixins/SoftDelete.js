'use strict';

module.exports  = function(Model, options) {
    /**
     * This mixins have 2 properties, deletedAt and isDeleted
     * deleteAt stores timestamp
     * isDeleted is a boolean that indicates that a row or data has been deleted
     */
    Model.defineProperty('deletedAt', {
        type: Date,
        required: false
    });

    Model.defineProperty('isDeleted', {
        type: Boolean,
        required: true,
        default: false
    });

    /**
     * Soft Delete, this will set a row or data that is considered deleted
     * 
     * @param   {object}    where   Where Filter
     * @param   {function}  cb      Async Callback
     */
    Model.destroyAll = function(where, cb) {
        Model.updateAll(where, {
            ['deletedAt']: new Date(),
            ['isDeleted']: true
        })
        .then(result => (typeof cb === 'function') ? cb(null, result) : result)
        .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
    }

    Model.remove = Model.destroyAll;
    Model.deleteAll = Model.destroyAll;

    /**
     * Soft Delete, this will set a row or data that is considered deleted
     * 
     * @param   {object}    where   Where Filter
     * @param   {function}  cb      Async Callback
     */
    Model.deleteById = function(id, cb) {
        Model.updateAll({id: id}, {
            ['deletedAt']: new Date(),
            ['isDeleted']: true
        })
        .then(result => (typeof cb === 'function') ? cb(null, result[0]) : result[0])
        .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error)); 
    }

    Model.removeById = Model.deleteById;
    Model.destroyById = Model.deleteById;

    /**
     * Find
     * This will defaultly search for isDeleted = false
     * 
     * 
     * @param   {object}    where   Where filter
     * @param   {function}  cb      Async Callback     
     */
    const _find = Model.find;
    Model.find = function(filter = {}, ...args) {
        
        if (!filter.where) filter.where = {};

        if (!filter.includeDeleted) {
            filter.where = {
                and: [filter.where, {
                    'isDeleted': false
                }]
            }
        } 
        
        console.log("filter:", JSON.stringify(filter));
        return _find.call(Model, filter, ...args);
    }
}