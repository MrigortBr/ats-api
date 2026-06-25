import { sendCredentialsEmail } from "../../common/mail/mail.service";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { configDotenv } from "dotenv";
import * as bcrypt from "bcrypt";
import { Users } from "../../modules/auth/entities/user.entity";
import { generatePassword, generateLogin } from "../../common/utils/generate-credentials";
import { Uf } from "../../modules/uf/entities/uf.entity";
import { TransportRtx } from "../../modules/transport-rtx/entities/transport-rtx.entity";
import { TransportTrs } from "../../modules/transport-trs/entities/transport-trs.entity";
import { GeneralQuota } from "../../modules/general-quota/entities/general-quota.entity";
import { DeliveredRtxTrs } from "../../modules/delivered-rtx-trs/entities/delivered-rtx-trs.entity";
import { DeliveredGeneralQuota } from "../../modules/delivered-general-quota/entities/delivered-general-quota.entity";
import { TransportValue } from "../../modules/transport-value/entities/transport-value.entity";

configDotenv();

const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: String(process.env.DB_USERNAME),
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_DATABASE,
    schema: "public",
    entities: [Users, Uf, TransportRtx, TransportTrs, GeneralQuota, DeliveredRtxTrs, DeliveredGeneralQuota, TransportValue],
    synchronize: false,
});

const UF_STATES: { uf: string; state: string; agreement: string | null; cib: string | null }[] = [
    // { uf: "AC", state: "Acre",                  agreement: "ESTADO",                                              cib: "Sim" },
    // { uf: "AL", state: "Alagoas",               agreement: "MUNICIPIOS - NOMES NA CIB",                          cib: "Sim" },
    // { uf: "AM", state: "Amazonas",              agreement: "DEFINICAO EM ANDAMENTO",                             cib: null },
    // { uf: "AP", state: "Amapa",                 agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Sim" },
    // { uf: "BA", state: "Bahia",                 agreement: "ESTADO",                                              cib: "Nao" },
    // { uf: "CE", state: "Ceara",                 agreement: "ESTADO",                                              cib: "Nao" },
    // { uf: "DF", state: "Distrito Federal",      agreement: "ESTADO",                                              cib: "Nao" },
    // { uf: "ES", state: "Espirito Santo",        agreement: "ESTADO",                                              cib: "Nao" },
    // { uf: "GO", state: "Goias",                 agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Sim" },
    // { uf: "MA", state: "Maranhao",              agreement: "ESTADO",                                              cib: "Sim" },
    // { uf: "MG", state: "Minas Gerais",          agreement: "ESTADO",                                              cib: "Sim" },
    // { uf: "MS", state: "Mato Grosso do Sul",    agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "MT", state: "Mato Grosso",           agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "PA", state: "Para",                  agreement: "MUNICIPIOS - NOMES E TIPO DE TS EM ANEXO",           cib: "Sim" },
    // { uf: "PB", state: "Paraiba",               agreement: "ESTADO E MUNICIPIOS - NOMES E TIPO DE TS EM ANEXO", cib: "Sim" },
    // { uf: "PE", state: "Pernambuco",            agreement: "MUNICIPIOS",                                          cib: "Sim" },
    // { uf: "PI", state: "Piaui",                 agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "PR", state: "Parana",                agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Sim" },
    // { uf: "RJ", state: "Rio de Janeiro",        agreement: "DEFINICAO EM ANDAMENTO",                             cib: null },
    // { uf: "RN", state: "Rio Grande do Norte",   agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "RO", state: "Rondonia",              agreement: "ESTADO",                                              cib: "Sim" },
    // { uf: "RR", state: "Roraima",               agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "RS", state: "Rio Grande do Sul",     agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "SC", state: "Santa Catarina",        agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
    // { uf: "SE", state: "Sergipe",               agreement: "MUNICIPIOS - NOMES E TIPO DE TS EM ANEXO",           cib: "Sim" },
    // { uf: "SP", state: "Sao Paulo",             agreement: "MUNICIPIOS",                                          cib: "Em andamento" },
    // { uf: "TO", state: "Tocantins",             agreement: "DEFINICAO EM ANDAMENTO",                             cib: "Nao" },
];

