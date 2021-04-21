require('dotenv').config();
require('./mongo.js');
const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const app = express();
const cors = require('cors');
const Note = require('./models/Note');

const requestLogger = require('./middlewares/logger');
const notFound = require('./middlewares/notFound');
const handleErrors = require('./middlewares/handleErrors.js');

app.use(cors());
app.use(express.json());
app.use(requestLogger);

Sentry.init({
  dsn:
    'https://a9bdc109491145b298dfd8d1e51c34b9@o575858.ingest.sentry.io/5728699',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());
app.get('/', (request, response) => {
  response.send('<H1>Hola mundo</H1>');
});

app.get('/api/notes', (request, response) => {
  Note.find({}).then((notes) => {
    response.json(notes);
  });
});

app.get('/api/notes/:id', (request, response, next) => {
  const id = request.params.id;
  Note.findById(id)
    .then((note) => {
      return note ? response.json(note) : response.status(404).end();
    })
    .catch((err) => next(err));
});
app.put('/api/notes/:id', (request, response, next) => {
  const { id } = request.params.id;
  const note = request.body;

  const noteUpdate = {
    content: note.content,
    important: note.important,
  };

  Note.findByIdAndUpdate(id, noteUpdate, { new: true })
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      next(err);
    });
});

app.delete('/api/notes/:id', (request, response, next) => {
  const { id } = request.params.id;
  Note.findByIdAndDelete(id)
    .then(() => {
      response.status(204).end();
    })
    .catch((err) => {
      next(err);
    });
});

app.post('/api/notes', (request, response) => {
  const note = request.body;

  if (!note || !note.content) {
    return response.status(400).json({
      error: 'note.content is missing ',
    });
  }

  const newNote = new Note({
    content: note.content,
    date: new Date(),
    important: note.important || false,
  });

  newNote.save().then((savedNote) => {
    response.json(savedNote);
  });
});

app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + '\n');
});

app.use(notFound);
app.use(handleErrors);

const PORT = process.env.PORT || 3001;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
