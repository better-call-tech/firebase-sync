const admin = require('firebase-admin');
const mysql = require('mysql2/promise');

const serviceAccount = require('./firebase-credentials.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function verifyData() {
    try {
        const db = admin.firestore();

        console.log('\n🔥 Firebase Data:');
        
        const usersSnapshot = await db.collection('users').get();
        console.log(`\nUsers in Firebase: ${usersSnapshot.docs.length}`);
        console.log('\nUser Documents Structure:');
        usersSnapshot.docs.forEach((doc, index) => {
            console.log(`\nDocument ${index + 1} (ID: ${doc.id})`);
            console.log('Fields:', Object.keys(doc.data()));
            console.log('Data:', doc.data());
        });

        const barCodesSnapshot = await db.collection('bar_codes').get();
        console.log(`\nBar codes in Firebase: ${barCodesSnapshot.docs.length}`);
        console.log('\nBar Code Documents Structure:');
        barCodesSnapshot.docs.forEach((doc, index) => {
            console.log(`\nDocument ${index + 1} (ID: ${doc.id})`);
            console.log('Fields:', Object.keys(doc.data()));
            console.log('Data:', doc.data());
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

verifyData().catch(console.error); 