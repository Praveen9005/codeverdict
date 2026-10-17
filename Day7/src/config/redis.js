// const { createClient }  = require('redis');

// const redisClient = createClient({
//     username: 'default',
//     password: process.env.REDIS_PASS,
//     socket: {
//         host: 'clarion-cobaltish-dawnlike-34615.db.redis.io',
//         port: 11048
//     }
// });

// module.exports = redisClient;





const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host:'skin-versed-blush-31547.db.redis.io',
        port:18448,
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis: too many retries, giving up');
                return new Error('Redis reconnect failed');
            }
            // thoda thoda delay badhate hue retry karega (max 3 sec)
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis: connecting...');
});

redisClient.on('ready', () => {
    console.log('Redis: connected and ready');
});

redisClient.on('reconnecting', () => {
    console.log('Redis: reconnecting...');
});

module.exports = redisClient;



