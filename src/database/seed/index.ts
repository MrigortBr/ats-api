import { sendCredentialsEmail } from "../../common/mail/mail.service";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { configDotenv } from "dotenv";
import * as bcrypt from "bcrypt";
import { Users } from "../../modules/auth/entities/user.entity";
import { Role } from "../../modules/role/entities/role.entity";
import { RoleModule } from "../../modules/role/entities/role-module.entity";
import { Company } from "../../modules/company/entities/company.entity";
import { generatePassword, generateLogin } from "../../common/utils/generate-credentials";
import { Uf } from "../../modules/uf/entities/uf.entity";
import { TransportRtx } from "../../modules/transport-rtx/entities/transport-rtx.entity";
import { TransportTrs } from "../../modules/transport-trs/entities/transport-trs.entity";
import { GeneralQuota } from "../../modules/general-quota/entities/general-quota.entity";
import { TransportValue } from "../../modules/transport-value/entities/transport-value.entity";
import { DeliveredRtxTrs } from "../../modules/delivered-rtx-trs/entities/delivered-rtx-trs.entity";
import { DeliveredGeneralQuota } from "../../modules/delivered-general-quota/entities/delivered-general-quota.entity";

configDotenv();

const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: String(process.env.DB_USERNAME),
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_DATABASE,
    schema: "public",
    entities: [Users, Role, RoleModule, Company, Uf, TransportRtx, TransportTrs, GeneralQuota, TransportValue, DeliveredRtxTrs, DeliveredGeneralQuota],
    synchronize: false,
});

