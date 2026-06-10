import { Controller } from "@nestjs/common";
import { CrudController } from "../../common/crud.controller";
import { ContentService } from "./content.service";

@Controller("content")
export class ContentController extends CrudController<ContentService> {
  constructor(service: ContentService) {
    super(service);
  }
}
