const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let franchiseID;
let userId;
let authToken;
let storeID;


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


test('create franchise chain', async () => {
    const randomFranchiseName = randomName();
    const createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${authToken}`).send({ name: randomFranchiseName, admins: [{ email: testUser.email }] });
    expect(createFranchiseRes.status).toBe(200);
    franchiseID = createFranchiseRes.body.id;
});

test('get franchise chain', async () => {
    const allFranchisesRes = await request(app).get('/api/franchise');
    expect(allFranchisesRes.status).toBe(200);
})

test('get users stores', async () => {
    const storesRes = await request(app).get(`/api/franchise/:${userId}`).set('Authorization', `Bearer ${authToken}`);
    expect(storesRes.status).toBe(200);
})


test('create one franchise store', async () => {
    const createFranchiseRes = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${authToken}`).send({ franchiseId: franchiseID, name: 'SLC'});
    expect(createFranchiseRes.status).toBe(200);
    storeID = createFranchiseRes.body.id;
})

test('delete franchise chain', async () => {
    const deleteFranchiseRes = await request(app).delete(`/api/franchise/:${franchiseID}`).set('Authorization', `Bearer ${authToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
})

test('delete one store', async () => {
    const deleteStoreRes = await request(app).delete(`/api/franchise/:${franchiseID}/store/:${storeID}`).set('Authorization', `Bearer ${authToken}`);
    expect(deleteStoreRes.status).toBe(200);

})

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}