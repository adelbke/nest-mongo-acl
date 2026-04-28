import { Module } from '@nestjs/common';
import { AclModuleOptions, ConfigurableAclModule } from './acl.module-options';
import { AclRegistry } from './acl.registry';
import { AclService } from './acl.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: AclRegistry,
      useFactory: () => AclRegistry.getInstance(),
    },
    AclService,
  ],
  exports: [],
})
export class AclModule extends ConfigurableAclModule {
  static setupAclConfiguration(options: AclModuleOptions) {
    AclRegistry.getInstance().registerOptions(options);
  }
}
