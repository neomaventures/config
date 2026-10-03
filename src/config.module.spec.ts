import { Controller, Module } from "@nestjs/common"
import { Test } from "@nestjs/testing"

import { ConfigModule, ConfigService, InjectConfig, TypedConfig } from "./index"

describe("ConfigModule", () => {
  describe("forRoot()", () => {
    it("should return a global dynamic module", () => {
      const module = ConfigModule.forRoot()
      expect(module).toHaveProperty("global", true)
    })
  })

  describe("global registration", () => {
    it("should make ConfigService available to child modules that do not import ConfigModule", async () => {
      @Controller()
      class ChildController {
        public constructor(
          @InjectConfig()
          public config: TypedConfig<{ testVar: string }>,
        ) {}
      }

      @Module({
        controllers: [ChildController],
      })
      class ChildModule {}

      const module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), ChildModule],
      }).compile()

      const controller = module.get(ChildController)
      expect(controller.config).toBeInstanceOf(ConfigService)
    })

    it("should throw if not initialised through forRoot", async () => {
      const module = await Test.createTestingModule({
        imports: [ConfigModule],
      }).compile()

      await expect(module.init()).rejects.toThrow(
        /must be registered with ConfigModule.forRoot\(\)/,
      )
    })
  })
})
