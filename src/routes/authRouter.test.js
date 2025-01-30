const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let authToken;
let userId;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    const adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    authToken = loginRes.body.token;
    userId = loginRes.body.id;

    expectValidJwt(testUserAuthToken);
});

test('login', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('register', async () => {
    const randName = randomName();
    const registerRes = await request(app).post('/api/auth').send({ name: randName, email: `${randName}@email.com`, password: `${randName}password` });
    expect(registerRes.status).toBe(200);
})

test('delete', async () => {
    const deleteRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(deleteRes.status).toBe(200);
})

test('update', async () => {
    const updateRes = await request(app).put(`/api/auth/:${userId}`).set('Authentication', `Bearer ${authToken}`).send({ email: "a@jwt.com", password: "admin" })
    expect(updateRes.status).toBe(200);
})

test('cannot register', async () => {
    const randName = randomName();
    const registerRes = await request(app).post('/api/auth').send({email: `${randName}@email.com`, password: `${randName}password` });
    expect(registerRes.status).toBe(400);
})

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}


function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}