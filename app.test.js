const mongoose = require("mongoose");
const request = require("supertest");
const app = require("./app");

const connectionString = process.env.CONNECTION_STRING;

const Users = require("./models/users");

beforeAll(async () => {
  await mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Database connected");
});

//CLAIRE
//Test pour tester la route PUT /subscriptions/update
describe("PUT /subscriptions/update", () => {
  it("Empty fields", async () => {
    const res = await request(app).put("/subscriptions/update").send({
      token: "onlyfield", // envoi seulement du token
    });

    expect(res.body.result).toBe(false);
    expect(res.body.error).toMatch(/Champs vides ou manquants./);
  });

  it("User not found", async () => {
    const res = await request(app).put("/subscriptions/update").send({
      token: "invalidtoken",
      subscriptionType: "INDIVIDUAL_BASIC_COST",
      count: 2,
      price: 180,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toMatch(/Utilisateur non trouvé./);
  });

  it("User found and subscription updated", async () => {
    const res = await request(app).put("/subscriptions/update").send({
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo", // token de l'utilisateur User Test existant dans la base de données
      subscriptionType: "INDIVIDUAL_BASIC_COST",
      count: 3,
      price: 250,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.message).toMatch(/Abonnement mis à jour./);

    const user = await Users.findOne({
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo", // token de l'utilisateur User Test existant dans la base de données
    });
    expect(user.subscription).toBeDefined();
    expect(user.subscription.subscriptionType).toBe("INDIVIDUAL_BASIC_COST");
    expect(user.subscription.worksCount).toBe(3);
    expect(user.subscription.price).toBe(250);
    expect(user.subscription.durationMonth).toBe(12);
    expect(new Date(user.subscription.calculatedEndDate) > new Date()).toBe(
      true
    );
  });

  it("User re-updated for future/other tests", async () => {
    const res = await request(app).put("/subscriptions/update").send({
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo", // token de l'utilisateur User Test existant dans la base de données
      subscriptionType: "INDIVIDUAL_BASIC_COST",
      count: 3,
      price: 250,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.message).toMatch(/Abonnement mis à jour./);
  });
});

//CLAIRE
//Test pour tester la route PUT /users/update
describe("PUT /users/update", () => {
  it("Token missing", async () => {
    const res = await request(app).put("/users/update").send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toMatch(/Token is required/);
  });

  it("User not found", async () => {
    const res = await request(app).put("/users/update").send({
      token: "invalidtoken", // envoi seulement du token
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toMatch(/User not found/);
  });

  it("No changes detected", async () => {
    const res = await request(app).put("/users/update").send({
      //utilisation du User Test déjà existant dans la base de données
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo",
      firstname: "User",
      lastname: "Test",
      phone: "0612345678",
      address: "12 rue des Lilas, 75012 Paris",
      avatar: "",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(false);
    expect(res.body.message).toMatch(/Aucun changement détecté./);
  });

  it("One field modified", async () => {
    const res = await request(app).put("/users/update").send({
      //utilisation du User Test déjà existant dans la base de données
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo",
      firstname: "UserModified", // seul champ modifié
      lastname: "Test",
      phone: "0612345678",
      address: "12 rue des Lilas, 75012 Paris",
      avatar: "",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.message).toMatch(
      /Information\(s\) personnelle\(s\) modifiée\(s\)\./
    );
    expect(res.body.userInfo).toHaveProperty("firstname", "UserModified"); // champ modifié
    expect(res.body.userInfo).not.toContain("Test"); //champ non modifié donc non renvoyé
  });

  it("Several fields modified", async () => {
    const res = await request(app).put("/users/update").send({
      //utilisation du User Test déjà existant dans la base de données
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo",
      firstname: "UserModified",
      lastname: "TestModified", // modification
      phone: "0612345678Modified", // modification
      address: "12 rue des Lilas, 75012 Paris",
      avatar: "",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.message).toMatch(
      /Information\(s\) personnelle\(s\) modifiée\(s\)\./
    );
    expect(res.body.userInfo).toHaveProperty("lastname", "TestModified"); //champ modifié
    expect(res.body.userInfo).toHaveProperty("phone", "0612345678Modified"); //champ modifié
    expect(res.body.userInfo).not.toContain("UserModified"); //champ non modifié donc non renvoyé
  });

  it("User re-updated for future/other tests", async () => {
    const res = await request(app).put("/users/update").send({
      //utilisation du User Test déjà existant dans la base de données
      token: "D4PeNUExmj8rrHBdci2LgONI7_u9GSuo",
      firstname: "User",
      lastname: "Test", // modification
      phone: "0612345678", // modification
      address: "12 rue des Lilas, 75012 Paris",
      avatar: "",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.message).toMatch(
      /Information\(s\) personnelle\(s\) modifiée\(s\)\./
    );
  });
});

//FATOUMATA
//Test user Signin
//test valid user - subcrition true
it("POST/users/", async () => {
  const response = await request(app).post("/users/signin").send({
    email: "test@email.fr",
    password: "Test123!",
  });

  console.log(response.body.userInfo);
  expect(response.statusCode).toBe(200);
  expect(response.body.result).toBe(true);
  expect(response.body.userInfo.firstname).toBe("User");
  expect(response.body.userInfo.lastname).toBe("Test");
  expect(typeof response.body.userInfo.token).toBe("string");
  expect(Array.isArray(response.body.userInfo.favoriteItems)).toBe(true);
  expect(response.body.userInfo.authorisedLoans).toBe(3);
  expect(response.body.userInfo.ongoingLoans).toBe(0);
  expect(response.body.userInfo.hasSubcribed).toBe(true);
});

//test valid user - subcrition false
it("POST/users/", async () => {
  const response = await request(app).post("/users/signin").send({
    email: "test1@email.fr",
    password: "Test1123!",
  });
  console.log(response.body.userInfo);
  expect(response.statusCode).toBe(200);
  expect(response.body.result).toBe(true);

  expect(response.body.userInfo.firstname).toBe("User1");
  expect(response.body.userInfo.lastname).toBe("Test1");
  expect(typeof response.body.userInfo.token).toBe("string");
  expect(Array.isArray(response.body.userInfo.favoriteItems)).toBe(true);
  expect(response.body.userInfo.authorisedLoans).toBe(0);
  expect(response.body.userInfo.ongoingLoans).toBe(0);
  expect(response.body.userInfo.hasSubcribed).toBe(false);
});

// Test invalid user - wrong password
it("POST/users/", async () => {
  const response = await request(app).post("/users/signin").send({
    email: "test@email.fr",
    password: "wrongpassword",
  });

  expect(response.statusCode).toBe(200);
  expect(response.body.result).toBe(false);
  expect(response.body.error).toBe("Email ou mot de passe erroné.");
});

//FATOUMATA
// Test GET /users/:token
it("GET/users/:token", async () => {
  const response = await request(app).get(
    "/users/D4PeNUExmj8rrHBdci2LgONI7_u9GSuo"
  );

  expect(response.statusCode).toBe(200);
  expect(response.body.result).toBe(true);
  expect(response.body.userData.email).toBe("test@email.fr");
  expect(response.body.userData.firstname).toBe("User");
  expect(response.body.userData.lastname).toBe("Test");
  expect(Array.isArray(response.body.userData.favoriteItems)).toBe(true);
});

afterAll(async () => {
  await mongoose.disconnect();
});
