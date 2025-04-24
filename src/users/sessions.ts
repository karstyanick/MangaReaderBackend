
export const sessions: { [key: string]: Session } = {}
export interface Session {
    username: string,
    issuedAt: Date,
    expiresAt: Date,
    lastCall: Date,
}
