//----------------------------------------------------------------------------------------------------------------------
// Simple http server for the project.
//
// @module server.js
//----------------------------------------------------------------------------------------------------------------------

var static = require('node-static');

var file = new(static.Server)('./');

//----------------------------------------------------------------------------------------------------------------------

require('http').createServer(function (request, response)
{
    request.addListener('end', function ()
    {
        file.serve(request, response);
    }).resume();
}).listen(9000);

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
}; // end exports

//----------------------------------------------------------------------------------------------------------------------