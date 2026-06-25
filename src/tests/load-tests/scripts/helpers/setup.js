
import http from 'k6/http'

export function setupAccounts(baseUrl, count = 100) {
    const accounts = []

    // Crée un utilisateur de test
    const registerRes = http.post(`${baseUrl}/auth/register`, JSON.stringify({
        email: `loadtest-${Date.now()}@test.com`,
        password: 'TestPassword123!'
    }), { headers: { 'Content-Type': 'application/json' } })

    const token = registerRes.json('accessToken')
    const authHeaders = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    // Crée N comptes avec un solde initial
    for (let i = 0; i < count; i++) {
        const accountRes = http.post(`${baseUrl}/accounts`, JSON.stringify({
            ownerName: `Account ${i}`
        }), { headers: authHeaders })

        const accountId = accountRes.json('accountId')

        // Pré-remplit avec un dépôt
        http.post(`${baseUrl}/accounts/${accountId}/deposit`, JSON.stringify({
            amount: 100000  // 1000€ en centimes
        }), { headers: authHeaders })

        accounts.push(accountId)
    }

    return { token, accounts }
}