const RTX_DATA: Record<string, { van: number; ambulance: number; minibus: number }> = {
    // AC: { van: 2,  ambulance: 2,  minibus: 1  },
    // AL: { van: 4,  ambulance: 4,  minibus: 2  },
    // AM: { van: 6,  ambulance: 6,  minibus: 3  },
    // AP: { van: 2,  ambulance: 2,  minibus: 1  },
    // BA: { van: 18, ambulance: 18, minibus: 9  },
    // CE: { van: 0,  ambulance: 10, minibus: 15 },
    // DF: { van: 1,  ambulance: 1,  minibus: 1  },
    // ES: { van: 3,  ambulance: 3,  minibus: 3  },
    // GO: { van: 5,  ambulance: 5,  minibus: 5  },
    // MA: { van: 6,  ambulance: 6,  minibus: 3  },
    // MG: { van: 30, ambulance: 16, minibus: 2  },
    // MS: { van: 4,  ambulance: 4,  minibus: 4  },
    // MT: { van: 6,  ambulance: 6,  minibus: 6  },
    // PA: { van: 8,  ambulance: 8,  minibus: 4  },
    // PB: { van: 6,  ambulance: 6,  minibus: 3  },
    // PE: { van: 8,  ambulance: 8,  minibus: 4  },
    // PI: { van: 8,  ambulance: 8,  minibus: 4  },
    // PR: { van: 8,  ambulance: 8,  minibus: 4  },
    // RJ: { van: 4,  ambulance: 4,  minibus: 2  },
    // RN: { van: 4,  ambulance: 4,  minibus: 2  },
    // RO: { van: 0,  ambulance: 4,  minibus: 6  },
    // RR: { van: 2,  ambulance: 2,  minibus: 1  },
    // RS: { van: 14, ambulance: 14, minibus: 7  },
    // SC: { van: 16, ambulance: 16, minibus: 8  },
    // SE: { van: 2,  ambulance: 2,  minibus: 1  },
    // SP: { van: 19, ambulance: 19, minibus: 19 },
    // TO: { van: 4,  ambulance: 4,  minibus: 2  },
};

const TRS_DATA: Record<string, { van: number; microbus: number }> = {
    // AC: { van: 3,  microbus: 2  },
    // AL: { van: 12, microbus: 6  },
    // AM: { van: 11, microbus: 6  },
    // AP: { van: 3,  microbus: 1  },
    // BA: { van: 54, microbus: 42 },
    // CE: { van: 22, microbus: 23 },
    // DF: { van: 2,  microbus: 0  },
    // ES: { van: 7,  microbus: 5  },
    // GO: { van: 34, microbus: 18 },
    // MA: { van: 32, microbus: 28 },
    // MG: { van: 93, microbus: 30 },
    // MS: { van: 12, microbus: 5  },
    // MT: { van: 24, microbus: 12 },
    // PA: { van: 20, microbus: 27 },
    // PB: { van: 35, microbus: 12 },
    // PE: { van: 19, microbus: 33 },
    // PI: { van: 36, microbus: 19 },
    // PR: { van: 30, microbus: 15 },
    // RJ: { van: 5,  microbus: 3  },
    // RN: { van: 20, microbus: 10 },
    // RO: { van: 6,  microbus: 8  },
    // RR: { van: 3,  microbus: 1  },
    // RS: { van: 46, microbus: 24 },
    // SC: { van: 22, microbus: 10 },
    // SE: { van: 8,  microbus: 4  },
    // SP: { van: 21, microbus: 11 },
    // TO: { van: 26, microbus: 13 },
};

