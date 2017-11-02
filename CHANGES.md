# Oct 30, 2017
    - Audit login and logout

# Oct 10, 2017
    - Implement social media integration

# Sept 30, 2017
    - Implement Audit Logs

# Sept 10, 2017
    - Remote hook on User.subscription.create to send email
    - Remote hook on Subscription.upsert to send email

# Sept 7, 2017
    - Implement job scheduler to remove expired subscriptions

# August 30, 2017
    - Implement SoftDelete on primary models (MealItem, Meal, MealPlan, and Subscription)

# June 30, 2017
    - Create 'upload' remote method on 'Subscription'
    - Generate new 'LB Angular Services'

# June 28, 2017
    - Redefine 'Subscription' properties
    - Redefine model relationships (hasMany: MealPlan -> Subscription;fk mealPlanId)
    - Generate new 'Angular Services'

# June 24, 2017
    - Create remote hook to implement cascading update on 'MealPlan' model
    - Create observer hooks to implement cascading delete on 'MealPlan' model

# June 23, 2017
    - Redefine model relationships (hasManyThrough: Meal -> TM_MealMealPlan -> MealPlan, MealPlan -> TM_MealMealPlan -> Meal)
    - Create through model for hasManyThrough relationship
    - Create remote hook to implement cascading insert on 'MealPlan model'
    - Generate new 'Angular Services'

# June 22, 2017
    - Create remote hooks to implement cascading create, and update on 'Meal' model
    - Create observer hooks to implement cascading delete on 'Meal' model

# June 13, 2017
    - Rollback node version (4.x) to fix deployment issue
    - Create 'Task' model
    - Generate new 'Angular Services'

# June 12, 2017
    - Specify node version (6.10.2) to fix deployment issue

# June 08, 2017
    - Generate new 'Angular Services'

# June 06, 2017
    - Redefine 'Meal' and 'MealPlan' model
    - Define model relationships (hasAndBelongsToMany: Meal -> MealPlan, Meal -> MealItem)
    - Remove remote hooks and operation hooks of 'Meal' and 'MealPlan' model
    - Fix merge conflicts on dropbox-service implementation

# May 10, 2017
    - Fix URL of change password functionality
