import { Role, Status } from "@prisma/client";

export type JwtPayload = {
    email: string;
    sub: string;
    role: Role;
    status: Status;
  };