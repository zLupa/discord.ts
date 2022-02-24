import type {
  CacheType,
  InteractionCollector,
  TextBasedChannel,
} from "discord.js";
import {
  CommandInteraction,
  ContextMenuInteraction,
  Interaction,
  Message,
  MessageComponentInteraction,
} from "discord.js";
import _ from "lodash";

import { GeneratePage } from "./functions/GeneratePage.js";
import type { PaginationResolver } from "./Resolver.js";
import type {
  IGeneratePage,
  PaginationInteractions,
  PaginationItem,
  PaginationOptions,
} from "./types.js";
import {
  defaultIds,
  defaultTime,
  PaginationType,
  SelectMenuPageId,
} from "./types.js";

export class Pagination<T extends PaginationResolver = PaginationResolver> {
  public maxLength: number;
  public currentPage: number;
  public option: PaginationOptions;
  public collector?: InteractionCollector<
    MessageComponentInteraction<CacheType>
  >;
  public message?: Message;
  private _isSent = false;
  private _isFollowUp = false;

  get isSent(): boolean {
    return this._isSent;
  }

  constructor(
    public sendTo: PaginationInteractions | Message | TextBasedChannel,
    public embeds: PaginationItem[] | T,
    config?: PaginationOptions
  ) {
    /**
     * page length of pagination
     */
    this.maxLength = Array.isArray(embeds) ? embeds.length : embeds.maxLength;

    /**
     * default options
     */
    this.option =
      config ??
      (this.maxLength < 20
        ? { type: PaginationType.Button }
        : { type: PaginationType.SelectMenu });

    /**
     * Current page
     */
    this.currentPage = config?.initialPage ?? 0;

    /**
     * Since direct editing isn't available on ephemeral, disable exit mode
     */
    if (this.option.ephemeral && this.option.enableExit) {
      throw Error("Ephemeral pagination does not support exit mode");
    }
  }

  /**
   * Get page
   *
   * @param page
   *
   * @returns
   */
  public getPage = async (page: number): Promise<IGeneratePage | undefined> => {
    const embed = Array.isArray(this.embeds)
      ? _.cloneDeep<PaginationItem | undefined>(this.embeds[page])
      : await this.embeds.resolver(page, this);

    if (!embed) {
      return undefined;
    }
    return GeneratePage(embed, this.currentPage, this.maxLength, this.option);
  };

