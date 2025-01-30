const request = require('supertest');
const app = require('../service');


const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
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

// test('update', async () => {
//     const adminUser = await createAdminUser();
//     const loginRes = await request(app).put('/api/auth').send(adminUser);
//     const authToken = await loginRes.body.token;
//     const userId = await loginRes.body.user.id;

//     const updateRes = await request(app).put(`/api/auth/:${userId}`).set('Authentication', `Bearer ${authToken}`).send({ email: "a@jwt.com", password: "admin" })
//     expect(updateRes.status).toBe(200);
// })

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}


function randomName() {
    return Math.random().toString(36).substring(2, 12);
}


