import { AclRegistry } from 'lib/acl.registry';

export function groupOrUserToGroups<User = unknown>(
  groupOrUser?: string | User,
): string[] {
  if (typeof groupOrUser == 'string') {
    return [groupOrUser];
  }
  if (!groupOrUser) {
    return [];
  }
  const groups = AclRegistry.getInstance().groupFromUser(groupOrUser);
  return groups;
}
