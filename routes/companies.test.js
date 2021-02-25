process.env.NODE_ENV = "test";
const db = require("../db");
const app = require("../app");
const request = require("supertest");

let testComp;

beforeEach(async () => {
  const compResults = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('bd','black diamond','climbing gear') RETURNING *`
  );
  testComp = compResults.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});
afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Returns a list of companies", async () => {
    const response = await request(app).get("/companies");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      companies: [testComp],
    });
  });
});

describe("GET /companies/code", () => {
  test("Returns the company with code bd", async () => {
    const response = await request(app).get("/companies/bd");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      company: {
        code: "bd",
        description: "climbing gear",
        invoices: [],
        name: "black diamond",
      },
    });
  });
});

describe("POST /companies", () => {
  test("Returns a new company", async () => {
    const response = await request(app)
      .post("/companies")
      .send({ code: "aws", name: "Amazon", description: "the lord" });
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      company: {
        code: "aws",
        name: "Amazon",
        description: "the lord",
      },
    });
  });
});

describe("UPDATE /companies/code", () => {
  test("Returns an updated company", async () => {
    const response = await request(app)
      .put("/companies/bd")
      .send({ name: "Amazon", description: "the lord" });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      company: {
        code: "bd",
        name: "Amazon",
        description: "the lord",
      },
    });
  });
});

describe("DELETE /companies/code", () => {
  test("Returns a deleted message", async () => {
    const response = await request(app).delete("/companies/bd");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: "Deleted",
    });
  });
});
