'use strict';

module.exports = function(User) {
    
   /* Remote Hooks */
  
  // create hook
   User.afterRemote('create', function(context, user, next) {
       var options = {
          type: 'email',
          to: user.email,
          from: 'dietviewph@gmail.com',
          subject: 'Thank you for signing up',
          user: User,
          host: 'dietview-api.mybluemix.net',
          port: '443',
          protocol: 'https',
          mailer: User.app.models.Email,
          redirect: 'https://dietview.mybluemix.net/#/'
        };
        
        //send verification email
        user.verify(options, function(err) {
            if(err) {
                User.deleteById(user.id);
                return next(err);
            } 
            return next();
        });   
   });
};
