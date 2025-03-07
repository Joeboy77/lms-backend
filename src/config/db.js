const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://admin:' + encodeURIComponent('Joseph66715') + '@localhost:5432/lmsdb'
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
})

module.exports = pool;