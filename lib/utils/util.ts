import { AclRegistry } from '../acl.registry';

export function groupOrUserToGroups<User = unknown>(
  groupOrUser?: string | User,
): string[] {
  if (typeof groupOrUser == 'string') {
    return [groupOrUser];
  }
  if (!groupOrUser || groupOrUser == null) {
    return [];
  }
  const groups = AclRegistry.getInstance().groupFromUser(groupOrUser);
  return groups;
}
