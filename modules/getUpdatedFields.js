//FATOUMATA
//compare properties in the body with the database and return object containing only fields whose value differs
function getUpdatedFields(body, dbDoc, allowedFields) {
  const updatedFields = {};
  allowedFields.forEach((field) => {
    if (
      body[field] !== undefined && // champ présent dans le body
      body[field] !== dbDoc[field] // valeur différente de la base
    ) {
      updatedFields[field] = body[field];
    }
  });
  return updatedFields;
}

module.exports = { getUpdatedFields };
