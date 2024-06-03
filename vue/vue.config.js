const { defineConfig } = require('@vue/cli-service')
module.exports = {
    "devServer": {
        "allowedHosts": "all",
        "port": 9090,
        "proxy": {
            "^/upload": {
                "target": "https://localhost:8090",
                ws: false,
                "changeOrigin": true,
                },
            "^/api": {
                ws: false,
                "target": "https://localhost:8090",
                "changeOrigin": true
            }
        }
    }
}
