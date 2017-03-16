/* define custom express routes here */

module.exports = function(app) {
    var Conversation = require('watson-developer-cloud/conversation/v1');

    var conversation = new Conversation({
        username: 'f7c41b99-4861-46bd-8bde-b3ec63bdb9fb',
        password: 'Ra4QwAOcBbdF',
        version: 'v1',
        version_date: '2017-02-03'
    });

    // CUSTOM EXPRESS ROUTES

    // BOT ENDPOINT
    app.get('/api/bot', function(req, res) {
        // Replace with the context obtained from the initial request
        var context = {};

        var q = req.query.q;
        conversation.message({
            workspace_id: '1c840e7a-6de6-4933-8dde-154a2bbcf81c',
            input: {
                'text': q
            },
            context: context
        }, function(err, response) {
            if (err) {
                console.log(err);
            } else {
                var message = response.output.text[0];
                context = response.context;
                res.send(message);
            }
        });
    });
};