const GQ_DATA: Record<string, { van: number; ambulance: number; microbus: number }> = {
    // AC: { van: 1,  ambulance: 15, microbus: 11  },
    // AL: { van: 3,  ambulance: 11, microbus: 33  },
    // AM: { van: 7,  ambulance: 14, microbus: 12  },
    // AP: { van: 5,  ambulance: 16, microbus: 7   },
    // BA: { van: 19, ambulance: 51, microbus: 104 },
    // CE: { van: 12, ambulance: 38, microbus: 64  },
    // DF: { van: 0,  ambulance: 6,  microbus: 2   },
    // ES: { van: 1,  ambulance: 8,  microbus: 24  },
    // GO: { van: 8,  ambulance: 30, microbus: 38  },
    // MA: { van: 5,  ambulance: 38, microbus: 64  },
    // MG: { van: 18, ambulance: 39, microbus: 86  },
    // MS: { van: 1,  ambulance: 9,  microbus: 28  },
    // MT: { van: 5,  ambulance: 23, microbus: 38  },
    // PA: { van: 7,  ambulance: 31, microbus: 36  },
    // PB: { van: 45, ambulance: 18, microbus: 43  },
    // PE: { van: 11, ambulance: 27, microbus: 39  },
    // PI: { van: 3,  ambulance: 34, microbus: 42  },
    // PR: { van: 5,  ambulance: 26, microbus: 50  },
    // RJ: { van: 2,  ambulance: 17, microbus: 40  },
    // RN: { van: 2,  ambulance: 15, microbus: 19  },
    // RO: { van: 1,  ambulance: 12, microbus: 30  },
    // RR: { van: 0,  ambulance: 14, microbus: 13  },
    // RS: { van: 14, ambulance: 17, microbus: 41  },
    // SC: { van: 7,  ambulance: 9,  microbus: 30  },
    // SE: { van: 5,  ambulance: 23, microbus: 23  },
    // SP: { van: 11, ambulance: 51, microbus: 69  },
    // TO: { van: 6,  ambulance: 18, microbus: 24  },
};

const DELIVERED_RTX_DATA: Record<string, { van: number; ambulance: number; minibus: number }> = {
    // AC: { van: 2,  ambulance: 2,  minibus: 1  },
    // AL: { van: 4,  ambulance: 4,  minibus: 2  },
    // AM: { van: 6,  ambulance: 6,  minibus: 3  },
    // AP: { van: 2,  ambulance: 2,  minibus: 1  },
    // BA: { van: 18, ambulance: 18, minibus: 9  },
    // CE: { van: 0,  ambulance: 10, minibus: 15 },
    // DF: { van: 1,  ambulance: 1,  minibus: 1  },
    // ES: { van: 3,  ambulance: 3,  minibus: 3  },
    // GO: { van: 5,  ambulance: 5,  minibus: 5  },
    // MA: { van: 6,  ambulance: 6,  minibus: 3  },
    // MG: { van: 30, ambulance: 16, minibus: 2  },
    // MS: { van: 4,  ambulance: 4,  minibus: 4  },
    // MT: { van: 6,  ambulance: 6,  minibus: 6  },
    // PA: { van: 8,  ambulance: 8,  minibus: 4  },
    // PB: { van: 6,  ambulance: 6,  minibus: 3  },
    // PE: { van: 8,  ambulance: 8,  minibus: 4  },
    // PI: { van: 8,  ambulance: 8,  minibus: 4  },
    // PR: { van: 8,  ambulance: 8,  minibus: 4  },
    // RJ: { van: 4,  ambulance: 4,  minibus: 2  },
    // RN: { van: 4,  ambulance: 4,  minibus: 2  },
    // RO: { van: 0,  ambulance: 4,  minibus: 6  },
    // RR: { van: 2,  ambulance: 2,  minibus: 1  },
    // RS: { van: 14, ambulance: 14, minibus: 7  },
    // SC: { van: 16, ambulance: 16, minibus: 8  },
    // SE: { van: 2,  ambulance: 2,  minibus: 1  },
    // SP: { van: 19, ambulance: 19, minibus: 19 },
    // TO: { van: 4,  ambulance: 4,  minibus: 2  },
};