const UF_STATES: { uf: string; state: string; agreement: string | null; cib: string | null }[] = [
    { uf: "AC", state: "Acre",                 agreement: "ESTADO",                                            cib: "Sim"          },
    { uf: "AL", state: "Alagoas",              agreement: "MUNICIPIOS - NOMES NA CIB",                         cib: "Sim"          },
    { uf: "AM", state: "Amazonas",             agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "AP", state: "Amapa",                agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Sim"          },
    { uf: "BA", state: "Bahia",                agreement: "ESTADO",                                            cib: "Nao"          },
    { uf: "CE", state: "Ceara",                agreement: "ESTADO",                                            cib: "Nao"          },
    { uf: "DF", state: "Distrito Federal",     agreement: "ESTADO",                                            cib: "Nao"          },
    { uf: "ES", state: "Espirito Santo",       agreement: "ESTADO",                                            cib: "Nao"          },
    { uf: "GO", state: "Goias",                agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Sim"          },
    { uf: "MA", state: "Maranhao",             agreement: "ESTADO",                                            cib: "Sim"          },
    { uf: "MG", state: "Minas Gerais",         agreement: "ESTADO",                                            cib: "Sim"          },
    { uf: "MS", state: "Mato Grosso do Sul",   agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "MT", state: "Mato Grosso",          agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "PA", state: "Para",                 agreement: "MUNICIPIOS - NOMES E TIPO DE TS EM ANEXO",          cib: "Sim"          },
    { uf: "PB", state: "Paraiba",              agreement: "ESTADO E MUNICIPIOS - NOMES E TIPO DE TS EM ANEXO", cib: "Sim"          },
    { uf: "PE", state: "Pernambuco",           agreement: "MUNICIPIOS",                                        cib: "Sim"          },
    { uf: "PI", state: "Piaui",                agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "PR", state: "Parana",               agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Sim"          },
    { uf: "RJ", state: "Rio de Janeiro",       agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "RN", state: "Rio Grande do Norte",  agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "RO", state: "Rondonia",             agreement: "ESTADO",                                            cib: "Sim"          },
    { uf: "RR", state: "Roraima",              agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "RS", state: "Rio Grande do Sul",    agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "SC", state: "Santa Catarina",       agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "SE", state: "Sergipe",              agreement: "MUNICIPIOS - NOMES E TIPO DE TS EM ANEXO",          cib: "Sim"          },
    { uf: "SP", state: "Sao Paulo",            agreement: "MUNICIPIOS",                                        cib: "Em andamento" },
    { uf: "TO", state: "Tocantins",            agreement: "DEFINICAO EM ANDAMENTO",                            cib: "Nao"          },
    { uf: "ZZ", state: "A Definir",            agreement: null,                                                cib: null           },
];

const RTX_DATA: Record<string, { van: number; ambulance: number; minibus: number }> = {
    AC: { van: 2,  ambulance: 2,  minibus: 1  },
    AL: { van: 4,  ambulance: 4,  minibus: 2  },
    AM: { van: 2,  ambulance: 4,  minibus: 1  },
    AP: { van: 2,  ambulance: 2,  minibus: 1  },
    BA: { van: 18, ambulance: 18, minibus: 9  },
    CE: { van: 0,  ambulance: 10, minibus: 15 },
    DF: { van: 1,  ambulance: 1,  minibus: 1  },
    ES: { van: 3,  ambulance: 3,  minibus: 3  },
    GO: { van: 5,  ambulance: 5,  minibus: 5  },
    MA: { van: 6,  ambulance: 6,  minibus: 3  },
    MG: { van: 30, ambulance: 16, minibus: 2  },
    MS: { van: 4,  ambulance: 4,  minibus: 4  },
    MT: { van: 6,  ambulance: 6,  minibus: 6  },
    PA: { van: 8,  ambulance: 8,  minibus: 4  },
    PB: { van: 6,  ambulance: 6,  minibus: 3  },
    PE: { van: 8,  ambulance: 8,  minibus: 4  },
    PI: { van: 8,  ambulance: 8,  minibus: 4  },
    PR: { van: 8,  ambulance: 8,  minibus: 4  },
    RJ: { van: 4,  ambulance: 4,  minibus: 2  },
    RN: { van: 4,  ambulance: 4,  minibus: 2  },
    RO: { van: 0,  ambulance: 4,  minibus: 6  },
    RR: { van: 2,  ambulance: 2,  minibus: 1  },
    RS: { van: 14, ambulance: 14, minibus: 7  },
    SC: { van: 16, ambulance: 16, minibus: 8  },
    SE: { van: 2,  ambulance: 2,  minibus: 1  },
    SP: { van: 19, ambulance: 19, minibus: 19 },
    TO: { van: 4,  ambulance: 4,  minibus: 2  },
};

const TRS_DATA: Record<string, { van: number; microbus: number }> = {
    AC: { van: 3,  microbus: 2  },
    AL: { van: 12, microbus: 6  },
    AM: { van: 4,  microbus: 2  },
    AP: { van: 3,  microbus: 1  },
    BA: { van: 54, microbus: 42 },
    CE: { van: 22, microbus: 23 },
    DF: { van: 2,  microbus: 0  },
    ES: { van: 7,  microbus: 5  },
    GO: { van: 34, microbus: 18 },
    MA: { van: 32, microbus: 28 },
    MG: { van: 93, microbus: 30 },
    MS: { van: 12, microbus: 5  },
    MT: { van: 24, microbus: 12 },
    PA: { van: 20, microbus: 27 },
    PB: { van: 35, microbus: 12 },
    PE: { van: 19, microbus: 33 },
    PI: { van: 36, microbus: 19 },
    PR: { van: 30, microbus: 15 },
    RJ: { van: 5,  microbus: 3  },
    RN: { van: 20, microbus: 10 },
    RO: { van: 6,  microbus: 8  },
    RR: { van: 3,  microbus: 1  },
    RS: { van: 46, microbus: 24 },
    SC: { van: 22, microbus: 10 },
    SE: { van: 8,  microbus: 4  },
    SP: { van: 21, microbus: 11 },
    TO: { van: 26, microbus: 13 },
};

const GQ_DATA: Record<string, { van: number; ambulance: number; microbus: number }> = {
    AC: { van: 1,  ambulance: 15, microbus: 11  },
    AL: { van: 3,  ambulance: 11, microbus: 33  },
    AM: { van: 7,  ambulance: 14, microbus: 12  },
    AP: { van: 5,  ambulance: 16, microbus: 7   },
    BA: { van: 19, ambulance: 51, microbus: 104 },
    CE: { van: 13, ambulance: 38, microbus: 67  },
    DF: { van: 0,  ambulance: 6,  microbus: 2   },
    ES: { van: 1,  ambulance: 8,  microbus: 24  },
    GO: { van: 8,  ambulance: 30, microbus: 38  },
    MA: { van: 5,  ambulance: 38, microbus: 64  },
    MG: { van: 18, ambulance: 39, microbus: 86  },
    MS: { van: 1,  ambulance: 9,  microbus: 28  },
    MT: { van: 5,  ambulance: 23, microbus: 38  },
    PA: { van: 7,  ambulance: 31, microbus: 36  },
    PB: { van: 45, ambulance: 18, microbus: 43  },
    PE: { van: 11, ambulance: 27, microbus: 39  },
    PI: { van: 3,  ambulance: 34, microbus: 42  },
    PR: { van: 5,  ambulance: 26, microbus: 50  },
    RJ: { van: 2,  ambulance: 16, microbus: 40  },
    RN: { van: 2,  ambulance: 15, microbus: 19  },
    RO: { van: 1,  ambulance: 12, microbus: 30  },
    RR: { van: 0,  ambulance: 14, microbus: 13  },
    RS: { van: 14, ambulance: 17, microbus: 41  },
    SC: { van: 7,  ambulance: 9,  microbus: 30  },
    SE: { van: 5,  ambulance: 23, microbus: 23  },
    SP: { van: 11, ambulance: 51, microbus: 69  },
    TO: { van: 6,  ambulance: 18, microbus: 24  },
    ZZ: { van: 10, ambulance: 3,  microbus: 3   }, // "A Definir" — veículos sem UF definida
};

// Dados de entrega RTx+TRS extraídos do xlsx "RTx e TRS_ Lei 15.233 de 2025_Atualizado (5).xlsx"
// Aba "Entrega RTx e TRS" — colunas I/J/K (ent_van / ent_amb / ent_micro)
// Estados ausentes aqui não são sobrescritos pelo seed (preserva dados do UI)
const DELIVERED_RTX_DATA: Record<string, { van: number; ambulance: number; minibus: number }> = {
    AL: { van: 0,  ambulance: 0, minibus: 8  },
    BA: { van: 35, ambulance: 0, minibus: 51 },
    CE: { van: 22, ambulance: 0, minibus: 38 },
    ES: { van: 10, ambulance: 0, minibus: 8  },
    MA: { van: 15, ambulance: 0, minibus: 0  },
    PA: { van: 28, ambulance: 0, minibus: 20 },
    PB: { van: 15, ambulance: 0, minibus: 15 },
    SE: { van: 10, ambulance: 0, minibus: 5  },
};


async function seed() {
    await dataSource.initialize();
    console.log("\n Iniciando seed...");

    const hashAmount = Number(process.env.HASH_AMOUNT ?? 12);

    const userRepo = dataSource.getRepository(Users);
    const roleRepo = dataSource.getRepository(Role);
    const adminEmail = "admin@ats.gov.br";
    const existing = await userRepo.findOne({ where: { email: adminEmail } });
    if (!existing) {
        const hashed = await bcrypt.hash("Admin@123", hashAmount);
        await userRepo.save(userRepo.create({ name: "Administrador", surname: "ATS", email: adminEmail, password: hashed }));
        console.log("  + Usuario admin criado  ->  admin@ats.gov.br / Admin@123");
    } else {
        console.log("  - Usuario admin ja existe, pulando.");
    }

    // ── UF: insert se não existe, update só o state (preserva agreement/cib/region/hasFluxo) ──
    const ufRepo = dataSource.getRepository(Uf);
    for (const u of UF_STATES) {
        const existing = await ufRepo.findOne({ where: { uf: u.uf } });
        if (!existing) {
            await ufRepo.save(ufRepo.create({ uf: u.uf, state: u.state, agreement: u.agreement, cib: u.cib }));
        } else {
            // Restaura state, agreement e cib. region e hasFluxo são preservados.
            await ufRepo.update(existing.id, { state: u.state, agreement: u.agreement, cib: u.cib });
        }
    }
    const ufRecords = await ufRepo.find();
    console.log("  ✓ uf: " + ufRecords.length + " UFs sincronizadas");

    // ── transport_rtx: find-or-create + update por ufId ─────────────────────
    const transportRtxRepo = dataSource.getRepository(TransportRtx);
    for (const u of ufRecords) {
        const d = RTX_DATA[u.uf] ?? { van: 0, ambulance: 0, minibus: 0 };
        const existing = await transportRtxRepo.findOne({ where: { ufId: u.id } });
        if (existing) {
            await transportRtxRepo.update(existing.id, { van: d.van, ambulance: d.ambulance, minibus: d.minibus });
        } else {
            await transportRtxRepo.save(transportRtxRepo.create({ ufId: u.id, van: d.van, ambulance: d.ambulance, minibus: d.minibus }));
        }
    }
    console.log("  ✓ transport_rtx: " + ufRecords.length + " registros sincronizados");

    // ── transport_trs: find-or-create + update por ufId ─────────────────────
    const transportTrsRepo = dataSource.getRepository(TransportTrs);
    for (const u of ufRecords) {
        const d = TRS_DATA[u.uf] ?? { van: 0, microbus: 0 };
        const existing = await transportTrsRepo.findOne({ where: { ufId: u.id } });
        if (existing) {
            await transportTrsRepo.update(existing.id, { van: d.van, microbus: d.microbus });
        } else {
            await transportTrsRepo.save(transportTrsRepo.create({ ufId: u.id, van: d.van, microbus: d.microbus }));
        }
    }
    console.log("  ✓ transport_trs: " + ufRecords.length + " registros sincronizados");

    // ── general_quota: find-or-create + update por ufId ─────────────────────
    const generalQuotaRepo = dataSource.getRepository(GeneralQuota);
    for (const u of ufRecords) {
        const d = GQ_DATA[u.uf] ?? { van: 0, ambulance: 0, microbus: 0 };
        const existing = await generalQuotaRepo.findOne({ where: { ufId: u.id } });
        if (existing) {
            await generalQuotaRepo.update(existing.id, { van: d.van, ambulance: d.ambulance, microbus: d.microbus });
        } else {
            await generalQuotaRepo.save(generalQuotaRepo.create({ ufId: u.id, van: d.van, ambulance: d.ambulance, microbus: d.microbus }));
        }
    }
    console.log("  ✓ general_quota: " + ufRecords.length + " registros sincronizados");

    // ── delivered_rtx_trs: atualiza se há dado no xlsx; cria zerado se não existe ──
    const deliveredRtxTrsRepo = dataSource.getRepository(DeliveredRtxTrs);
    let deliveredRtxCreated = 0; let deliveredRtxUpdated = 0;
    for (const u of ufRecords) {
        const d = DELIVERED_RTX_DATA[u.uf];
        const existing = await deliveredRtxTrsRepo.findOne({ where: { ufId: u.id } });
        if (existing) {
            if (d) {
                // Tem dado no xlsx: atualiza
                await deliveredRtxTrsRepo.update(existing.id, { van: d.van, ambulance: d.ambulance, minibus: d.minibus });
                deliveredRtxUpdated++;
            }
            // Sem dado no xlsx: preserva o que está no banco (não toca)
        } else {
            // Não existe: cria com dado do xlsx ou zeros
            await deliveredRtxTrsRepo.save(deliveredRtxTrsRepo.create({ ufId: u.id, van: d?.van ?? 0, ambulance: d?.ambulance ?? 0, minibus: d?.minibus ?? 0 }));
            deliveredRtxCreated++;
        }
    }
    console.log("  ✓ delivered_rtx_trs: " + deliveredRtxCreated + " criada(s), " + deliveredRtxUpdated + " atualizada(s)");

    // ── delivered_general_quota: cria linha zerada se não existe (preserva dados existentes) ──
    const deliveredGQRepo = dataSource.getRepository(DeliveredGeneralQuota);
    let deliveredGQCreated = 0;
    for (const u of ufRecords) {
        const existing = await deliveredGQRepo.findOne({ where: { ufId: u.id } });
        if (!existing) {
            await deliveredGQRepo.save(deliveredGQRepo.create({ ufId: u.id, van: 0, ambulance: 0, microbus: 0 }));
            deliveredGQCreated++;
        }
    }
    console.log("  ✓ delivered_general_quota: " + deliveredGQCreated + " linha(s) criada(s), " + (ufRecords.length - deliveredGQCreated) + " já existiam");


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
    const USERS_TO_SEED: { name: string; surname: string; role: string }[] = [
        // { name: "Amanda", surname: "Chaves", role: "admin"  },
        // { name: "Igor",   surname: "Lins",  role: "admin" },
        // { name: "Juarez", surname: "Silva", role: "admin"  },
        // { name: "Rosalva", surname: "Silva", role: "gestor_transporte"       },
        // { name: "Andressa", surname: "Gorla", role: "gestor_transporte"       },
        // { name: "Henrique", surname: "Faria", role: "gestor_transporte"       },
        // { name: "Maria", surname: "Torquato", role: "gestor_transporte"       },
        // { name: "Thiago", surname: "Marcal", role: "visualizador_transporte" },
        // { name: "Philippe", surname: "Rodrigues", role: "visualizador_transporte" },
        // { name: "Raquel", surname: "Machado", role: "visualizador_transporte" },
        // { name: "Crystina", surname: "Yamamoto", role: "visualizador_transporte" },
        // { name: "Diana", surname: "Pereira", role: "gestor_all_combo" },
        // { name: "Marta",  surname: "Peres",    role: "gestor_geral" },
        // { name: "Erico",  surname: "Cordeiro", role: "gestor_geral" },
    ];

    if (USERS_TO_SEED.length > 0) {
        console.log("\n  Usuarios extras:");
        for (const u of USERS_TO_SEED) {
            const email = `${generateLogin(u.name, u.surname)}@saude.gov.br`;
            const alreadyExists = await userRepo.findOne({ where: { email } });
            if (!alreadyExists) {
                const plain = generatePassword(u.name, u.surname);
                const hashed = await bcrypt.hash(plain, hashAmount);
                const role = await roleRepo.findOne({ where: { name: u.role } });
                if (!role) throw new Error(`Role "${u.role}" não encontrada no banco. Rode o seed de roles antes.`);
                await userRepo.save(userRepo.create({
                    name: u.name,
                    surname: u.surname,
                    email,
                    password: hashed,
                    roleId: role.id,
                }));
                if (process.env.SEND_EMAIL !== "false") {
                    await sendCredentialsEmail({
                        to: email,
                        name: u.name,
                        password: plain,
                    }).catch((err: Error) => console.warn("  ! Email falhou para", email, "-", err.message));
                } else {
                    console.log("    (email desabilitado — SEND_EMAIL=false)");
                }
                console.log("    + " + email + " | role=" + role.name + " | " + plain);
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
