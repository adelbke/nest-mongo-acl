import { ConfigurableModuleBuilder } from '@nestjs/common';

export type AclModuleOptions<UserType = any> = {
  groupFromUser: (user?: UserType) => string[] | string;
};

export const {
  ConfigurableModuleClass: ConfigurableAclModule,
  MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<AclModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
