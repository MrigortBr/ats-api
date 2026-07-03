import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpCacheInterceptor } from "./common/interceptors/cache.interceptor";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Headers de seguranca HTTP (X-Frame-Options, HSTS, X-Content-Type-Options, etc.)
    app.use(helmet({
        // CSP desativado aqui -- frontend Next.js controla o proprio CSP
        contentSecurityPolicy: false,
    }));

    // Compressao gzip -- reduz payload em ~70% (critico pra mobile)
    app.use(compression({ level: 6, threshold: 1024 }));

    // Parse de cookies HttpOnly (necessario para autenticacao via cookie)
    app.use(cookieParser());

    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin && process.env.NODE_ENV === "production") {
        throw new Error("CORS_ORIGIN nao definida em producao -- configure o arquivo .env");
    }
    app.enableCors({
        origin: corsOrigin ?? "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        maxAge: 86400,
    });

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new HttpCacheInterceptor(), new ResponseInterceptor());
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Keep-Alive -- reutiliza conexoes TCP
    const server = app.getHttpServer();
    server.keepAliveTimeout = 65_000;
    server.headersTimeout   = 66_000;

    // Swagger -- desabilitado por padrao; ative com SWAGGER_ENABLED=true no .env
    if (process.env.SWAGGER_ENABLED === "true") {
        const config = new DocumentBuilder()
            .setTitle("ATS API")
            .setDescription(
                "Acompanhamento do Transporte Sanitario -- Lei 15.233/2025\n\n" +
                "**Todas as respostas** sao embrulhadas pelo ResponseInterceptor:\n" +
                "```json\n{ \"timestamp\": \"...\", \"message\": \"OK\", \"data\": <payload> }\n```\n\n" +
                "Use o botao **Authorize** para inserir o JWT obtido em POST /auth/login."
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
    logger.log(`Ready in ${process.uptime().toFixed(1)}s`);
    logger.log(`Local:   http://localhost:${port}`);
    if (process.env.SWAGGER_ENABLED === "true") {
        logger.log(`Swagger: http://localhost:${port}/docs`);
    }
    logger.log("-=-=-=-=--=-=-=-=--=-=-=-=-");
}

bootstrap();
