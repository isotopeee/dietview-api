/* define custom express routes here */

module.exports = function(app) {
    var Conversation = require('watson-developer-cloud/conversation/v1');

    var conversation = new Conversation({
        username: 'dee4175c-8d9a-470f-a5a4-eee85f25b0dd',
        password: 'q4y1ihZoVMk1',
        version: 'v1',
        version_date: '2017-02-03'
    });

    // Replace with the context obtained from the initial request
    var context = {};

    // CUSTOM EXPRESS ROUTES

    // BOT ENDPOINT
    app.get('/api/bot', function(req, res) {
        var q = req.query.q;
        console.log(q);
        conversation.message({
            workspace_id: 'c19b140a-a850-4dc7-bc0e-9e2d21cd11fa',
            input: {
                'text': 'hi'
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
