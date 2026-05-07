import { AclRegistry } from './acl.registry';
import { IAclDocument, WithAcl } from './interfaces';
import { actionsFromAction, initAcl } from './utils/util';

function groupHasAccess(
  this: IAclDocument<WithAcl>,
  group: string,
  action: string,
): boolean {
  if (!this.acl) {
    return false;
  }
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
  this: IAclDocument<WithAcl>,
  user: User,
  action: string,
): boolean {
  if (!this.acl) {
    return false;
  }
  // If the access to action is public, access is granted regardless of group or user
  if (this.acl.publicPolicy.includes(action)) {
    return true;
  }
  const userGroups = AclRegistry.getInstance().groupFromUser(user);
  return userGroups.some((group) => groupHasAccess.call(this, group, action));
}

function hasAccess<User = unknown>(
  this: IAclDocument<WithAcl>,
  groupOrUser: string | User,
  action: string,
): boolean {
  if (!this.acl) {
    return false;
  }
  // If the access to action is public, access is granted regardless of group or user
  if (this.acl.publicPolicy.includes(action)) {
    return true;
  }
  if (typeof groupOrUser !== 'string') {
    return this.userHasAccess(groupOrUser, action);
  }
  return this.groupHasAccess(groupOrUser as string, action);
}
function revokeAccess(
  this: IAclDocument<WithAcl>,
  group: string,
  actionOrActions: string | string[],
) {
  initAcl(this);
  if (!this.acl.policies[group]) {
    return this; // No policies for this group, nothing to revoke
  }
  const actionArr = actionsFromAction(actionOrActions);
  for (const action of actionArr) {
    const actions = this.acl.policies[group];
    const index = actions.indexOf(action);
    if (index > -1) {
      actions.splice(index, 1); // Remove the action from the group's policies
    }
  }
  return this;
}
function grantAccess(
  this: IAclDocument<WithAcl>,
  group: string,
  actionOrActions: string | string[],
) {
  initAcl(this);
  if (!this.acl.policies[group]) {
    this.acl.policies[group] = [];
  }

  const actions = actionsFromAction(actionOrActions);
  if (typeof actionOrActions == 'string') {
    this.acl.policies[group].push(...actions);

  }
  return this;
}
function grantPublicAccess(
  this: IAclDocument<WithAcl>,
  actionOrActions: string | string[],
) {
  initAcl(this);

  const actions = actionsFromAction(actionOrActions);
  for (const action of actions) {
    if (!this.acl.publicPolicy.includes(action)) {
      this.acl.publicPolicy.push(action);
    }
  }
  return this;
}
function revokePublicAccess(
  this: IAclDocument<WithAcl>,
  actionOrActions: string | string[],
) {
  initAcl(this);
  const actions = actionsFromAction(actionOrActions);
  for (const action of actions) {
    const index = this.acl.publicPolicy.indexOf(action);
    if (index > -1) {
      this.acl.publicPolicy.splice(index, 1); // Remove the action from public policies
    }
  }
  return this;
}

export type IAclMethods = {
  hasAccess: typeof hasAccess;
  groupHasAccess: typeof groupHasAccess;
  grantAccess: typeof grantAccess;
  revokeAccess: typeof revokeAccess;
  userHasAccess: typeof userHasAccess;
  grantPublicAccess: typeof grantPublicAccess;
  revokePublicAccess: typeof revokePublicAccess;
};

export type AclMethodsCls = new (
  ...args: any[]
) => IAclMethods;

export type WithAclMethods = WithAcl & IAclMethods;

export const AclMethods = {
  groupHasAccess,
  hasAccess,
  grantAccess,
  revokeAccess,
  userHasAccess,
  grantPublicAccess,
  revokePublicAccess,
};
