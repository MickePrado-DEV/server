module.exports = (error, request, response, next) => {
  console.error(error);
  if (error.name == 'CastError') {
    response.status(400).sentd({
      error: 'El id no corresponde con el de algun registro',
    });
  } else {
    response.status(500).end();
  }
};
