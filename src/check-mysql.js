const mysql = require('mysql2/promise');

const dbConfig = {
    host: '192.168.11.102',
    user: 'syncuser',
    password: 'syncpassword',
    database: 'kiwisun',
    port: 3306,
    connectTimeout: 60000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function checkData() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('📊 Users:');
        const [users] = await connection.query(`
            SELECT 
                id,
                firebase_id,
                name,
                email,
                phone,
                skin_type,
                gender,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
            FROM users
            ORDER BY id ASC
        `);
        console.table(users);

        console.log('\n📊 Bar Codes:');
        const [barCodes] = await connection.query(`
            SELECT 
                id,
                user_id,
                card_type,
                minutes,
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as timestamp,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM bar_code
            ORDER BY id ASC
        `);
        console.table(barCodes);

        await connection.end();
    } catch (error) {
        console.error('❌ Error querying MySQL:', error.message);
    }
}

checkData().catch(console.error); 