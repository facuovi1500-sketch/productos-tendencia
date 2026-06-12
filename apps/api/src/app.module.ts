import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { CommunityModule } from "./modules/community/community.module";
import { ContentModule } from "./modules/content/content.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { InquiriesModule } from "./modules/inquiries/inquiries.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./auth/roles.guard";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    ProvidersModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    CommunityModule,
    ContentModule,
    MetricsModule,
    InquiriesModule,
    FinanceModule,
    AssistantModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
