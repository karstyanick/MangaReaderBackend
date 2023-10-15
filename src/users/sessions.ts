
export const sessions: {[key: string]: Session} = {}

export class Session {
    public username
    public expiresAt
    public lastCall

    constructor(username: string, expiresAt: Date, lastCall: Date) {
        this.username = username
        this.expiresAt = expiresAt
        this.lastCall = lastCall
    }

    isExpired(): boolean {
        return this.expiresAt.getTime() < Date.now()
    }
}