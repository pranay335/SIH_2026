const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testFiltering = async () => {
    try {
        console.log('--- Testing BMC Admin ---');
        const bmcLogin = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@civicmind.com',
            password: 'adminpassword',
            role: 'admin'
        });

        const bmcToken = bmcLogin.data.token;
        console.log('Login successful. user data:', bmcLogin.data.user);

        const bmcEmployees = await axios.get(`${API_URL}/users/employees`, {
            headers: { Authorization: `Bearer ${bmcToken}` }
        });
        console.log('BMC Employees found:', bmcEmployees.data.length);
        const nonBmc = bmcEmployees.data.filter(e => e.municipalityCode !== 'BMC');
        console.log('Non-BMC employees in list:', nonBmc.length);

        console.log('\n--- Testing TMC Admin ---');
        const tmcLogin = await axios.post(`${API_URL}/users/login`, {
            email: 'admin@tmc.gov',
            password: 'adminpassword',
            role: 'admin'
        });

        const tmcToken = tmcLogin.data.token;
        console.log('Login successful. user.municipalityCode:', tmcLogin.data.user.municipalityCode);

        const tmcEmployees = await axios.get(`${API_URL}/users/employees`, {
            headers: { Authorization: `Bearer ${tmcToken}` }
        });
        console.log('TMC Employees found:', tmcEmployees.data.length);
        const nonTmc = tmcEmployees.data.filter(e => e.municipalityCode !== 'TMC');
        console.log('Non-TMC employees in list:', nonTmc.length);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
};

testFiltering();
