import { Controller } from "@nestjs/common";
import { CrudController } from "../../common/crud.controller";
import { InquiriesService } from "./inquiries.service";

@Controller("inquiries")
export class InquiriesController extends CrudController<InquiriesService> {
  constructor(service: InquiriesService) {
    super(service);
  }
}
