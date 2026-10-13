import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CusteioMunicipioRef } from "./entities/custeio-municipio-ref.entity";
import { CusteioDistanciaCache } from "./entities/custeio-distancia-cache.entity";
import { CalcularDistanciaLinhaDto } from "./dto/custeio.dto";

const NOMINATIM_URL = process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org";
const OSRM_URL = process.env.OSRM_URL ?? "https://router.project-osrm.org";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT ?? "ATS-DECAN-MS/1.0 (painel de acompanhamento de transportes)";
/** Políticas dos serviços públicos: ~1 requisição por segundo. */
const INTERVALO_NOMINATIM_MS = 1100;
const INTERVALO_OSRM_MS = 600;
const TIMEOUT_MS = 20_000;
/** Ponto mais longe que isso da estrada mais próxima = provavelmente sem acesso rodoviário (ilha, rio). */
const SNAP_MAX_M = 10_000;

const UFS = new Set([
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

export interface DistanciaTrecho {
    km: number | null;
    /** Município de referência usado (quando há mais de um, o mais próximo). */
    referencia?: string;
    avisos: string[];
}

export interface DistanciaLinhaResultado {
    chave: string;
    rt: DistanciaTrecho;
    hd: DistanciaTrecho;
}

function chaveNome(n: string): string {
    return n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** "Porto Velho/RO", "Porto Velho — RO", "Porto Velho, RO"; vários: "Feira de Santana e Salvador", "A, B". */
export function parseReferencias(texto: string, ufPadrao: string): { nome: string; uf: string }[] {
    const partes = texto.split(/\s+e\s+|;|,/).map((p) => p.trim()).filter(Boolean);
    const saida: { nome: string; uf: string }[] = [];
    for (const parte of partes) {
        if (UFS.has(parte.toUpperCase()) && saida.length > 0 && !saida[saida.length - 1].uf.startsWith("!")) {
            saida[saida.length - 1].uf = parte.toUpperCase();
            continue;
        }
        const m = /^(.+?)\s*(?:\/|—|–|-)\s*([A-Za-z]{2})$/.exec(parte);
        if (m && UFS.has(m[2].toUpperCase())) saida.push({ nome: m[1].trim(), uf: m[2].toUpperCase() });
        else saida.push({ nome: parte, uf: ufPadrao });
    }
    return saida;
}

class AvisoDistancia extends Error {}

@Injectable()
export class DistanciaService {
    private readonly log = new Logger(DistanciaService.name);
    private readonly proximo = { nominatim: 0, osrm: 0 };

    constructor(
        @InjectRepository(CusteioMunicipioRef) private readonly refs: Repository<CusteioMunicipioRef>,
        @InjectRepository(CusteioDistanciaCache) private readonly cache: Repository<CusteioDistanciaCache>,
    ) {}

    async calcular(uf: string, linhas: CalcularDistanciaLinhaDto[]): Promise<DistanciaLinhaResultado[]> {
        if (!UFS.has(uf)) throw new BadRequestException("UF inválida");
        const porUf = new Map<string, Map<string, CusteioMunicipioRef>>();
        const memoria = new Map<string, number | null>();

        const municipiosDa = async (sigla: string) => {
            let mapa = porUf.get(sigla);
            if (!mapa) {
                const lista = await this.refs.find({ where: { uf: sigla } });
                mapa = new Map(lista.map((m) => [chaveNome(m.municipio), m]));
                porUf.set(sigla, mapa);
            }
            return mapa;
        };

        const resultados: DistanciaLinhaResultado[] = [];
        for (const l of linhas) {
            const origem = (await municipiosDa(uf)).get(chaveNome(l.origem.replace(/\s*\(.*\)\s*$/, "")));
            const trecho = async (texto: string | null | undefined): Promise<DistanciaTrecho> => {
                if (!texto?.trim()) return { km: null, avisos: [] };
                if (!origem) return { km: null, avisos: [`Município atendido "${l.origem}" não encontrado em ${uf}`] };
                const avisos: string[] = [];
                const candidatos = parseReferencias(texto, l.refUf?.toUpperCase() || uf);
                let melhor: { km: number; nome: string } | null = null;
                for (const c of candidatos) {
                    const destino = (await municipiosDa(c.uf)).get(chaveNome(c.nome));
                    if (!destino) { avisos.push(`Referência "${c.nome}" não encontrada em ${c.uf}`); continue; }
                    try {
                        const km = await this.distancia(origem, destino, memoria);
                        if (melhor === null || km < melhor.km) melhor = { km, nome: `${destino.municipio}/${destino.uf}` };
                    } catch (e) {
                        avisos.push(e instanceof AvisoDistancia ? e.message : `Falha ao calcular até ${c.nome}`);
                        if (!(e instanceof AvisoDistancia)) this.log.warn(`${origem.municipio} -> ${c.nome}: ${String(e)}`);
                    }
                }
                if (melhor && candidatos.length > 1) avisos.push(`Referência com mais de um município: usada a mais próxima (${melhor.nome})`);
                return { km: melhor?.km ?? null, ...(melhor ? { referencia: melhor.nome } : {}), avisos };
            };
            resultados.push({ chave: l.chave, rt: await trecho(l.refRt), hd: await trecho(l.refHd) });
        }
        return resultados;
    }

    /** Km por estrada entre dois municípios: cache, depois OSRM com as coordenadas do Nominatim. */
    private async distancia(o: CusteioMunicipioRef, d: CusteioMunicipioRef, memoria: Map<string, number | null>): Promise<number> {
        if (o.codigoIbge === d.codigoIbge) return 0;
        const k = `${o.codigoIbge}>${d.codigoIbge}`;
        if (memoria.has(k)) {
            const v = memoria.get(k);
            if (v === null || v === undefined) throw new AvisoDistancia(`Sem rota de ${o.municipio} até ${d.municipio}`);
            return v;
        }
        const guardada = await this.cache.findOne({ where: { origemIbge: o.codigoIbge, destinoIbge: d.codigoIbge } });
        if (guardada) { const kmCima = Math.ceil(guardada.km - 1e-9); memoria.set(k, kmCima); return kmCima; }

        const po = await this.coordenadas(o);
        const pd = await this.coordenadas(d);
        const url = `${OSRM_URL}/table/v1/driving/${po.lon},${po.lat};${pd.lon},${pd.lat}?sources=0&destinations=1&annotations=distance`;
        await this.esperar("osrm", INTERVALO_OSRM_MS);
        const resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!resp.ok) throw new Error(`OSRM HTTP ${resp.status}`);
        const corpo = (await resp.json()) as {
            code?: string;
            distances?: (number | null)[][];
            sources?: { distance?: number }[];
            destinations?: { distance?: number }[];
        };
        const metros = corpo.distances?.[0]?.[0];
        if (corpo.code !== "Ok" || metros === null || metros === undefined) {
            memoria.set(k, null);
            throw new AvisoDistancia(`Sem rota de ${o.municipio} até ${d.municipio}`);
        }
        const snap = Math.max(corpo.sources?.[0]?.distance ?? 0, corpo.destinations?.[0]?.distance ?? 0);
        if (snap > SNAP_MAX_M) {
            memoria.set(k, null);
            throw new AvisoDistancia(
                `Sem acesso rodoviário confiável entre ${o.municipio} e ${d.municipio} (ponto a ${Math.round(snap / 1000)} km da estrada mais próxima)`,
            );
        }
        // Sempre para cima: 50,3 km conta como 51 km.
        const km = Math.ceil(metros / 1000 - 1e-9);
        await this.cache.save(this.cache.create({ origemIbge: o.codigoIbge, destinoIbge: d.codigoIbge, km }));
        memoria.set(k, km);
        return km;
    }

    /** Coordenadas do município: guardadas ou consultadas no Nominatim (validando o estado do resultado). */
    private async coordenadas(m: CusteioMunicipioRef): Promise<{ lat: number; lon: number }> {
        if (m.lat !== null && m.lon !== null) return { lat: m.lat, lon: m.lon };
        const q = encodeURIComponent(`${m.municipio}, ${m.uf}, Brasil`);
        const url = `${NOMINATIM_URL}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&q=${q}`;
        await this.esperar("nominatim", INTERVALO_NOMINATIM_MS);
        const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!resp.ok) throw new Error(`Nominatim HTTP ${resp.status}`);
        const lista = (await resp.json()) as { lat: string; lon: string; address?: Record<string, string> }[];
        const doEstado = lista.find((r) => {
            const iso = r.address?.["ISO3166-2-lvl4"];
            return !iso || iso.toUpperCase() === `BR-${m.uf}`;
        });
        if (!doEstado) throw new AvisoDistancia(`Coordenadas de ${m.municipio}/${m.uf} não encontradas no Nominatim`);
        const lat = Number(doEstado.lat);
        const lon = Number(doEstado.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new AvisoDistancia(`Coordenadas inválidas para ${m.municipio}/${m.uf}`);
        await this.refs.update({ codigoIbge: m.codigoIbge }, { lat, lon, geocodificadoEm: new Date() });
        m.lat = lat;
        m.lon = lon;
        return { lat, lon };
    }

    /** Reserva um horário (fila) para respeitar o intervalo mínimo entre chamadas de cada serviço. */
    private async esperar(servico: "nominatim" | "osrm", intervaloMs: number): Promise<void> {
        const agora = Date.now();
        const horario = Math.max(agora, this.proximo[servico]);
        this.proximo[servico] = horario + intervaloMs;
        if (horario > agora) await new Promise((r) => setTimeout(r, horario - agora));
    }
}
