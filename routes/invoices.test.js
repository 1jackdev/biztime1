process.env.NODE_ENV = "test";
const db = require("../db");
const app = require("../app");
const request = require("supertest");

let testComp;

beforeEach(async () => {
  await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('bd','black diamond','climbing gear') RETURNING *`
  );
  const invResults = await db.query(
    `INSERT INTO invoices (comp_code, amt) VALUES ('bd',420) RETURNING *`
  );

  testComp = invResults.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});
afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Returns a list of invoices", async () => {
    const response = await request(app).get("/invoices");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      invoices: [testComp],
    });
  });
});

describe("GET /invoices/id", () => {
  test("Returns one invoice", async () => {
    const response = await request(app).get(`/invoices/${testComp.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      invoice: {
        add_date: "2021-02-24T08:00:00.000Z",
        amt: 420,
        company: {
          code: "bd",
          description: "climbing gear",
          name: "black diamond",
        },
        id: testComp.id,
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("POST /invoices", () => {
  test("Returns a new invoice", async () => {
    const response = await request(app)
      .post("/invoices")
      .send({ comp_code: "bd", amt: 12 });
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      invoice: {
        comp_code: "bd",
        amt: 12,
        add_date: "2021-02-24T08:00:00.000Z",
        id: testComp.id + 1,
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("UPDATE /invoices/id", () => {
  test("Returns an updated invoice", async () => {
    const response = await request(app)
      .put(`/invoices/${testComp.id}`)
      .send({ amt: 13 });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      invoice: {
        comp_code: "bd",
        amt: 13,
        add_date: "2021-02-24T08:00:00.000Z",
        id: testComp.id,
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("DELETE /invoices/id", () => {
  test("Returns a deleted message", async () => {
    const response = await request(app).delete(`/invoices/${testComp.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: "Deleted",
    });
  });
});
