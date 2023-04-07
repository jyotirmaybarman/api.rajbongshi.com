import { JwtPayload } from "./jwt-payload.type";

export type JwtPayloadWithRt = JwtPayload & { refresh_token: string }