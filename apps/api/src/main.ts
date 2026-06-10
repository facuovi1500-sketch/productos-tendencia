import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>("CORS_ORIGIN");
  if (!corsOrigin && config.get<string>("NODE_ENV") === "production") {
    throw new Error("CORS_ORIGIN is required in production");
  }

  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(",").map((origin) => origin.trim()) : true,
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(Number(config.get("PORT") ?? 4000));
}

bootstrap();
