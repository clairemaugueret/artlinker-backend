const mongoose = require("mongoose"); // Permet de gérer la connexion à MongoDB
const request = require("supertest"); // Permet de simuler des requêtes HTTP pour tester l'API
const app = require("./app"); // Importe l'application Express

const connectionString = process.env.CONNECTION_STRING; // Récupère la chaîne de connexion MongoDB depuis le .env

// Avant tous les tests, on connecte mongoose à la base de données
beforeAll(async () => {
  await mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Database connected");
});

// Test principal : vérifie la route POST /places/all
it("POST /places/all", async () => {
  // On envoie une requête POST avec des coordonnées GPS situées à Toulouse
  const res = await request(app).post("/places/all").send({
    latitude: 43.60407,
    longitude: 1.4338,
  });

  // Affiche la réponse pour debug
  console.log(res.body);

  // Vérifie que la réponse HTTP est bien 200 (succès)
  expect(res.statusCode).toBe(200);

  // Vérifie que la propriété 'result' est true
  expect(res.body.result).toBe(true);

  // Récupère la liste des noms des lieux retournés
  const names = res.body.placesList.map((place) => place.name);

  // Vérifie que "Atelier de Raph" (situé à moins de 50km) est bien présent dans la liste
  expect(names).toContain("Atelier de Raph (Test)");

  // Vérifie que "Atelier de Claire" (qui est à plus de 50km) n'est PAS présent dans la liste
  expect(names).not.toContain("Atelier de Claire (Test)");
});

// Après tous les tests, on ferme la connexion à la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