const DELIVERED_RTX_TRS_DATA: Record<string, { van: number; ambulance: number; microbus: number }> = {
    // AC: { van: 0,  ambulance: 0, microbus: 0  },
    // AL: { van: 0,  ambulance: 0, microbus: 8  },
    // AM: { van: 0,  ambulance: 0, microbus: 0  },
    // AP: { van: 0,  ambulance: 0, microbus: 0  },
    // BA: { van: 35, ambulance: 0, microbus: 51 },
    // CE: { van: 22, ambulance: 0, microbus: 38 },
    // DF: { van: 0,  ambulance: 0, microbus: 0  },
    // ES: { van: 10, ambulance: 0, microbus: 8  },
    // GO: { van: 0,  ambulance: 0, microbus: 0  },
    // MA: { van: 15, ambulance: 0, microbus: 0  },
    // MG: { van: 0,  ambulance: 0, microbus: 0  },
    // MS: { van: 0,  ambulance: 0, microbus: 0  },
    // MT: { van: 0,  ambulance: 0, microbus: 0  },
    // PA: { van: 28, ambulance: 0, microbus: 20 },
    // PB: { van: 15, ambulance: 0, microbus: 15 },
    // PE: { van: 0,  ambulance: 0, microbus: 0  },
    // PI: { van: 0,  ambulance: 0, microbus: 0  },
    // PR: { van: 0,  ambulance: 0, microbus: 0  },
    // RJ: { van: 0,  ambulance: 0, microbus: 0  },
    // RN: { van: 0,  ambulance: 0, microbus: 0  },
    // RO: { van: 0,  ambulance: 0, microbus: 0  },
    // RR: { van: 0,  ambulance: 0, microbus: 0  },
    // RS: { van: 0,  ambulance: 0, microbus: 0  },
    // SC: { van: 0,  ambulance: 0, microbus: 0  },
    // SE: { van: 10, ambulance: 0, microbus: 5  },
    // SP: { van: 0,  ambulance: 0, microbus: 0  },
    // TO: { van: 0,  ambulance: 0, microbus: 0  },
};

const DELIVERED_GQ_DATA: Record<string, { van: number; ambulance: number; microbus: number }> = {
    // AC: { van: 0,  ambulance: 0, microbus: 0  },
    // AL: { van: 3,  ambulance: 0, microbus: 33 },
    // AM: { van: 0,  ambulance: 0, microbus: 0  },
    // AP: { van: 0,  ambulance: 0, microbus: 0  },
    // BA: { van: 0,  ambulance: 0, microbus: 65 },
    // CE: { van: 0,  ambulance: 0, microbus: 0  },
    // DF: { van: 0,  ambulance: 0, microbus: 0  },
    // ES: { van: 1,  ambulance: 0, microbus: 24 },
    // GO: { van: 5,  ambulance: 0, microbus: 31 },
    // MA: { van: 7,  ambulance: 0, microbus: 67 },
    // MG: { van: 0,  ambulance: 0, microbus: 0  },
    // MS: { van: 0,  ambulance: 0, microbus: 0  },
    // MT: { van: 0,  ambulance: 0, microbus: 0  },
    // PA: { van: 7,  ambulance: 0, microbus: 16 },
    // PB: { van: 40, ambulance: 0, microbus: 28 },
    // PE: { van: 11, ambulance: 0, microbus: 39 },
    // PI: { van: 0,  ambulance: 0, microbus: 0  },
    // PR: { van: 5,  ambulance: 0, microbus: 50 },
    // RJ: { van: 2,  ambulance: 0, microbus: 40 },
    // RN: { van: 0,  ambulance: 0, microbus: 0  },
    // RO: { van: 0,  ambulance: 0, microbus: 0  },
    // RR: { van: 0,  ambulance: 0, microbus: 0  },
    // RS: { van: 0,  ambulance: 0, microbus: 41 },
    // SC: { van: 0,  ambulance: 0, microbus: 30 },
    // SE: { van: 5,  ambulance: 0, microbus: 23 },
    // SP: { van: 11, ambulance: 0, microbus: 63 },
    // TO: { van: 0,  ambulance: 0, microbus: 0  },
};

