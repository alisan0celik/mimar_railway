declare module "passport-apple" {
  import { Strategy as PassportStrategy } from "passport";

  interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyString: string;
    callbackURL: string;
    scope?: string[];
  }

  interface AppleProfile {
    id: string;
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
    provider: string;
  }

  class Strategy extends PassportStrategy {
    constructor(
      options: AppleStrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: AppleProfile,
        done: (...args: unknown[]) => void,
      ) => void,
    );
  }
}
