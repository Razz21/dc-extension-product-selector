exports.handler = function (event, context, callback) {
  //---- other code

  //Allow CORS in header
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  if (event.httpMethod === 'OPTIONS') {
    // To enable CORS
    return {
      statusCode: 200,
      headers,
      body: 'success',
    };
  }
};
