import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpCacheInterceptor } from "./common/interceptors/cache.interceptor";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Compressão gzip — reduz payload em ~70% (crítico pra mobile)
    app.use(compression({ level: 6, threshold: 1024 }));

    // Parse de cookies HttpOnly (necessário para autenticação via cookie)
    app.use(cookieParser());

    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // obrigatório para envio de cookies cross-origin
        maxAge: 86400, // preflight cache por 24h — elimina OPTIONS request repetido
    });

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new HttpCacheInterceptor(), new ResponseInterceptor());
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Keep-Alive — reutiliza conexões TCP (importante pra mobile com latência alta)
    const server = app.getHttpServer();
    server.keepAliveTimeout = 65_000;
    server.headersTimeout   = 66_000;

    if (process.env.SWAGGER_ENABLED !== "false") {
        const config = new DocumentBuilder()
            .setTitle("ATS API")
            .setDescription(
                "Acompanhamento do Transporte Sanitário — Lei 15.233/2025\n\n" +
                "**Todas as respostas** são embrulhadas pelo ResponseInterceptor:\n" +
                "```json\n{ \"timestamp\": \"...\", \"message\": \"OK\", \"data\": <payload> }\n```\n\n" +
                "Use o botão **Authorize** para inserir o JWT obtido em POST /auth/login."
            )
            .setVersion("1.0")
            .addBearerAuth(
                { type: "http", scheme: "bearer", bearerFormat: "JWT", name: "bearer" },
                "bearer",
            )
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup("docs", app, document);
    }

    const port = Number(process.env.PORT) || 2001;
    await app.listen(port);

    const logger = new Logger();
    logger.log("");
    logger.log("-=-=-=-=- ATS API -=-=-=-=-");
    logger.log(`✓ Ready in ${process.uptime().toFixed(1)}s`);
    logger.log(`➜ Local:   http://localhost:${port}`);
    logger.log(`➜ Swagger: http://localhost:${port}/docs`);
    logger.log("-=-=-=-=--=-=-=-=--=-=-=-=-");
}

bootstrap();
