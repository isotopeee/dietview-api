module.exports = function(app){
    /*
    var MealItem = app.models.MealItem;
    importIngredientsData();
    /////////////////////////////////////////////////////////////
    function importIngredientsData() {
        var ingredients = require('../../data/ingredients.json');
        for (var i = 0; i < ingredients.length; i++) {
            MealItem.create(ingredients[i],function (err, obj) {
                console.log("Added %s to ingredients", obj.name);
            });
        };
    };
    */

    /**
     * Bulk update isDeleted property
     */
    /*
    var Subscription = app.models.Subscription;
    Subscription.updateAll({}, {
        ['isDeleted']: false
    }, function(info, err){
        if(err){
            console.error(err);
        } else {
            console.log('Updated Meal Plans instances isDeleted property', info);
        }
    })
    */
};