  /**
   * Send pagination
   * @returns
   */
  public async send(): Promise<{
    collector: InteractionCollector<MessageComponentInteraction<CacheType>>;
    message: Message;
  }> {
    // If pagination has already been sent, throw an error
    if (this._isSent) {
      throw Error("Pagination: already sent");
    }

    // Prepare initial message
    const page = await this.getPage(this.currentPage);
    if (!page) {
      throw Error("Pagination: out of bound page");
    }

    // Add a pagination row to components
    if (page.newMessage.components) {
      page.newMessage.components.push(page.paginationRow);
    } else {
      page.newMessage.components = [page.paginationRow];
    }

    let message: Message;

    // Send embed
    if (this.sendTo instanceof Message) {
      message = await this.sendTo.reply(page.newMessage);
    } else if (
      this.sendTo instanceof CommandInteraction ||
      this.sendTo instanceof MessageComponentInteraction ||
      this.sendTo instanceof ContextMenuInteraction
    ) {
      // To ensure pagination is a follow-up
      if (this.sendTo.deferred || this.sendTo.replied) {
        this._isFollowUp = true;
      }

      // send message
      const reply =
        this.sendTo.deferred || this.sendTo.replied
          ? await this.sendTo.followUp({
              ...page.newMessage,
              ephemeral: this.option.ephemeral,
              fetchReply: true,
            })
          : await this.sendTo.reply({
              ...page.newMessage,
              ephemeral: this.option.ephemeral,
              fetchReply: true,
            });

      // If the message response is not received, throw an error
      if (!(reply instanceof Message)) {
        throw Error("InvalidMessage instance");
      }

      message = reply;
    } else {
      message = await this.sendTo.send(page.newMessage);
    }

    // Check if pages were sent
    if (!message) {
      throw Error("Pagination: Failed to send pages");
    }

    // create collector
    const collector = message.createMessageComponentCollector({
      time: this.option.time ?? defaultTime,
    });

    collector.on("collect", async (collectInteraction) => {
      if (
        collectInteraction.isButton() &&
        this.option.type === PaginationType.Button
      ) {
        if (
          collectInteraction.customId ===
          (this.option.exit?.id ?? defaultIds.buttons.exit)
        ) {
          // Exit pagination if exit is requested
          collector.stop();
          return;
        } else if (
          collectInteraction.customId ===
          (this.option.start?.id ?? defaultIds.buttons.start)
        ) {
          // Requested start page
          this.currentPage = 0;
        } else if (
          collectInteraction.customId ===
          (this.option.end?.id ?? defaultIds.buttons.end)
        ) {
          // Requested end page
          this.currentPage = this.maxLength - 1;
        } else if (
          collectInteraction.customId ===
          (this.option.next?.id ?? defaultIds.buttons.next)
        ) {
          // Requested next page
          this.currentPage++;
        } else if (
          collectInteraction.customId ===
          (this.option.previous?.id ?? defaultIds.buttons.previous)
        ) {
          // Requested previous page
          this.currentPage--;
        } else {
          return;
        }

        await collectInteraction.deferUpdate();

        // Get page
        const pageEx = await this.getPage(this.currentPage);
        if (!pageEx) {
          throw Error("Pagination: out of bound page");
        }

        // Add pagination row
        if (pageEx.newMessage.components) {
          pageEx.newMessage.components.push(pageEx.paginationRow);
        } else {
          pageEx.newMessage.components = [pageEx.paginationRow];
        }

        // Update message
        await collectInteraction.editReply(pageEx.newMessage);
      } else if (
        collectInteraction.isSelectMenu() &&
        this.option.type === PaginationType.SelectMenu &&
        collectInteraction.customId === (this.option.menuId ?? defaultIds.menu)
      ) {
        await collectInteraction.deferUpdate();

        const menuValue = Number(collectInteraction.values[0] ?? 0);

        // Exit pagination if exit is requested
        if (menuValue === SelectMenuPageId.Exit) {
          collector.stop();
          return;
        }

        // Requested start page
        if (menuValue === SelectMenuPageId.Start) {
          this.currentPage = 0;
        }

        // Requested end page
        if (menuValue === SelectMenuPageId.End) {
          this.currentPage = this.maxLength - 1;
        }

        this.currentPage = menuValue;

        // Update page
        const pageEx = await this.getPage(this.currentPage);
        if (!pageEx) {
          throw Error("Pagination: out of bound page");
        }

        if (pageEx.newMessage.components) {
          pageEx.newMessage.components.push(pageEx.paginationRow);
        } else {
          pageEx.newMessage.components = [pageEx.paginationRow];
        }

        await collectInteraction.editReply(pageEx.newMessage);
      }
    });

    collector.on("end", async () => {
      const finalPage = await this.getPage(this.currentPage);
      if (message.editable && finalPage) {
        // Reset page components
        if (!finalPage.newMessage.components) {
          finalPage.newMessage.components = [];
        }

        // Eliminate the ephemeral pagination error, since direct editing cannot be performed
        if (this.option.ephemeral && this.sendTo instanceof Interaction) {
          if (!this._isFollowUp) {
            await this.sendTo.editReply(finalPage.newMessage);
          }
        } else {
          await message.edit(finalPage.newMessage);
        }
      }

      // Perform pagination timeout
      if (this.option.onTimeout) {
        this.option.onTimeout(this.currentPage, message);
      }
    });

    this.collector = collector;
    this.message = message;
    this._isSent = true;

    return { collector, message };
  }
}