const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: null, uid: 'native-123456', email: null, phone_number: '+1234567890' }, '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61');
console.log(token);
