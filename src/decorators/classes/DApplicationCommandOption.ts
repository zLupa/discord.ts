/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {
  Client,
  DApplicationCommandOptionChoice,
  SlashOptionType,
} from "../..";
import { ApplicationCommandOptionData } from "discord.js";
import { Decorator } from "./Decorator";

/**
 * @category Decorator
 */
export class DApplicationCommandOption extends Decorator {
  private _required = false;
  private _name: string;
  private _description: string;
  private _type: SlashOptionType;
  private _choices: DApplicationCommandOptionChoice[] = [];
  private _options: DApplicationCommandOption[] = [];
  private _isNode = false;

  get isNode() {
    return this._isNode;
  }
  set isNode(value) {
    this._isNode = value;
  }

  get options() {
    return this._options;
  }
  set options(value) {
    this._options = value;
  }

  get name() {
    return this._name;
  }
  set name(value) {
    this._name = value;
  }

  get type() {
    return this._type;
  }
  set type(value) {
    this._type = value;
  }

  get description() {
    return this._description;
  }
  set description(value) {
    this._description = value;
  }

  get required() {
    return this._required;
  }
  set required(value) {
    this._required = value;
  }

  get choices() {
    return this._choices;
  }
  set choices(value) {
    this._choices = value;
  }
  protected constructor(
    name: string,
    type?: SlashOptionType,
    description?: string,
    required?: boolean,
    index?: number
  ) {
    super();

    this._name = name.toLowerCase();
    this._type = type ?? "STRING";
    this._description = description ?? `${name} - ${this.type}`;
    this._required =
      required !== undefined ? required : Client.requiredByDefault;
    this._index = index;
  }

  static create(
    name: string,
    type?: SlashOptionType,
    description?: string,
    required?: boolean,
    index?: number
  ) {
    return new DApplicationCommandOption(
      name,
      type,
      description,
      required,
      index
    );
  }

  toObject(): ApplicationCommandOptionData {
    const data = {
      description: this.description,
      name: this.name,
      type: this.type,
      required: this.required,
      choices: this.choices.map((choice) => choice.toObject()),
      options: [...this.options].reverse().map((option) => option.toObject()),
    };

    if (this.isNode) {
      data.required = this.required;
    }
    return data as unknown as ApplicationCommandOptionData;
  }
}
