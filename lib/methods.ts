import { AclRegistry } from './acl.registry';
import { IAclDocument } from './interfaces';

function groupHasAccess(
  this: IAclDocument,
  group: string,
  action: string,
): boolean {
  if (this.acl.publicPolicy.includes(action)) {
    return true;
  }
  if (!this.acl.policies.has(group)) {
    return false;
  }
  if (this.acl.policies.get(group).includes(action)) {
    return true;
  }
  return false;
}
function userHasAccess<User = unknown>(
  this: IAclDocument,
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
function hasAccess(this: IAclDocument, group: string, action: string): boolean;
function hasAccess<User = unknown>(
  this: IAclDocument,
  user: User,
  action: string,
): boolean;
function hasAccess<User = unknown>(
  this: IAclDocument,
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
function revokeAccess(this: IAclDocument, group: string, action: string) {
  if (!this.acl.policies.has(group)) {
    return this; // No policies for this group, nothing to revoke
  }
  const actions = this.acl.policies.get(group);
  const index = actions.indexOf(action);
  if (index > -1) {
    actions.splice(index, 1); // Remove the action from the group's policies
  }
  return this;
}
function grantAccess(this: IAclDocument, group: string, action: string) {
  if (!this.acl.policies.has(group)) {
    this.acl.policies.set(group, []);
  }
  this.acl.policies.get(group).push(action);
  return this;
}
function grantPublicAccess(this: IAclDocument, action: string) {
  if (!this.acl.publicPolicy.includes(action)) {
    this.acl.publicPolicy.push(action);
  }
  return this;
}
function revokePublicAccess(this: IAclDocument, action: string) {
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

export type IAclMethods = typeof AclMethods;
export type AclMethodsCls = new (...args: any[]) => IAclMethods;
export const AclMethods = {
  groupHasAccess,
  hasAccess,
  grantAccess,
  revokeAccess,
  userHasAccess,
  grantPublicAccess,
  revokePublicAccess,
};
