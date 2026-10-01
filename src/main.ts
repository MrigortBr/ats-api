import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpCacheInterceptor } from "./common/interceptors/cache.interceptor";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import { json, urlencoded } from "express";
import { criarVerificacaoDeOrigem, origensPermitidas } from "./common/security/origin-check.middleware";

dotenv.config();

async function bootstrap() {
    // bodyParser: false -- desativa o body-parser automatico do Nest (limite padrao de 100kb)
    // pra registrar o nosso proprio, com limite maior (importacoes em massa como a de
    // status de combo-equipamento via planilha mandam centenas/milhares de linhas em JSON).
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

    // IP real do cliente atras de proxy/load balancer (usado no registro de aceite do termo).
    // TRUST_PROXY = numero de proxies confiaveis a frente da API (ex.: 1) ou lista de IPs/CIDRs.
    // Sem a variavel, req.ip e o IP da conexao direta e o X-Forwarded-For e ignorado
    // (evita que o cliente forje o proprio IP pelo header).
    const trustProxy = process.env.TRUST_PROXY?.trim();
    if (trustProxy) {
        app.set("trust proxy", /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
    }

    app.use(json({ limit: "15mb" }));
    app.use(urlencoded({ extended: true, limit: "15mb" }));

    // Headers de seguranca HTTP (X-Frame-Options, HSTS, X-Content-Type-Options, etc.)
    app.use(
        helmet({
            // CSP desativado aqui -- frontend Next.js controla o proprio CSP
            contentSecurityPolicy: false,
        }),
    );

    // Compressao gzip -- reduz payload em ~70% (critico pra mobile)
    app.use(compression({ level: 6, threshold: 1024 }));

    // Parse de cookies HttpOnly (necessario para autenticacao via cookie)
    app.use(cookieParser());

    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin && process.env.NODE_ENV === "production") {
        throw new Error(
            "CORS_ORIGIN nao definida em producao -- configure o arquivo .env",
        );
    }
    // CORS_ORIGIN aceita uma ou mais origens separadas por virgula.
    const origens = origensPermitidas(corsOrigin);
    app.enableCors({
        origin: origens.length === 1 ? origens[0] : origens,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
        credentials: true,
        maxAge: 86400,
    });

    // Anti-CSRF: POST/PUT/PATCH/DELETE vindos de navegador so de origens do CORS_ORIGIN.
    app.use(criarVerificacaoDeOrigem(origens));

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
        new HttpCacheInterceptor(),
        new ResponseInterceptor(),
    );
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Documentacao Swagger em /docs -- so fora de producao e so com SWAGGER_ENABLED=true.
    // Em producao nunca e exposta, mesmo que a variavel esteja ligada por engano.
    const swaggerOn =
        process.env.SWAGGER_ENABLED === "true" && process.env.NODE_ENV !== "production";
    if (swaggerOn) {
        const config = new DocumentBuilder()
            .setTitle("ATS API")
            .setDescription("API do Painel de Acompanhamento de Transportes e Equipamentos")
            .setVersion("1.0")
            .addCookieAuth("jwt")
            .build();
        SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
    }

    // Keep-Alive -- reutiliza conexoes TCP
    const server = app.getHttpServer();
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    const port = Number(process.env.PORT) || 2001;
    await app.listen(port);

    const logger = new Logger();
    logger.log("");
    logger.log("-=-=-=-=- ATS API -=-=-=-=-");
    logger.log(`Ready in ${process.uptime().toFixed(1)}s`);
    logger.log(`Local:   http://localhost:${port}`);
    if (swaggerOn) logger.log(`Docs:    http://localhost:${port}/docs`);
    logger.log("-=-=-=-=--=-=-=-=--=-=-=-=-");
}

bootstrap();
