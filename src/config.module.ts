import {
  DynamicModule,
  Inject,
  Module,
  OnModuleInit,
  Optional,
} from "@nestjs/common"
import * as dotenv from "dotenv"

import { CONFIG_OPTIONS, ConfigOptions, ConfigService } from "./config.service"

/**
 * Module that provides type-safe access to environment variables through dependency injection.
 * Automatically converts between camelCase properties and SCREAMING_SNAKE_CASE environment variables.
 *
 * Must be registered via `forRoot()` which makes the module global. Importing
 * the class directly — `imports: [ConfigModule]` — registers nothing, so the
 * module throws on init rather than leaving you without a ConfigService.
 *
 * There is no `forRootAsync()`. It exists for options that depend on other
 * injectables, and configuration is what everything else is constructed from —
 * there is nothing to await, and anything you might inject would itself need
 * config to exist.
 *
 * @example
 * // Register once at the app root — available everywhere
 * imports: [ConfigModule.forRoot()]
 *
 * @example
 * // With strict mode - throws on undefined env vars
 * imports: [ConfigModule.forRoot({ strict: true })]
 *
 * @example
 * // With coerce enabled - automatic type conversion
 * imports: [ConfigModule.forRoot({ coerce: true })]
 */
/**
 * Marks a module instance as having come from `forRoot()`. Only that path
 * provides it, so its absence means the class was imported directly.
 */
const REGISTERED_VIA_FOR_ROOT = Symbol("ConfigModule.forRoot")

@Module({})
export class ConfigModule implements OnModuleInit {
  public constructor(
    @Optional()
    @Inject(REGISTERED_VIA_FOR_ROOT)
    private readonly registered?: true,
  ) {}

  /**
   * Fails fast when the class was imported without `forRoot()`. Without this
   * the module registers no providers and stays silent: nothing is exported,
   * so either a consumer hits Nest's generic "can't resolve dependencies"
   * somewhere unrelated, or — if nothing injects ConfigService — nothing
   * happens at all and the misconfiguration is never noticed.
   */
  public onModuleInit(): void {
    if (!this.registered) {
      throw new Error(
        "ConfigModule must be registered with ConfigModule.forRoot(). " +
          "Importing the class directly registers no providers.",
      )
    }
  }

  public static forRoot({
    loadEnv = false,
    strict = false,
    coerce = false,
  }: Partial<ConfigOptions> = {}): DynamicModule {
    if (loadEnv) {
      dotenv.config({
        path: [
          `.env.${process.env.NODE_ENV}.local`,
          ".env.local",
          `.env.${process.env.NODE_ENV}`,
          ".env",
        ],
        quiet: true,
      })
    }

    return {
      global: true,
      module: ConfigModule,
      providers: [
        ConfigService,
        { provide: CONFIG_OPTIONS, useValue: { loadEnv, strict, coerce } },
        { provide: REGISTERED_VIA_FOR_ROOT, useValue: true },
      ],
      exports: [ConfigService],
    }
  }
}
