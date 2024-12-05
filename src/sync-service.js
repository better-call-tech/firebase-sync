const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const schedule = require('node-schedule');

const serviceAccount = require('./firebase-credentials.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const pool = mysql.createPool({
    host: '192.168.11.102',
    user: 'syncuser',
    password: 'syncpassword',
    database: 'kiwisun',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function syncUsers(connection, db) {
    console.log('🔄 Syncing users...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        let createdAt = now;
        if (userData.created_time) {
            if (userData.created_time.toDate) {
                createdAt = userData.created_time.toDate().toISOString().slice(0, 19).replace('T', ' ');
            } else if (typeof userData.created_time === 'string') {
                createdAt = new Date(userData.created_time).toISOString().slice(0, 19).replace('T', ' ');
            }
        }

        const user = {
            firebase_id: doc.id,
            name: userData.display_name || '',
            email: userData.email || '',
            phone: userData.phone_number || '',
            skin_type: userData.skin_type || null,
            gender: 1,
            created_at: createdAt,
            updated_at: now
        };

        try {
            await connection.query(
                `INSERT INTO users 
                 (firebase_id, name, email, phone, skin_type, gender, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 name=?, email=?, phone=?, skin_type=?, gender=?, updated_at=?`,
                [
                    user.firebase_id, user.name, user.email, user.phone, user.skin_type, user.gender,
                    user.created_at, user.updated_at,
                    user.name, user.email, user.phone, user.skin_type, user.gender, user.updated_at
                ]
            );
            console.log(`✅ Synced user: ${user.email}`);
        } catch (error) {
            console.error(`❌ Error syncing user ${doc.id}:`, error.message);
        }
    }
    console.log(`✅ Synced ${usersSnapshot.docs.length} users`);
}

async function syncBarCodes(connection, db) {
    console.log('🔄 Syncing bar codes...');
    const barCodesSnapshot = await db.collection('bar_codes').get();
    
    for (const doc of barCodesSnapshot.docs) {
        const barcodeData = doc.data();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        if (!barcodeData.code) {
            console.log('⚠️ Skipping invalid barcode:', doc.id);
            continue;
        }

        try {
            await connection.query(
                `INSERT INTO bar_code 
                 (user_id, card_type, minutes, timestamp, created_at) 
                 VALUES (?, ?, ?, ?, ?)`,
                [barcodeData.uid || null, 'standard', barcodeData.code, now, now]
            );
            console.log('✅ Inserted barcode:', doc.id, 'with code:', barcodeData.code);
        } catch (error) {
            console.error('❌ Error inserting barcode:', doc.id, error.message);
        }
    }
    console.log(`✅ Synced ${barCodesSnapshot.docs.length} bar codes`);
}

async function performSync() {
    console.log('\n🚀 Starting sync process...');
    const startTime = Date.now();
    
    try {
        const connection = await pool.getConnection();
        const db = admin.firestore();
        
        await syncUsers(connection, db);
        await syncBarCodes(connection, db);
        
        connection.release();
        console.log(`✨ Sync completed in ${(Date.now() - startTime)/1000} seconds\n`);
    } catch (error) {
        console.error('❌ Sync error:', error);
    }
}

schedule.scheduleJob('*/5 * * * *', performSync);

performSync();

console.log('🔄 Sync service started - running every 5 minutes'); 