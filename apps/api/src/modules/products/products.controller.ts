import { Controller } from "@nestjs/common";
import { CrudController } from "../../common/crud.controller";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController extends CrudController<ProductsService> {
  constructor(service: ProductsService) {
    super(service);
  }
}
