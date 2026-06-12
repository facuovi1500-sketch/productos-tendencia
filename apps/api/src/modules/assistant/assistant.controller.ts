import { Body, Controller, Post } from "@nestjs/common";
import { AssistantService } from "./assistant.service";
import type { AssistantConfirmRequest } from "./assistant.types";

@Controller("assistant")
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Post("interpret")
  interpret(@Body() body: { text?: string }) {
    return this.service.interpret(body);
  }

  @Post("confirm")
  confirm(@Body() body: AssistantConfirmRequest) {
    return this.service.confirm(body);
  }
}
