import { AclRegistry } from './acl.registry';
import { IAclDocument, WithAcl } from './interfaces';

function groupHasAccess<T extends WithAcl>(
  this: IAclDocument<T>,
  group: string,
  action: string,
): boolean {
  if (this.acl.publicPolicy.includes(action)) {
    return true;
  }
  if (!this.acl.policies[group]) {
    return false;
  }
  if (this.acl.policies[group].includes(action)) {
    return true;
  }
  return false;
}
function userHasAccess<T extends WithAcl, User = unknown>(
  this: IAclDocument<T>,
  user: User,
  action: string,
): boolean {
  // If the access to action is public, access is granted regardless of group or user
  if (this.acl.publicPolicy.includes(action)) {
    return true;
  }
  const userGroups = AclRegistry.getInstance().groupFromUser(user);
  return userGroups.some((group) => groupHasAccess.call(this, group, action));
}
function hasAccess<T extends WithAcl>(
  this: IAclDocument<T>,
  group: string,
  action: string,
): boolean;
function hasAccess<T extends WithAcl, User = unknown>(
  this: IAclDocument<T>,
  user: User,
  action: string,
): boolean;
function hasAccess<T extends WithAcl, User = unknown>(
  this: IAclDocument<T>,
  groupOrUser: string | User,
  action: string,
): boolean {
  // If the access to action is public, access is granted regardless of group or user
  if (this.acl.publicPolicy.includes(action)) {
    return true;
  }
  if (typeof groupOrUser !== 'string') {
    return this.userHasAccess(groupOrUser, action);
  }
  return this.groupHasAccess(groupOrUser as string, action);
}
function revokeAccess<T extends WithAcl>(
  this: IAclDocument<T>,
  group: string,
  action: string,
) {
  if (!this.acl.policies[group]) {
    return this; // No policies for this group, nothing to revoke
  }
  const actions = this.acl.policies[group];
  const index = actions.indexOf(action);
  if (index > -1) {
    actions.splice(index, 1); // Remove the action from the group's policies
  }
  return this;
}
function grantAccess<T extends WithAcl>(
  this: IAclDocument<T>,
  group: string,
  action: string,
) {
  if (!this.acl.policies[group]) {
    this.acl.policies[group] = [];
  }
  this.acl.policies[group].push(action);
  return this;
}
function grantPublicAccess<T extends WithAcl>(
  this: IAclDocument<T>,
  action: string,
) {
  if (!this.acl.publicPolicy.includes(action)) {
    this.acl.publicPolicy.push(action);
  }
  return this;
}
function revokePublicAccess<T extends WithAcl>(
  this: IAclDocument<T>,
  action: string,
) {
  const index = this.acl.publicPolicy.indexOf(action);
  if (index > -1) {
    this.acl.publicPolicy.splice(index, 1); // Remove the action from public policies
  }
  return this;
}
// export type IAclMethods = {
//   hasAccess: typeof AclMethods.hasAccess;
//   groupHasAccess: typeof AclMethods.groupHasAccess;
//   grantAccess: typeof AclMethods.grantAccess;
//   revokeAccess: typeof AclMethods.revokeAccess;
//   userHasAccess: typeof AclMethods.userHasAccess;
// };

export type IAclMethods<T extends WithAcl = WithAcl> = {
  hasAccess: typeof hasAccess<T>;
  groupHasAccess: typeof groupHasAccess<T>;
  grantAccess: typeof grantAccess<T>;
  revokeAccess: typeof revokeAccess<T>;
  userHasAccess: typeof userHasAccess<T>;
  grantPublicAccess: typeof grantPublicAccess<T>;
  revokePublicAccess: typeof revokePublicAccess<T>;
};
export type AclMethodsCls<T extends WithAcl = WithAcl> = new (
  ...args: any[]
) => IAclMethods<T>;
export const AclMethods = {
  groupHasAccess,
  hasAccess,
  grantAccess,
  revokeAccess,
  userHasAccess,
  grantPublicAccess,
  revokePublicAccess,
};
