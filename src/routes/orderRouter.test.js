const request = require('supertest');
const app = require('../service');

const { Role, DB } = require('../database/database.js');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let authToken;


beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    const adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    authToken = loginRes.body.token;
    expectValidJwt(testUserAuthToken);
});

test('create order', async () => {
        const order = { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };
        const createdOrderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${authToken}`).send(order);
        expect(createdOrderRes.status).toBe(200);
})

test('get pizza menu', async () => {
    const getPizzaMenuRes = await request(app).get('/api/order/menu');
    expect(getPizzaMenuRes.status).toBe(200);
})

test('get users orders', async () => {
    const getUsersOrderRes = await request(app).get('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(getUsersOrderRes.status).toBe(200);
})

test('add menu item', async () => {
    const addItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${authToken}`).send({ title: "Student", description: "No topping, no sauce, just carbs", image: "pizza9.png", price: 0.0001 });
    expect(addItemRes.status).toBe(200);
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