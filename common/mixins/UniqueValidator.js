module.exports = function(Model, {properties}) {
    /**
     * This mixins validate the unique properties of a model
     */

    for (property of properties) {
        Model.validatesUniquenessOf(property, {message: `${property} is not unique`})
    }
}