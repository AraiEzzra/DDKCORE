# Examples

## Connect to API

### Testnet nodes

| Protocol | IP            | Port |
|----------|---------------|------|
| ws       | 31.28.161.187 | 7008 |
| ws       | 31.28.161.188 | 7008 |
| ws       | 31.28.161.189 | 7008 |

### Mainnet trusted nodes

| Protocol | IP              | Port |
|----------|-----------------|------|
| ws       | 68.183.235.184  | 7008 |
| ws       | 68.183.176.187  | 7008 |
| ws       | 157.230.46.8    | 7008 |
| ws       | 159.65.131.165  | 7008 |
| ws       | 157.230.46.24   | 7008 |
| ws       | 157.230.38.119  | 7008 |
| ws       | 157.230.38.212  | 7008 |
| ws       | 157.230.33.130  | 7008 |
| ws       | 178.128.122.117 | 7008 |
| ws       | 178.128.123.4   | 7008 |
| ws       | 178.128.127.51  | 7008 |
| ws       | 128.199.198.201 | 7008 |
| ws       | 134.209.202.58  | 7008 |
| ws       | 203.130.48.126  | 7008 |
| ws       | 31.28.161.179   | 7008 |

```javascript
import io from 'socket.io-client';

const ws = io(`ws://localhost:7008`, { transports: ['websocket'] });
```

## Send request

```javascript
ws.emit('message', {
    code': 'GET_ACCOUNT',
    headers': {
        id': 'a3a76922-235e-498c-b896-0b1167ba9daa',
        type': 1
    },
    body': {
        address': '4995063339468361088'
    }
});

ws.on('message', (message) => {
    // response processing
})
```
