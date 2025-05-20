//CLAIRE
function checkBody(body, fields) {
  return fields.every((eachField) => body[eachField]);
}

module.exports = { checkBody };
