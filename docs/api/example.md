# Examples

## Connect to API

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
