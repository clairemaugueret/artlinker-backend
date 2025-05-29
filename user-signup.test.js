const mongoose = require("mongoose");
const request = require("supertest");
const app = require("./app");

const connectionString = process.env.CONNECTION_STRING;

beforeAll(async () => {
  await mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Database connected");
});

it("POST /users/signup", async () => {
  // Cas 1 : tous les champs vides
  let res = await request(app).post("/users/signup").send({});
  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(false);
  expect(res.body.error).toBe("Champs vides ou manquants.");

  // Cas 2 : un champ manquant
  res = await request(app).post("/users/signup").send({
    firstname: "Test",
    lastname: "User",
    // email manquant
    password: "1234",
  });
  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(false);
  expect(res.body.error).toBe("Champs vides ou manquants.");
});

it("POST /users/signup", async () => {
  const res = await request(app).post("/users/signup").send({
    firstname: "Raphaël",
    lastname: "Bergère",
    email: "raphael.bergere@hotmail.fr",
    password: "1234",
  });
  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(false);
});

// Création d'un user avec un email unique
it("POST /users/signup", async () => {
  // Génère un email aléatoire à chaque test
  const randomEmail = `testuser_${Date.now()}@test.com`;
  const res = await request(app).post("/users/signup").send({
    firstname: "Test",
    lastname: "User",
    email: randomEmail,
    password: "1234",
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(true);

  // Vérifie la présence de userInfo et ses champs attendus
  expect(res.body.userInfo).toBeDefined();
  expect(res.body.userInfo).toHaveProperty("token");
  expect(res.body.userInfo).toHaveProperty("email", randomEmail);
  expect(res.body.userInfo).toHaveProperty("firstname", "Test");
  expect(res.body.userInfo).toHaveProperty("lastname", "User");
  expect(res.body.userInfo).toHaveProperty("favoriteItems");
  expect(Array.isArray(res.body.userInfo.favoriteItems)).toBe(true);
  expect(res.body.userInfo).toHaveProperty("hasSubscribed", false);
  expect(res.body.userInfo).toHaveProperty("authorisedLoans", 0);
  expect(res.body.userInfo).toHaveProperty("ongoingLoans", 0);
});

afterAll(async () => {
  await mongoose.disconnect();
});
