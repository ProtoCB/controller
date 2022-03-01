const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const config = require('../utils/config');

const serviceAccount = require(config.SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: config.BUCKET_NAME
});

const bucket = getStorage().bucket();

console.log("Firebase storage bucket interface initialized")

module.exports = {
  bucket
};