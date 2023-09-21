import type {Session,User} from "next-auth"
import type {JWT} from "next-auth/jwt"

type userId = string

declare module "next-auth/jtw" {
    interface JWT {
        id: userId
        username?: string | null
    }
}
declare module "next-auth/" {
    interface Session {
        id: userId
        username?: string | null
    }
}