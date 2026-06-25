// scripts/01-read-heavy.js
import http from 'k6/http'
import { check } from 'k6'
import { setupAccounts } from './helpers/setup.js'

export const options = {
    stages: [
        { duration: '10s', target: 50 },   // montée progressive
        { duration: '30s', target: 500 },  // charge cible
        { duration: '10s', target: 0 }     // descente
    ],
    thresholds: {
        'http_req_duration{endpoint:balance}': ['p(95)<50'],  // SLO cache hit
        'http_req_failed': ['rate<0.01'],                     // < 1% erreurs 5xx
        'checks': ['rate>0.99']
    }
}

export function setup() {
    return setupAccounts(__ENV.BASE_URL, 100)
}

export default function (data) {
    const accountId = data.accounts[Math.floor(Math.random() * data.accounts.length)]

    const res = http.get(
        `${__ENV.BASE_URL}/accounts/${accountId}/balance`,
        {
            headers: { Authorization: `Bearer ${data.token}` },
            tags: { endpoint: 'balance' }
        }
    )

    check(res, {
        'status is 200': (r) => r.status === 200,
        'balance is present': (r) => r.json('balance') !== undefined
    })
}