const mongoose = require("mongoose");
const request = require("supertest");
const app = require("./app");

const connectionString = process.env.CONNECTION_STRING;

beforeAll(async () => {
  await mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  //console.log("Database connected");
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
