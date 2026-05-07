import { AclModuleOptions } from './acl.module-options';

export class AclRegistry {
  private static instance: AclRegistry;

  private constructor() { }
  public static getInstance(): AclRegistry {
    if (!AclRegistry.instance) {
      AclRegistry.instance = new AclRegistry();
    }
    return AclRegistry.instance;
  }
  registerOptions(acl: AclModuleOptions) {
    this.groupFromUser = <UserType>(user: UserType) => {
      const result = acl.groupFromUser(user);
      if (typeof result == 'string') {
        return [result];
      } else {
        return result;
      }
    };
  }

  private defaultAcl = {
    policies: {},
    publicPolicy: [],
  };

  public getDefaultAcl() {
    return { ...this.defaultAcl };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public groupFromUser<UserType = any>(_user?: UserType): string[] {
    return [];
  }
}
