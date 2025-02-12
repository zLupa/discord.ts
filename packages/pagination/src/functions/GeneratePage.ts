import type { MessageOptions } from "discord.js";
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} from "discord.js";

import type { IGeneratePage, PaginationOptions } from "../types.js";
import { defaultIds, PaginationType, SelectMenuPageId } from "../types.js";
import { paginate } from "./paginate.js";

export function GeneratePage(
  item: string | MessageEmbed | MessageOptions,
  page: number,
  totalPages: number,
  option: PaginationOptions
): IGeneratePage {
  const beginning = page === 0;
  const end = page === totalPages - 1;

  const newMessage: Omit<MessageOptions, "flags"> =
    typeof item === "string"
      ? { content: item }
      : item instanceof MessageEmbed
      ? { embeds: [item] }
      : item;

  function isStartEndAllowed(): boolean {
    if (option.showStartEnd === undefined) {
      return true;
    }

    if (typeof option.showStartEnd === "number") {
      return totalPages >= option.showStartEnd;
    }

    return option.showStartEnd;
  }

  if (option.type === PaginationType.Button) {
    const startBtn = new MessageButton()
      .setCustomId(option.start?.id ?? defaultIds.buttons.start)
      .setLabel(option.start?.label ?? "Start")
      .setStyle(option.start?.style ?? "PRIMARY")
      .setDisabled(beginning);

    const endBtn = new MessageButton()
      .setCustomId(option.end?.id ?? defaultIds.buttons.end)
      .setLabel(option.end?.label ?? "End")
      .setStyle(option.end?.style ?? "PRIMARY")
      .setDisabled(end);

    const nextBtn = new MessageButton()
      .setCustomId(option.next?.id ?? defaultIds.buttons.next)
      .setLabel(option.next?.label ?? "Next")
      .setStyle(option.next?.style ?? "PRIMARY")
      .setDisabled(end);

    const prevBtn = new MessageButton()
      .setCustomId(option.previous?.id ?? defaultIds.buttons.previous)
      .setLabel(option.previous?.label ?? "Previous")
      .setStyle(option.previous?.style ?? "PRIMARY")
      .setDisabled(beginning);

    const exitBtn = new MessageButton()
      .setCustomId(option.exit?.id ?? defaultIds.buttons.exit)
      .setLabel(option.exit?.label ?? "Exit")
      .setStyle(option.exit?.style ?? "DANGER");

    // set emoji
    if (option.start?.emoji) {
      startBtn.setEmoji(option.start.emoji);
    }

    if (option.end?.emoji) {
      endBtn.setEmoji(option.end.emoji);
    }

    if (option.next?.emoji) {
      nextBtn.setEmoji(option.next.emoji);
    }

    if (option.previous?.emoji) {
      prevBtn.setEmoji(option.previous.emoji);
    }

    if (option.exit?.emoji) {
      exitBtn.setEmoji(option.exit.emoji);
    }

    const buttons: MessageButton[] = [prevBtn, nextBtn];

    if (isStartEndAllowed()) {
      buttons.unshift(startBtn);
      buttons.push(endBtn);
    }

    if (option.enableExit) {
      buttons.push(exitBtn);
    }

    const row = new MessageActionRow().addComponents(buttons);

    // reset message payload additional parameters
    if (!newMessage.embeds) {
      newMessage.embeds = [];
    }

    if (!newMessage.files) {
      newMessage.files = [];
    }

    if (!newMessage.files) {
      newMessage.files = [];
    }

    if (!newMessage.attachments) {
      newMessage.attachments = [];
    }

    return { newMessage, paginationRow: row };
  } else {
    const paginator = paginate(totalPages, page, 1, 21).pages.map((i) => {
      // get custom page title
      const text =
        option.pageText instanceof Array
          ? option.pageText[i - 1]
          : option.pageText;

      return {
        label: (text ?? "Page {page}").replaceAll("{page}", `${i}`),
        value: (i - 1).toString(),
      };
    });

    if (isStartEndAllowed()) {
      // add start option
      paginator.unshift({
        label: option.labels?.start ?? "Start",
        value: SelectMenuPageId.Start.toString(),
      });

      // add end option
      paginator.push({
        label: option.labels?.end ?? "End",
        value: SelectMenuPageId.End.toString(),
      });
    }

    // add exit option
    if (option.enableExit) {
      paginator.push({
        label: option.labels?.exit ?? "Exit Pagination",
        value: SelectMenuPageId.Exit.toString(),
      });
    }

    const menu = new MessageSelectMenu()
      .setCustomId(option.menuId ?? defaultIds.menu)
      .setPlaceholder(option.placeholder ?? "Select page")
      .setOptions(paginator);

    const row = new MessageActionRow().addComponents([menu]);

    // reset message payload additional parameters
    if (!newMessage.embeds) {
      newMessage.embeds = [];
    }

    if (!newMessage.files) {
      newMessage.files = [];
    }

    if (!newMessage.files) {
      newMessage.files = [];
    }

    if (!newMessage.attachments) {
      newMessage.attachments = [];
    }

    return { newMessage, paginationRow: row };
  }
}
