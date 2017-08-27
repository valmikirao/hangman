// modified from auto-generated file

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var cookieEncrypter = require('cookie-encrypter');
var bodyParser = require('body-parser');

// experting from ./rest in es6 fashion,
// so importing the same way
import useRest from './rest';

var app = express();

function logger(request, response, next) {
  console.log('%s %s %s %s %s',
    new Date(),
    request.method,
    request.url,
    JSON.stringify(request.query),
    JSON.stringify(request.body)
  );

  next();
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('OMG So Secret!!!'));
app.use(cookieEncrypter('OMG So Secret!!!'));

app.use(logger);

useRest(app);

app.use('/static-js', express.static('dist/react'))
app.use('/static', express.static('html'))

interface HttpError extends Error {
  status? : number,
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = <HttpError>new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = err;

  // render the error page
  res.status(err.status || 500);

  console.error(err.stack);

  res.render('error');
});

module.exports = app;