async function seed() {
    await dataSource.initialize();
    console.log("\n Iniciando seed...");

    const hashAmount = Number(process.env.HASH_AMOUNT ?? 12);

    const userRepo = dataSource.getRepository(Users);
    const adminEmail = "admin@ats.gov.br";
    const existing = await userRepo.findOne({ where: { email: adminEmail } });
    if (!existing) {
        const hashed = await bcrypt.hash("Admin@123", hashAmount);
        await userRepo.save(userRepo.create({ name: "Administrador", surname: "ATS", email: adminEmail, password: hashed, role: "admin" }));
        console.log("  + Usuario admin criado  ->  admin@ats.gov.br / Admin@123");
    } else {
        console.log("  - Usuario admin ja existe, pulando.");
    }

    const ufRepo = dataSource.getRepository(Uf);
    const existingUfs = await ufRepo.find();
    let ufRecords: Uf[];
    if (existingUfs.length === 0) {
        ufRecords = await ufRepo.save(UF_STATES.map((u) => ufRepo.create({ uf: u.uf, state: u.state, agreement: u.agreement || null, cib: u.cib || null })));
        console.log("  + " + ufRecords.length + " UFs criadas em uf");
    } else {
        ufRecords = existingUfs;
        console.log("  - uf ja possui dados, pulando.");
    }

    const transportRtxRepo = dataSource.getRepository(TransportRtx);
    if ((await transportRtxRepo.count()) === 0) {
        await transportRtxRepo.save(ufRecords.map((u) => {
            const d = RTX_DATA[u.uf] ?? { van: 0, ambulance: 0, minibus: 0 };
            return transportRtxRepo.create({ ufId: u.id, van: d.van, ambulance: d.ambulance, minibus: d.minibus });
        }));
        console.log("  + " + ufRecords.length + " registros criados em transport_rtx");
    } else {
        console.log("  - transport_rtx ja possui dados, pulando.");
    }

    const transportTrsRepo = dataSource.getRepository(TransportTrs);
    if ((await transportTrsRepo.count()) === 0) {
        await transportTrsRepo.save(ufRecords.map((u) => {
            const d = TRS_DATA[u.uf] ?? { van: 0, microbus: 0 };
            return transportTrsRepo.create({ ufId: u.id, van: d.van, microbus: d.microbus });
        }));
        console.log("  + " + ufRecords.length + " registros criados em transport_trs");
    } else {
        console.log("  - transport_trs ja possui dados, pulando.");
    }

    const generalQuotaRepo = dataSource.getRepository(GeneralQuota);
    if ((await generalQuotaRepo.count()) === 0) {
        await generalQuotaRepo.save(ufRecords.map((u) => {
            const d = GQ_DATA[u.uf] ?? { van: 0, ambulance: 0, microbus: 0 };
            return generalQuotaRepo.create({ ufId: u.id, van: d.van, ambulance: d.ambulance, microbus: d.microbus });
        }));
        console.log("  + " + ufRecords.length + " registros criados em general_quota");
    } else {
        console.log("  - general_quota ja possui dados, pulando.");
    }

    const deliveredRtxTrsRepo = dataSource.getRepository(DeliveredRtxTrs);
    await dataSource.query('TRUNCATE TABLE delivered_rtx_trs RESTART IDENTITY CASCADE');
    await deliveredRtxTrsRepo.save(ufRecords.map((u) => {
        const d = DELIVERED_RTX_TRS_DATA[u.uf] ?? { van: 0, ambulance: 0, microbus: 0 };
        return deliveredRtxTrsRepo.create({
            ufId: u.id,
            van:      d.van,
            ambulance: d.ambulance,
            minibus:  d.microbus,
        });
    }));
    console.log("  + " + ufRecords.length + " registros atualizados em delivered_rtx_trs");


    const deliveredGqRepo = dataSource.getRepository(DeliveredGeneralQuota);
    await dataSource.query('TRUNCATE TABLE delivered_general_quota RESTART IDENTITY CASCADE');
    await deliveredGqRepo.save(ufRecords.map((u) => {
        const d = DELIVERED_GQ_DATA[u.uf] ?? { van: 0, ambulance: 0, microbus: 0 };
        return deliveredGqRepo.create({ ufId: u.id, van: d.van, ambulance: d.ambulance, microbus: d.microbus });
    }));
    console.log("  + " + ufRecords.length + " registros atualizados em delivered_general_quota");

    const transportValueRepo = dataSource.getRepository(TransportValue);
    if ((await transportValueRepo.count()) === 0) {
        await transportValueRepo.save([
            transportValueRepo.create({ name: "Ambulancia tipo A", price: 274977.00 }),
            transportValueRepo.create({ name: "Van", price: 304600.00 }),
            transportValueRepo.create({ name: "Micro-Onibus", price: 584600.00 }),
        ]);
        console.log("  + 3 registros criados em transport_value");
    } else {
        console.log("  - transport_value ja possui dados, pulando.");
    }

    // --- Usuarios extras ---
    // email e gerado automaticamente como nome.sobrenome@saude.gov.br
    const USERS_TO_SEED: { name: string; surname: string; role: "admin" | "gestor" | "visualizador" }[] = [
        // { name: "Rosalva", surname: "Silva", role: "gestor"  },
        // { name: "Andressa", surname: "Gorla", role: "gestor"  },
        // { name: "Amanda", surname: "Chaves", role: "admin"  },
        // { name: "Igor",   surname: "Lins",  role: "admin" },
        // { name: "Juarez", surname: "Silva", role: "admin"  },
        // { name: "Henrique", surname: "Faria", role: "gestor"  },
        // { name: "Maria", surname: "Torquato", role: "gestor"  },
        // { name: "Thiago", surname: "Marcal", role: "visualizador"  },
        // { name: "Philippe", surname: "Rodrigues", role: "visualizador"  },
        // { name: "Raquel", surname: "Machado", role: "visualizador"  },
        // { name: "Crystina", surname: "Yamamoto", role: "visualizador"  },
    ];

    if (USERS_TO_SEED.length > 0) {
        console.log("\n  Usuarios extras:");
        for (const u of USERS_TO_SEED) {
            const email = `${generateLogin(u.name, u.surname)}@saude.gov.br`;
            const alreadyExists = await userRepo.findOne({ where: { email } });
            if (!alreadyExists) {
                const plain = generatePassword(u.name, u.surname);
                const hashed = await bcrypt.hash(plain, hashAmount);
                await userRepo.save(userRepo.create({
                    name: u.name,
                    surname: u.surname,
                    email,
                    password: hashed,
                    role: u.role,
                }));
                await sendCredentialsEmail({
                    to: email,
                    name: u.name,
                    password: plain,
                }).catch((err: Error) => console.warn("  ! Email falhou para", email, "-", err.message));
                console.log("    + " + email + " | " + plain);
            } else {
                console.log("    - " + email + " ja existe, pulando.");
            }
        }
    }

    await dataSource.destroy();
    console.log("\n Seed concluido!\n");
}

seed().catch((err) => {
    console.error("Erro no seed:", err);
    process.exit(1);
});
