import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import express from "express";
import type { Express } from "express";

const expressServer: Express = express();
let cachedApp: Express | null = null;

export async function createApp(): Promise<Express> {
    if (cachedApp) return cachedApp;

    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressServer),
        { logger: false },
    );

    app.enableCors();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    cachedApp = expressServer;
    return cachedApp;
}
