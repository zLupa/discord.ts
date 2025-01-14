# @Permission

Define permission for your application command or simple command.

The permissions are based on a **role id** or **user id** that you specify on the @Permission decorator

The permissions will be set when you call `client.initApplicationPermissions()`

:::warning
From discord developer docs:

For now, if you don't have permission to use a command, they'll show up in the command picker as disabled and unusable. They will not be hidden.
:::

## Supported with

- [@ContextMenu](../gui/context-menu)
- [@SimpleCommand](../commands/simple-command)
- [@Slash](../commands/slash)

## Setup permissions

You can decorate your method with one or more @Permission decorators.

```ts
@Discord()
class Example {
  // We will enable command for specific users/roles only, so disable it for everyone
  @Permission(false)
  // This command is available only to the user whose USER_ID is mentioned
  @Permission({ id: "USER_ID", type: "USER", permission: true })
  // Users with the specified ROLE_ID can run this command
  @Permission({ id: "ROLE_ID", type: "ROLE", permission: true })
  @Slash("hello")
  private hello() {
    // ...
  }
}
```

## Permissions at class level

You can set the permissions for all @Slash inside the class by decorating the class with @Permission

```ts
@Discord()
// We will enable command for specific users/roles only, so disable it for everyone
@Permission(false)
// Below commands are available only to the user whose USER_ID is mentioned
@Permission({ id: "USER_ID", type: "USER", permission: true })
// Users with the specified ROLE_ID can run this class commands
@Permission({ id: "ROLE_ID", type: "ROLE", permission: true })
class Example {
  @Slash("hello")
  private hello() {
    // ...
  }

  @Slash("hello2")
  private hello2() {
    // ...
  }
}
```

## Example - Dynamic permission resolver

Whenever permissions are required, dynamic resolvers are called. Such as, When `initApplicationPermissions` or simple command execution is performed. A dynamic permission resolver is helpful for saving permissions in the database.

Note: In order to refresh application permissions dynamically, run `initApplicationPermissions` anywhere.

```ts
@Discord()
@Permission(false) // We will enable command for specific users/roles only, so disable it for everyone
@Permission(async (guild, cmd): Promise<ApplicationCommandPermissions[]> => {
  const getResponse = () => {
    return new Promise((resolve) => {
      setTimeout(function () {
        resolve(true);
      }, 5000);
    });
  };
  await getResponse(); // add delay
  return { id: "462341082919731200", permission: true, type: "USER" };
})
class Example {
  @Slash("hello") // Only the role that has this ROLE_ID can use this command
  private hello() {
    // ...
  }

  @Slash("hello2") // Only the role that has this ROLE_ID can use this command
  private hello2() {
    // ...
  }
}
```

## Signature

```ts
@Permission(
  permission: boolean | IPermissions
): ClassMethodDecorator
```

## type: Boolean

Overwrite default permission (aka permission for everyone) for application/simple command. When true, the command can be used by anyone except those who have been denied by the @Permission decorator, vice versa.

## type: IPermissions

```ts
type IPermissions =
  | ApplicationCommandPermissions
  | ApplicationCommandPermissions[]
  | ((
      guild: Guild,
      command: ApplicationCommandMixin | SimpleCommandMessage
    ) =>
      | ApplicationCommandPermissions
      | ApplicationCommandPermissions[]
      | Promise<ApplicationCommandPermissions>
      | Promise<ApplicationCommandPermissions[]>);
```

### id

The id if the user or role

| type      | required |
| --------- | -------- |
| Snowflake | Yes      |

### type

It specify if the permission is given to a user or a role

| type         | required |
| ------------ | -------- |
| ROLE \| USER | Yes      |

### permission

It specify if the permission is granted or restricted

| type    | required |
| ------- | -------- |
| boolean | Yes      |

## Make changes to

It either extends or overwrites data configured in below decorators, however, the order of decorators matters.

[@Discord](/docs/decorators/general/discord)

[@SimpleCommand](/docs/decorators/commands/simple-command)

[@Slash](/docs/decorators/commands/slash)
