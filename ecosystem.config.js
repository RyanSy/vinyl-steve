module.exports = {
    apps: [
        {
            name: 'vinyl-steve',
            script: './bin/www',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
