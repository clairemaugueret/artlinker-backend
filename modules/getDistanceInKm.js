//CLAIRE
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { getDistanceInKm };

//EXPLICATION :
//Cette fonction permet de calculer la distance entre deux points géographiques
//Pour utiliser cette fonction, il faut lui fournir 4 arguments : lat1, lon1 (d'une point A) et lat2, lon2 (d'un point B)
//Elle renvoie un nombre qui est égale la distance entre ces deux points en km

//exemple d'utilisation :
// const distance = getDistanceInKm(lat1, lon1, lat2, lon2);
// console.log(`La distance entre A et B est de ${distance}.toFixed(2) km`);
//NB: .toFixed(2) permet d'afficher la distance avec 2 chiffres après la virgule
