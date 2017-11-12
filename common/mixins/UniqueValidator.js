module.exports = function(Model, {properties}) {
    /**
     * This mixins validate the unique properties of a model
     */

    for (property of properties) {
        if (typeof property === 'object') {
            Model.validatesUniquenessOf(property.field, { message: property.message })
        } else {
            Model.validatesUniquenessOf(property, {message: `${property} is not unique`})
        }
    }
}