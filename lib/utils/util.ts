import { WithAcl } from 'lib/interfaces';
import { AclRegistry } from '../acl.registry';
import { Acl } from 'lib/schema/acl.schema';

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
export function actionsFromAction(
  actionOrActions: string | string[],
): string[] {
  if (typeof actionOrActions == 'string') {
    return [actionOrActions];
  }
  if (Array.isArray(actionOrActions)) {
    const invalidActions = actionOrActions
      .map((action, index) => [typeof action, index])
      .filter(([action, _index]) => action != 'string');
    if (invalidActions.length > 0) {
      const indexes = invalidActions.map(([_action, index]) => index);
      throw new Error(
        `Invalid actions passed at indexes [${indexes.join(', ')}], these actions are not strings`,
      );
    }
    return actionOrActions;
  }

  throw new Error(
    `Action or Actions Array is invalid as it is not a string nor a string array`,
  );
}

export function initAcl<T extends WithAcl>(
  doc: T,
): asserts doc is T & { acl: Acl } {
  if (!doc.acl) {
    doc.acl = AclRegistry.getInstance().getDefaultAcl();
  }
}
